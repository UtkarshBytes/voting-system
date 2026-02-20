'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, ShieldAlert, Shield, ArrowLeft, CheckCircle, Smartphone, UserCheck, AlertTriangle, ChevronRight, X, Info } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { VoterCard } from '@/components/voter-card';

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

  const calculateSecurityScore = () => {
      if (!user) return 0;
      let score = 0;
      if (user.kyc?.status === 'VERIFIED') score += 50;
      if (user.faceDescriptor) score += 50;
      return score;
  };

  const getSecurityLevel = (score: number) => {
      if (score === 100) return { label: 'HIGH', color: 'text-emerald-600', bg: 'bg-emerald-500' };
      if (score >= 50) return { label: 'MEDIUM', color: 'text-amber-600', bg: 'bg-amber-500' };
      return { label: 'LOW', color: 'text-red-600', bg: 'bg-red-500' };
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const securityScore = calculateSecurityScore();
  const securityLevel = getSecurityLevel(securityScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-2">
                <Button variant="ghost" onClick={() => router.push('/dashboard')} className="pl-0 text-slate-500 hover:text-slate-900 hover:bg-transparent -ml-2 mb-1">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                        <ShieldCheck className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Security Center</h1>
                        <p className="text-slate-500 font-medium">Manage your identity verification and security protocols.</p>
                    </div>
                </div>
            </div>

            {/* Security Score Widget */}
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 min-w-[280px] flex items-center gap-4 hover:shadow-xl transition-shadow duration-300">
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                        <span>Security Level</span>
                        <span className={securityLevel.color}>{securityLevel.label}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${securityLevel.bg}`}
                            style={{ width: `${securityScore}%` }}
                        ></div>
                    </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-slate-50 border-4 border-white shadow-inner ${securityLevel.color}`}>
                    {securityScore}%
                </div>
            </div>
        </div>

        {message && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3">
                    <div className="p-1 bg-emerald-100 rounded-full">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{message}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMessage(null)} className="text-emerald-500 hover:text-emerald-800 hover:bg-emerald-100 rounded-full h-8 w-8">
                    <X className="w-4 h-4" />
                </Button>
            </div>
        )}

        <div className="grid gap-8">

            {/* SECTION 0: DIGITAL VOTER ID (Verified Only) */}
            {user.kyc.status === 'VERIFIED' && (
                <div className="flex justify-center animate-in fade-in slide-in-from-top-8 duration-700">
                    <VoterCard user={user} className="w-full max-w-lg transform hover:rotate-1 transition-transform duration-500" />
                </div>
            )}

            {/* SECTION 1: IDENTITY VERIFICATION (KYC) */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                <div className="p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                    <div className="flex items-start gap-6">
                        <div className={`p-4 rounded-2xl shadow-inner shrink-0 ${
                            user.kyc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600' :
                            user.kyc.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                            'bg-blue-50 text-blue-600'
                        }`}>
                            <UserCheck className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Identity Verification</h2>
                            <p className="text-slate-500 max-w-md">
                                Verify your identity securely to participate in restricted elections and unlock full platform features.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Status</span>
                            {user.kyc.status === 'VERIFIED' && (
                                <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm border border-emerald-200 shadow-sm flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Verified
                                </span>
                            )}
                            {user.kyc.status === 'PENDING' && (
                                <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 font-bold text-sm border border-amber-200 shadow-sm flex items-center gap-2 animate-pulse">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Pending Review
                                </span>
                            )}
                            {user.kyc.status === 'REJECTED' && (
                                <span className="px-4 py-1.5 rounded-full bg-red-100 text-red-700 font-bold text-sm border border-red-200 shadow-sm flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Rejected
                                </span>
                            )}
                            {user.kyc.status === 'NOT_STARTED' && (
                                <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 font-bold text-sm border border-slate-200 shadow-sm">
                                    Not Started
                                </span>
                            )}
                        </div>

                        {user.kyc.status === 'NOT_STARTED' && (
                            <Button
                                onClick={handleStartKYC}
                                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all rounded-xl h-11 px-6 font-semibold"
                            >
                                Start Verification <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                        {user.kyc.status === 'PENDING' && (
                            <Button variant="outline" onClick={handleManualVerify} className="w-full md:w-auto text-xs text-slate-400 border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-600">
                                Simulate Approval (Demo)
                            </Button>
                        )}
                    </div>
                </div>
                {user.kyc.status !== 'VERIFIED' && (
                    <div className="bg-slate-50 px-8 py-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <Info className="w-4 h-4 text-blue-500" />
                        Verification typically takes 1-2 business days.
                    </div>
                )}
            </div>

            {/* SECTION 2: FACE AUTHORIZATION */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 relative">
                {/* Subtle Gradient Accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500"></div>

                <div className="p-8">
                    <div className="flex items-start gap-6 mb-8">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner shrink-0">
                            <Smartphone className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-1">Biometric Authentication</h2>
                            <p className="text-slate-500 max-w-lg">
                                Enhance account security by enabling facial recognition. This allows for secure, password-less voting and login.
                            </p>
                        </div>
                    </div>

                    {!isFaceScanning ? (
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                                    user.faceDescriptor ? 'bg-white border-emerald-100 text-emerald-500 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-300'
                                }`}>
                                    {user.faceDescriptor ? <CheckCircle className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">
                                        {user.faceDescriptor ? "Biometrics Configured" : "Not Configured"}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {user.faceDescriptor
                                            ? "Your face data is encrypted and secure."
                                            : "No biometric data found on this device."}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                {user.faceDescriptor && (
                                    <Button
                                        variant="destructive"
                                        className="rounded-xl h-11 px-6 shadow-md bg-red-500 hover:bg-red-600 hover:shadow-lg transition-all"
                                        onClick={async () => {
                                            if(!confirm('Are you sure you want to remove your biometric data? This action cannot be undone.')) return;
                                            try {
                                                await AuthService.removeFace();
                                                await fetchUser();
                                                setMessage("Biometric Data Removed Successfully.");
                                            } catch(e: any) {
                                                setMessage(e.message);
                                            }
                                        }}
                                    >
                                        Remove
                                    </Button>
                                )}
                                <Button
                                    className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white rounded-xl h-11 px-6 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all font-semibold w-full md:w-auto"
                                    onClick={() => setIsFaceScanning(true)}
                                >
                                    {user.faceDescriptor ? "Update Face Data" : "Enable Biometrics"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-slate-900 rounded-2xl p-1 shadow-2xl ring-4 ring-slate-100">
                                <FaceRecognition onFaceDetected={handleFaceRegistered} isRegistration={true} />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setIsFaceScanning(false)}
                                className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-50"
                            >
                                Cancel Scanning
                            </Button>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
