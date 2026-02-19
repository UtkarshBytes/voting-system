'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, ShieldAlert, Shield, ArrowLeft, CheckCircle, Smartphone } from 'lucide-react';
import { AuthService } from '@/lib/auth';

const FaceRecognition = dynamic(() => import('@/components/face-recognition'), { ssr: false });

export default function SecurityProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
        const res = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include'
        });
        if (res.status === 401) {
            router.push('/login');
            return;
        }
        const data = await res.json();
        setUser(data.user);
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleStartKYC = async () => {
      try {
          const res = await fetch('/api/kyc/start', { method: 'POST', credentials: 'include' });
          if (res.ok) {
              await fetchUser();
              setMessage("KYC Verification Started. Status is now PENDING.");
          }
      } catch (error) {
          console.error(error);
      }
  };

  const handleManualVerify = async () => {
      // Demo only: Simulate admin approval
      try {
          const res = await fetch('/api/kyc/verify', { method: 'POST', credentials: 'include' });
          if (res.ok) {
              await fetchUser();
              setMessage("KYC Manually Verified (Demo).");
          }
      } catch (error) {
          console.error(error);
      }
  };

  const handleFaceRegistered = async (descriptor: Float32Array) => {
      try {
          await AuthService.registerFace(descriptor);
          setIsFaceScanning(false);
          await fetchUser();
          setMessage("Face Authentication Enabled & KYC Verified.");
      } catch (err: any) {
          setMessage(err.message);
          setIsFaceScanning(false);
      }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.push('/dashboard')} className="gap-2 pl-0">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold">Security Center</h1>
        <p className="text-muted-foreground">Manage your identity verification and security settings.</p>

        {message && (
            <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> {message}
            </div>
        )}

        {/* 1. Identity Verification */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Identity Verification (KYC)
                </CardTitle>
                <CardDescription>
                    Verify your identity to ensure a trusted voting process.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-3">
                        {user.kyc.status === 'VERIFIED' && <ShieldCheck className="w-8 h-8 text-green-500" />}
                        {user.kyc.status === 'PENDING' && <ShieldAlert className="w-8 h-8 text-yellow-500" />}
                        {user.kyc.status === 'NOT_STARTED' && <Shield className="w-8 h-8 text-muted-foreground" />}
                        {user.kyc.status === 'REJECTED' && <ShieldAlert className="w-8 h-8 text-red-500" />}

                        <div>
                            <div className="font-semibold">
                                {user.kyc.status === 'NOT_STARTED' && "Verification Not Started"}
                                {user.kyc.status === 'PENDING' && "Pending Verification"}
                                {user.kyc.status === 'VERIFIED' && "KYC Verified"}
                                {user.kyc.status === 'REJECTED' && "Verification Failed"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Method: {user.kyc.method}
                            </div>
                        </div>
                    </div>
                    <div>
                        {user.kyc.status === 'NOT_STARTED' && (
                            <Button onClick={handleStartKYC}>Start Verification</Button>
                        )}
                        {user.kyc.status === 'PENDING' && (
                            <Button variant="outline" onClick={handleManualVerify}>Simulate Approval (Demo)</Button>
                        )}
                        {user.kyc.status === 'VERIFIED' && (
                            <Badge variant="secondary" className="text-green-600 bg-green-100">Verified</Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* 2. Face Authentication */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" /> Face Authorization
                </CardTitle>
                <CardDescription>
                    Enable biometric verification for secure voting.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isFaceScanning ? (
                    <div className="space-y-4">
                        <FaceRecognition onFaceDetected={handleFaceRegistered} isRegistration={true} />
                        <Button variant="ghost" onClick={() => setIsFaceScanning(false)} className="w-full">Cancel</Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                        <div>
                            <div className="font-semibold">
                                {user.faceDescriptor ? "Biometrics Configured" : "Biometrics Not Configured"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {user.faceDescriptor
                                    ? "Your face data is stored securely for voting verification."
                                    : "Register your face to vote securely without passwords."}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {user.faceDescriptor && (
                                <Button
                                    variant="destructive"
                                    onClick={async () => {
                                        if(!confirm('Are you sure you want to remove your biometric data?')) return;
                                        try {
                                            await AuthService.removeFace();
                                            await fetchUser();
                                            setMessage("Biometric Data Removed.");
                                        } catch(e: any) {
                                            setMessage(e.message);
                                        }
                                    }}
                                >
                                    Remove
                                </Button>
                            )}
                            <Button
                                variant={user.faceDescriptor ? "outline" : "default"}
                                onClick={() => setIsFaceScanning(true)}
                            >
                                {user.faceDescriptor ? "Update Face" : "Enable Biometrics"}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
