'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, CheckCircle, XCircle } from 'lucide-react';
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
  const [statusMessage, setStatusMessage] = useState<string>('Initializing face detection models...');

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
        setStatusMessage('Models loaded. Ready to scan.');
      } catch (error) {
        console.error('Error loading models:', error);
        setStatusMessage('Face authentication unavailable.');
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
    setStatusMessage('Starting camera...');
    setConsecutiveFrames(0);

    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatusMessage('Looking for a face...');

        // Timeout
        setTimeout(() => {
            if (detectionStatus !== 'success') {
                stopVideo();
                setDetectionStatus('error');
                setStatusMessage('Face not detected / Try again.');
            }
        }, CAPTURE_TIMEOUT);
      })
      .catch((err) => {
        console.error('Error accessing webcam:', err);
        setStatusMessage('Camera access failed.');
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
                setStatusMessage("Invalid face descriptor. Please try again.");
                localCapturedDescriptors = []; // Reset
                return;
            }

            localCapturedDescriptors.push(descriptor);
            setConsecutiveFrames(localCapturedDescriptors.length);
            setStatusMessage(`Stabilizing face... ${localCapturedDescriptors.length}/${MIN_SAMPLES}`);

            if (localCapturedDescriptors.length >= MIN_SAMPLES) {
                if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
                finishCapture(localCapturedDescriptors);
            }
        } else if (detections.length > 1) {
            setStatusMessage("Multiple faces detected. Please ensure only one face is visible.");
            localCapturedDescriptors = []; // Reset on instability
            setConsecutiveFrames(0);
        } else {
            // No face detected
            setStatusMessage("Looking for a face... Move closer or adjust light.");
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
      setStatusMessage('Face captured successfully!');
      stopVideo();
      try {
          onFaceDetected(avgDescriptor);
      } catch (e) {
          console.error("Error in onFaceDetected callback:", e);
          setDetectionStatus('error');
          setStatusMessage('Error processing face data. Please try again or use password.');
      }
  };

  return (
    <div className={cn("flex flex-col items-center gap-4 p-4 border rounded-lg bg-secondary/20", detectionStatus === 'error' ? "border-red-500/50 bg-red-500/10" : "")}>
      <div className="relative w-full max-w-sm aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
        {!isCapturing && detectionStatus !== 'success' && (
          <div className="text-muted-foreground flex flex-col items-center">
            {detectionStatus === 'loading' ? (
                <Loader2 className="w-12 h-12 mb-2 animate-spin opacity-50" />
            ) : detectionStatus === 'error' ? (
                <XCircle className="w-12 h-12 mb-2 text-red-500 opacity-80" />
            ) : (
                <Camera className="w-12 h-12 mb-2 opacity-50" />
            )}
            <p className="text-sm text-center px-4">{statusMessage}</p>
          </div>
        )}

        {isCapturing && (
           <>
            <video
                ref={videoRef}
                autoPlay
                muted
                onPlay={handleVideoPlay}
                className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
           </>
        )}

        {detectionStatus === 'success' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="flex flex-col items-center text-green-400">
                    <CheckCircle className="w-16 h-16 mb-2" />
                    <p className="font-bold">Face Verified</p>
                </div>
            </div>
        )}
      </div>

      <div className="flex gap-2 w-full">
        {!isCapturing && detectionStatus !== 'success' && (
            <Button
                onClick={startVideo}
                disabled={!modelsLoaded}
                className="w-full"
                variant={detectionStatus === 'error' ? "destructive" : "outline"}
            >
                {detectionStatus === 'loading'
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading Models...</>
                    : modelsLoaded ? (detectionStatus === 'error' ? 'Retry Face Scan' : 'Start Face Scan') : 'Waiting for models...'}
            </Button>
        )}

        {isCapturing && (
            <Button
                onClick={() => {
                    stopVideo();
                    setDetectionStatus('idle');
                    setStatusMessage('Scan cancelled.');
                }}
                variant="destructive"
                className="w-full"
            >
                Cancel Scan
            </Button>
        )}

        {detectionStatus === 'success' && (
            <Button
                onClick={() => {
                    setDetectionStatus('idle');
                    setStatusMessage('Ready to scan.');
                }}
                variant="outline"
                className="w-full"
            >
                Re-scan Face
            </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {isRegistration
            ? "This will store your biometrics for future voting verification."
            : "Scan your face to verify identity."}
      </p>
    </div>
  );
}
