'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, CheckCircle, ShieldCheck, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaceAuthProps {
  onFaceDetected: (descriptor: Float32Array) => void;
  isRegistration?: boolean;
}

export default function FaceRecognition({ onFaceDetected, isRegistration = false }: FaceAuthProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<'idle' | 'loading' | 'detecting' | 'capturing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Initializing secure face scan...');

  // State for stabilization
  const [consecutiveFrames, setConsecutiveFrames] = useState(0);

  // Constants
  const MIN_SAMPLES = 5; // Average 5 consecutive samples
  const CAPTURE_TIMEOUT = 20000; // 20 seconds timeout (increased)

  useEffect(() => {
    const loadModels = async () => {
      try {
        setDetectionStatus('loading');
        const MODEL_URL = '/models';
        console.log("Loading models from " + MODEL_URL);

        await Promise.all([
          // Use TinyFaceDetector for better performance/reliability in browser
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        console.log("Models loaded");
        setModelsLoaded(true);
        setDetectionStatus('idle');
        setStatusMessage('Ready to verify identity.');
      } catch (error) {
        console.error('Error loading models:', error);
        setStatusMessage('Biometric service unavailable.');
        setDetectionStatus('error');
      }
    };
    loadModels();

    // Cleanup on unmount
    return () => {
        stopVideo();
    };
  }, []);

  const startVideo = () => {
    stopVideo(); // Ensure clean state
    setIsCapturing(true);
    setDetectionStatus('detecting');
    setStatusMessage('Starting secure camera...');
    setConsecutiveFrames(0);

    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatusMessage('Position your face in the frame...');

        // Timeout
        setTimeout(() => {
            if (detectionStatus !== 'success') {
                stopVideo();
                setDetectionStatus('error');
                setStatusMessage('Face not detected. Please try again.');
            }
        }, CAPTURE_TIMEOUT);
      })
      .catch((err) => {
        console.error('Error accessing webcam:', err);
        setStatusMessage('Camera access denied.');
        setDetectionStatus('error');
        setIsCapturing(false);
      });
  };

  const stopVideo = () => {
    // Clear detection loop
    if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
    }

    // Stop video stream
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }

    setIsCapturing(false);
  };

  // Called when video starts playing
  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Clear any existing loop just in case
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);

    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
    };

    faceapi.matchDimensions(canvasRef.current, displaySize);

    let localCapturedDescriptors: Float32Array[] = [];

    // Use TinyFaceDetector options
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) return;

      try {
        const detections = await faceapi
            .detectAllFaces(videoRef.current, options)
            .withFaceLandmarks()
            .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
        }

        if (detections.length === 1) {
            // Exactly one face detected
            setDetectionStatus('capturing');
            const descriptor = detections[0].descriptor;

            if (descriptor.length !== 128) {
                setStatusMessage("Analyzing biometrics...");
                localCapturedDescriptors = []; // Reset
                return;
            }

            localCapturedDescriptors.push(descriptor);
            setConsecutiveFrames(localCapturedDescriptors.length);
            setStatusMessage(`Verifying... ${Math.round((localCapturedDescriptors.length / MIN_SAMPLES) * 100)}%`);

            if (localCapturedDescriptors.length >= MIN_SAMPLES) {
                if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
                finishCapture(localCapturedDescriptors);
            }
        } else if (detections.length > 1) {
            setStatusMessage("Multiple faces detected.");
            localCapturedDescriptors = []; // Reset on instability
            setConsecutiveFrames(0);
        } else {
            // No face detected
            setStatusMessage("Looking for face...");
            localCapturedDescriptors = []; // Reset on instability
            setConsecutiveFrames(0);
        }
      } catch (err) {
          console.error("Detection error:", err);
      }
    }, 200); // Check every 200ms
  };

  const finishCapture = (descriptors: Float32Array[]) => {
      // Average the descriptors
      const numDescriptors = descriptors.length;
      const descriptorLength = descriptors[0].length;
      const avgDescriptor = new Float32Array(descriptorLength);

      for (let i = 0; i < descriptorLength; i++) {
          let sum = 0;
          for (let j = 0; j < numDescriptors; j++) {
              sum += descriptors[j][i];
          }
          avgDescriptor[i] = sum / numDescriptors;
      }

      setDetectionStatus('success');
      setStatusMessage('Identity Verified');
      stopVideo();
      try {
          onFaceDetected(avgDescriptor);
      } catch (e) {
          console.error("Error in onFaceDetected callback:", e);
          setDetectionStatus('error');
          setStatusMessage('Processing error. Please retry.');
      }
  };

  return (
    <div className="w-full">
      {/*
        Main Video Container
        - Full width
        - 16:9 Aspect Ratio (or responsive)
        - Rounded 2XL
        - Black Background
        - Shadow XL
      */}
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-white/10 group">

        {/* --- OVERLAY UI: Top Left Badge --- */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg animate-in fade-in slide-in-from-top-2 duration-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white/90 tracking-wide uppercase">Secure Live Scan</span>
        </div>

        {/* --- OVERLAY UI: Animated Scan Glow --- */}
        {isCapturing && (
            <div className="absolute inset-0 border-[6px] border-blue-500/20 rounded-2xl animate-pulse z-10 pointer-events-none box-border"></div>
        )}

        {/* --- VIDEO ELEMENT --- */}
        <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onPlay={handleVideoPlay}
            className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
                isCapturing ? "opacity-100" : "opacity-0"
            )}
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

        {/* --- STATE: IDLE / LOADING / ERROR (Not capturing) --- */}
        {!isCapturing && detectionStatus !== 'success' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-gradient-to-br from-slate-900 via-slate-800 to-black">
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

             {/* Icon Status */}
             <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                <div className="relative p-6 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-2xl">
                    {detectionStatus === 'loading' ? (
                        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                    ) : detectionStatus === 'error' ? (
                        <X className="w-10 h-10 text-red-400" />
                    ) : (
                        <Camera className="w-10 h-10 text-white/80" />
                    )}
                </div>
             </div>

             {/* Centered Start Button */}
             <Button
                onClick={startVideo}
                disabled={!modelsLoaded}
                className={cn(
                    "relative group/btn overflow-hidden bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full px-8 py-6 h-auto text-lg font-semibold shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-blue-500/20",
                    !modelsLoaded && "opacity-50 cursor-not-allowed"
                )}
             >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center gap-2">
                    {detectionStatus === 'loading' ? 'Loading AI Models...' : detectionStatus === 'error' ? 'Retry Camera' : 'Start Face Scan'}
                </span>
             </Button>

             <p className="mt-4 text-sm text-slate-400 font-medium tracking-wide">
                {statusMessage}
             </p>
          </div>
        )}

        {/* --- STATE: CAPTURING (Cancel Button) --- */}
        {isCapturing && (
            <div className="absolute bottom-6 left-0 right-0 z-30 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white/90 text-sm font-medium shadow-lg">
                    {statusMessage}
                </div>
                <Button
                    onClick={() => {
                        stopVideo();
                        setDetectionStatus('idle');
                        setStatusMessage('Scan cancelled.');
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
                >
                    Cancel Scan
                </Button>
            </div>
        )}

        {/* --- STATE: SUCCESS --- */}
        {detectionStatus === 'success' && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-in zoom-in duration-300">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Identity Verified</h3>
                <p className="text-emerald-200/80 text-sm mb-6">You may proceed securely.</p>

                <Button
                    onClick={() => {
                        setDetectionStatus('idle');
                        setStatusMessage('Ready to scan.');
                        startVideo(); // Allow re-scan immediately if needed
                    }}
                    variant="outline"
                    className="border-white/10 text-white hover:bg-white/10 rounded-full bg-transparent"
                >
                    <RefreshCw className="w-4 h-4 mr-2" /> Re-scan Face
                </Button>
            </div>
        )}
      </div>

      {/* --- Footer Text --- */}
      <p className="mt-4 text-xs text-center text-muted-foreground/60 max-w-xs mx-auto">
        {isRegistration
            ? "Your biometric data is encrypted and stored securely on the blockchain."
            : "Look directly at the camera. Ensure your face is well-lit."}
      </p>
    </div>
  );
}
