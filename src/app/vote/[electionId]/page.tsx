'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, ArrowLeft, ShieldCheck, AlertTriangle, KeyRound, Mail, RefreshCw, Copy, ExternalLink, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import FaceRecognition from '@/components/face-recognition';
import { cn } from '@/lib/utils';

const StepProgress = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { id: 1, label: "Verify Identity" },
    { id: 2, label: "OTP Confirmation" },
    { id: 3, label: "Vote Recorded" }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-12 px-4 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="relative flex justify-between items-center">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>

        {/* Active Progress Bar */}
        <div
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 -z-10 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step) => {
           const isCompleted = currentStep > step.id;
           const isCurrent = currentStep === step.id;
           const isActive = currentStep >= step.id;

           return (
             <div key={step.id} className="flex flex-col items-center gap-3 relative group">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-4 transition-all duration-500 ${
                    isActive
                      ? "bg-white border-blue-600 text-blue-600 shadow-lg shadow-blue-200 scale-110"
                      : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors duration-500 ${
                  isActive ? "text-slate-900" : "text-slate-400"
                }`}>
                  {step.label}
                </span>
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default function VotePage() {
  const router = useRouter();
  const params = useParams();
  const electionId = params.electionId as string;

  const [election, setElection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [voteReceipt, setVoteReceipt] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Voting flow state
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [step, setStep] = useState<'select' | 'verify' | 'confirm' | 'otp'>('select');

  // OTP State
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    // Only fetch if we don't have a receipt yet
    if (!voteReceipt) {
      checkAuthAndFetchElection();
    }
  }, [electionId, voteReceipt]);

  const checkAuthAndFetchElection = async () => {
    try {
      // Check auth
      const authRes = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });
      if (authRes.status === 401) {
        router.push('/login');
        return;
      }

      // Fetch election
      const res = await fetch(`/api/elections/${electionId}`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!res.ok) {
        setError('Election not found');
        return;
      }
      const data = await res.json();
      setElection(data.election);
    } catch (err) {
      console.error(err);
      setError('Failed to load election');
    } finally {
      setIsLoading(false);
    }
  };

  const onCandidateSelect = (candidateId: string) => {
    setSelectedCandidate(candidateId);
    setStep('verify');
    setUsePassword(false); // Default to face
    setPassword('');
    setFaceDescriptor(null);
  };

  const onFaceDetected = (descriptor: Float32Array) => {
    setFaceDescriptor(descriptor);
    setStep('confirm');
  };

  const verifyPassword = async () => {
      if (!password) {
          setError("Password is required");
          return;
      }
      setStep('confirm');
  };

  const handleRequestOtp = async () => {
    if (!selectedCandidate) return;
    if (!faceDescriptor && !password) return;

    setSubmitting(true);
    setError(null);

    try {
      const body: any = {
          electionId,
          candidateId: selectedCandidate,
      };

      if (faceDescriptor) {
          body.faceDescriptor = Array.from(faceDescriptor);
      } else if (password) {
          body.password = password;
      }

      const response = await fetch('/api/vote/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
             throw new Error(data.error || "Verification failed.");
        }
        throw new Error(data.error || 'Failed to request OTP');
      }

      setMaskedEmail(data.email);
      setStep('otp');
      setTimeLeft(120); // Reset timer
      // Focus first OTP input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);

    } catch (err: any) {
      setError(err.message);
      if (err.message.includes("Verification") || err.message.includes("Biometric") || err.message.includes("Password")) {
          setStep('verify');
          setFaceDescriptor(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
      const otpCode = otp.join('');
      if (otpCode.length !== 6) {
          setError("Please enter a valid 6-character OTP");
          return;
      }

      setSubmitting(true);
      setError(null);

      try {
          const response = await fetch('/api/vote/verify-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                  electionId,
                  otp: otpCode
              }),
          });

          const data = await response.json();

          if (!response.ok) {
              throw new Error(data.error || 'OTP verification failed');
          }

          setVoteReceipt(data.receipt);
      } catch (err: any) {
          setError(err.message);
          // Don't clear OTP immediately, let user retry if attempts allow
          if (err.message.includes("invalidated")) {
              setStep('select'); // Restart flow? Or go back to dashboard?
              router.push('/dashboard');
          }
      } finally {
          setSubmitting(false);
      }
  };

  const handleResendOtp = async () => {
      // Re-trigger OTP request
      await handleRequestOtp();
  };

  const handleOtpChange = (index: number, value: string) => {
      const upper = value.toUpperCase().slice(-1); // Take only the last character entered
      const newOtp = [...otp];
      newOtp[index] = upper;
      setOtp(newOtp);

      // Auto-focus next input if value exists
      if (upper && index < 5) {
          inputRefs.current[index + 1]?.focus();
      }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      // If Backspace and current field is empty, move focus to previous
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
          inputRefs.current[index - 1]?.focus();
      }
  };

  const resetSelection = () => {
    setSelectedCandidate(null);
    setFaceDescriptor(null);
    setPassword('');
    setUsePassword(false);
    setStep('select');
    setError(null);
    setOtp(['', '', '', '', '', '']);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      // Could show toast here
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // --- RECEIPT VIEW (Step 3) ---
  if (voteReceipt) {
    const verifyUrl = `${window.location.origin}/verify?code=${voteReceipt.voteVerificationCode}`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col items-center py-12 px-4">

        <StepProgress currentStep={3} />

        <div className="w-full max-w-xl animate-in zoom-in-95 duration-500">
          <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden bg-white/90 backdrop-blur-xl">
            <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

            <CardHeader className="text-center pt-10 pb-2">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-in spin-in-180 duration-700">
                <CheckCircle className="w-12 h-12 text-emerald-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900">Vote Successfully Recorded</CardTitle>
              <CardDescription className="text-slate-500 mt-2 text-base">
                Your vote has been securely confirmed on the blockchain.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-8">

                {/* Election Title Badge */}
                <div className="text-center">
                    <Badge variant="outline" className="text-slate-600 border-slate-200 py-1 px-3 text-sm">
                        {election?.title}
                    </Badge>
                </div>

                {/* Receipt Details */}
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <span className="text-sm font-medium text-slate-500">Receipt ID</span>
                        <div className="flex items-center gap-2">
                            <code className="text-sm font-mono font-bold text-slate-800">{voteReceipt.voteVerificationCode}</code>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => copyToClipboard(voteReceipt.voteVerificationCode)}>
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <span className="text-sm font-medium text-slate-500">Block Number</span>
                        <span className="text-sm font-mono font-bold text-slate-800">#{voteReceipt.blockNumber}</span>
                    </div>

                    <div>
                        <span className="text-sm font-medium text-slate-500 block mb-1">Transaction Hash</span>
                        <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                            <code className="text-xs font-mono text-slate-600 truncate flex-1">{voteReceipt.transactionHash}</code>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => copyToClipboard(voteReceipt.transactionHash)}>
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="text-xs text-slate-400">Timestamp: {new Date(voteReceipt.timestamp).toLocaleString()}</span>
                    </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center gap-3 py-4">
                    <div className="bg-white p-3 rounded-xl border shadow-sm">
                        <QRCodeSVG value={verifyUrl} size={100} />
                    </div>
                    <p className="text-xs text-slate-400">Scan to verify externally</p>
                </div>

            </CardContent>

            <CardFooter className="flex flex-col gap-3 pb-8 px-8 bg-slate-50/50 border-t border-slate-100 pt-6">
                <Link href="/verify" className="w-full">
                    <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg hover:shadow-emerald-200 hover:scale-[1.01] transition-all">
                        Verify Publicly <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
                <Link href="/dashboard" className="w-full">
                  <Button variant="ghost" className="w-full h-12 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl">
                      Return to Dashboard
                  </Button>
                </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // --- SELECTION VIEW (Existing - slightly tweaked for consistency if needed, but keeping logic) ---
  if (step === 'select') {
    return (
        <div className="min-h-screen bg-slate-50/50 p-6">
          <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-8 transition-colors group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">{election?.title}</h1>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`px-3 py-1 text-xs font-bold tracking-wider border-0 ${election?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {election?.status}
                        </Badge>
                        <span className="text-sm text-slate-500 font-medium">
                            {election?.candidates?.length || 0} Candidates Running
                        </span>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Select a Candidate</h2>
                <p className="text-slate-500">Review the candidates below and click select to proceed to verification.</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl mb-8 flex items-center gap-3 shadow-sm animate-in slide-in-from-top-2"><AlertTriangle className="w-5 h-5"/> {error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {election?.candidates.map((candidate: any) => (
                <div
                    key={candidate.id}
                    className="relative flex flex-col bg-white rounded-[20px] shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden group border border-slate-100"
                >
                  <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-start justify-between gap-4 mb-6">
                          <div className="flex items-center gap-5">
                              <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0 ring-4 ring-white">
                                  {candidate.imageUrl ? (
                                      <img src={candidate.imageUrl} alt={candidate.name} className="h-full w-full object-cover" />
                                  ) : (
                                      <div className="text-2xl font-bold text-slate-300">
                                          {candidate.name.charAt(0)}
                                      </div>
                                  )}
                              </div>
                              <div>
                                  <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                                      {candidate.name}
                                  </h3>
                                  <p className="text-sm font-medium text-slate-500">
                                      {candidate.party}
                                  </p>
                              </div>
                          </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-50">
                          <div className="flex items-center justify-between mb-6">
                              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-md">
                                  Running for Office
                              </span>
                          </div>

                          <Button
                              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 hover:shadow-xl transition-all text-base font-semibold"
                              onClick={() => onCandidateSelect(candidate.id)}
                          >
                              Select Candidate
                          </Button>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
  }

  // --- VERIFICATION VIEW (Step 1 - Input) ---
  if (step === 'verify') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">

            <StepProgress currentStep={1} />

            <div className="w-full max-w-lg space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Button variant="ghost" onClick={resetSelection} className="self-start text-slate-500 hover:text-slate-900 pl-0 hover:bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Candidates
                </Button>

                <Card className="border-0 shadow-2xl rounded-2xl bg-white/80 backdrop-blur-md overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-900">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            Verify Identity
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-base">
                            Please verify your identity securely to proceed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex gap-3 items-center text-sm font-medium"><AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}</div>}

                         {!usePassword ? (
                             <div className="space-y-6">
                                <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner min-h-[300px] flex items-center justify-center relative">
                                    <FaceRecognition onFaceDetected={onFaceDetected} />
                                    {/* Overlay hints could go here */}
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-slate-200" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">Or verify with</span>
                                    </div>
                                </div>
                                <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900" onClick={() => setUsePassword(true)}>
                                    <KeyRound className="w-4 h-4 mr-2" /> Account Password
                                </Button>
                             </div>
                         ) : (
                             <div className="space-y-6 animate-in fade-in zoom-in-95">
                                 <div className="space-y-2">
                                     <label className="text-sm font-bold text-slate-700">Password</label>
                                     <Input
                                        type="password"
                                        placeholder="Enter your secure password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                                     />
                                 </div>
                                 <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-200" onClick={verifyPassword}>
                                     Verify Password
                                 </Button>
                                 <Button variant="ghost" className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-900" onClick={() => setUsePassword(false)}>
                                     Switch to Face Scan
                                 </Button>
                             </div>
                         )}
                    </CardContent>
                </Card>
            </div>
        </div>
      );
  }

  // --- CONFIRMATION VIEW (Step 1 - Success/Review) ---
  if (step === 'confirm') {
      const candidate = election?.candidates.find((c: any) => c.id === selectedCandidate);

      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">

             <StepProgress currentStep={1} />

             <div className="w-full max-w-xl space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <Button variant="ghost" onClick={() => { setStep('verify'); setFaceDescriptor(null); }} className="self-start text-slate-500 hover:text-slate-900 pl-0 hover:bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Re-verify
                </Button>

                <Card className="border-0 shadow-2xl rounded-2xl bg-white/90 backdrop-blur-xl overflow-hidden ring-1 ring-slate-900/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700">
                            Confirm Your Vote
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 text-sm font-medium">
                            <AlertTriangle className="w-4 h-4" />
                            This action cannot be undone. Please review carefully.
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">

                         {/* Candidate Card */}
                         <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-3 opacity-10">
                                 <ShieldCheck className="w-24 h-24" />
                             </div>

                             <div className="h-20 w-20 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-slate-200 shrink-0 z-10">
                                {candidate?.imageUrl ? (
                                    <img src={candidate.imageUrl} alt={candidate.name} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-slate-300">{candidate?.name?.charAt(0)}</span>
                                )}
                             </div>

                             <div className="z-10">
                                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">You are voting for</span>
                                 <h3 className="text-2xl font-bold text-slate-900 leading-tight">{candidate?.name}</h3>
                                 <p className="text-sm font-medium text-slate-500">{candidate?.party}</p>
                             </div>
                         </div>

                         {/* Biometric Success Banner */}
                         <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-xl shadow-lg shadow-emerald-200">
                             <div className="p-1 bg-white/20 rounded-full">
                                <CheckCircle className="w-5 h-5" />
                             </div>
                             <div>
                                 <p className="font-bold text-sm">Identity Verified Successfully</p>
                                 <p className="text-xs text-emerald-50 opacity-90">{faceDescriptor ? "Biometric scan confirmed" : "Secure password accepted"}</p>
                             </div>
                         </div>

                         {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex gap-3 items-center text-sm font-medium"><AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}</div>}
                    </CardContent>
                    <CardFooter className="pb-8 pt-2">
                         <Button
                            className="w-full text-lg h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-bold"
                            onClick={handleRequestOtp}
                            disabled={submitting}
                         >
                             {submitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Proceed to Final Step"}
                         </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
      );
  }

  // --- OTP VIEW (Step 2) ---
  if (step === 'otp') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">

            <StepProgress currentStep={2} />

            <div className="w-full max-w-lg space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                 <Button variant="ghost" onClick={() => setStep('confirm')} className="self-start text-slate-500 hover:text-slate-900 pl-0 hover:bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>

                <Card className="border-0 shadow-2xl rounded-2xl bg-white/90 backdrop-blur-xl overflow-hidden ring-1 ring-slate-900/5">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                            <Mail className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Email Verification Required</CardTitle>
                        <CardDescription className="text-slate-500 text-base max-w-xs mx-auto mt-2">
                            We've sent a 6-digit code to <span className="font-semibold text-slate-800">{maskedEmail}</span>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6">

                        <div className="flex justify-center gap-2 sm:gap-3">
                            {otp.map((digit, index) => (
                                <Input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="text"
                                    // maxLength removed to allow overwriting with "slicing" logic
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    onPaste={(e) => e.preventDefault()}
                                    className={cn(
                                        "w-14 h-16 text-center text-3xl font-bold rounded-xl border-2 transition-all duration-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:scale-105",
                                        digit
                                            ? "border-blue-500 bg-blue-50 text-blue-900"
                                            : "bg-white border-slate-200 text-slate-800"
                                    )}
                                    disabled={submitting}
                                />
                            ))}
                        </div>

                        {/* Countdown Timer */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <span>Time Remaining</span>
                                <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${timeLeft < 30 ? 'bg-red-500' : 'bg-blue-500'}`}
                                    style={{ width: `${(timeLeft / 120) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex gap-3 items-center text-sm font-medium animate-bounce"><AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}</div>}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pb-8">
                        <Button
                            className="w-full text-lg h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-bold"
                            onClick={handleVerifyOtp}
                            disabled={submitting || otp.some(d => !d)}
                        >
                            {submitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Confirm & Cast Vote"}
                        </Button>

                        <Button
                            variant="link"
                            className="text-slate-500 hover:text-blue-600 text-sm"
                            onClick={handleResendOtp}
                            disabled={timeLeft > 0 || submitting}
                        >
                            {timeLeft > 0 ? `Resend code in ${timeLeft}s` : "Resend Verification Code"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
      );
  }

  return null;
}
