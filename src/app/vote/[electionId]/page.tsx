'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, ArrowLeft, ShieldCheck, AlertTriangle, KeyRound, Mail } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import FaceRecognition from '@/components/face-recognition';

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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleOtpChange = (index: number, value: string) => {
      if (value.length > 1) {
          // Handle paste logic if needed, simplistically just take last char
          value = value.slice(-1);
      }

      const newOtp = [...otp];
      newOtp[index] = value.toUpperCase();
      setOtp(newOtp);

      // Auto-focus next
      if (value && index < 5) {
          inputRefs.current[index + 1]?.focus();
      }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // --- RECEIPT VIEW ---
  if (voteReceipt) {
    const verifyUrl = `${window.location.origin}/verify?code=${voteReceipt.voteVerificationCode}`;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20 p-4">
        <Card className="w-full max-w-lg border-green-500/50 shadow-xl animate-in fade-in zoom-in duration-500">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-600">Vote Cast Successfully!</CardTitle>
            <CardDescription>Your vote has been recorded on the blockchain.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="bg-primary/10 border border-primary/20 p-6 rounded-lg text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Verification Code</p>
                <div className="flex items-center justify-center gap-2">
                    <p className="text-3xl font-bold font-mono tracking-wider text-primary">
                        {voteReceipt.voteVerificationCode}
                    </p>
                </div>
                <p className="text-xs text-muted-foreground">Use this code to verify your vote anonymously</p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2 text-xs break-all font-mono">
              <div className="flex justify-between border-b pb-2 mb-2">
                 <span>Block #</span>
                 <span className="font-bold">{voteReceipt.blockNumber}</span>
              </div>
              <div>
                 <span className="text-muted-foreground">Transaction Hash:</span>
                 <p className="font-bold mt-1">{voteReceipt.transactionHash}</p>
              </div>
              <div className="pt-2 text-right text-muted-foreground">
                {new Date(voteReceipt.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2">
                <div className="bg-white p-2 rounded-lg border shadow-sm">
                    <QRCodeSVG value={verifyUrl} size={120} />
                </div>
                <p className="text-xs text-muted-foreground">Scan to verify</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 w-full">
                <Link href={`/results?id=${electionId}`} className="w-full">
                    <Button className="w-full" variant="outline">Live Results</Button>
                </Link>
                <Link href="/verify" className="w-full">
                    <Button className="w-full" variant="outline">Verify Vote</Button>
                </Link>
            </div>
            <Link href="/dashboard" className="w-full">
              <Button className="w-full">Return to Dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // --- SELECTION VIEW ---
  if (step === 'select') {
    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
          <div className="max-w-5xl mx-auto">
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">{election?.title}</h1>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-bold tracking-wider rounded-full ${election?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {election?.status}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            • {election?.candidates?.length || 0} Candidates
                        </span>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Select a Candidate</h2>
                <p className="text-muted-foreground">Review the candidates below and click select to proceed to verification.</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl mb-8 flex items-center gap-3 shadow-sm"><AlertTriangle className="w-5 h-5"/> {error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {election?.candidates.map((candidate: any) => (
                <div
                    key={candidate.id}
                    className="relative flex flex-col bg-card rounded-[16px] border border-border/50 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden group"
                >
                  <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-start justify-between gap-4 mb-6">
                          <div className="flex items-center gap-4">
                              <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
                                  {candidate.imageUrl ? (
                                      <img src={candidate.imageUrl} alt={candidate.name} className="h-full w-full object-cover" />
                                  ) : (
                                      <div className="text-2xl font-bold text-muted-foreground/30">
                                          {candidate.name.charAt(0)}
                                      </div>
                                  )}
                              </div>
                              <div>
                                  <h3 className="text-2xl font-bold text-foreground leading-tight mb-1 group-hover:text-primary transition-colors">
                                      {candidate.name}
                                  </h3>
                                  <p className="text-sm font-medium text-muted-foreground">
                                      {candidate.party}
                                  </p>
                              </div>
                          </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-border/50">
                          <div className="flex items-center justify-between mb-6">
                              <span className="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/5 px-2 py-1 rounded">
                                  Running for Office
                              </span>
                          </div>

                          <Button
                              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all text-base font-semibold"
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

  // --- VERIFICATION VIEW ---
  if (step === 'verify') {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-4">
                <Button variant="ghost" onClick={resetSelection} className="self-start">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Candidates
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                            Verify Identity
                        </CardTitle>
                        <CardDescription>
                            Please verify your identity to cast your vote.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {error && <div className="bg-red-500/10 text-red-500 p-3 text-sm rounded mb-4 flex gap-2 items-center"><AlertTriangle className="w-4 h-4" /> {error}</div>}

                         {!usePassword ? (
                             <>
                                <FaceRecognition onFaceDetected={onFaceDetected} />
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                                    </div>
                                </div>
                                <Button variant="outline" className="w-full" onClick={() => setUsePassword(true)}>
                                    <KeyRound className="w-4 h-4 mr-2" /> Use Password Instead
                                </Button>
                             </>
                         ) : (
                             <div className="space-y-4">
                                 <div className="space-y-2">
                                     <label className="text-sm font-medium">Password</label>
                                     <Input
                                        type="password"
                                        placeholder="Enter your account password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                     />
                                 </div>
                                 <Button className="w-full" onClick={verifyPassword}>Verify Password</Button>
                                 <Button variant="ghost" className="w-full" onClick={() => setUsePassword(false)}>
                                     Use Face Scan
                                 </Button>
                             </div>
                         )}
                    </CardContent>
                </Card>
            </div>
        </div>
      );
  }

  // --- CONFIRMATION VIEW ---
  if (step === 'confirm') {
      const candidateName = election?.candidates.find((c: any) => c.id === selectedCandidate)?.name;

      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
             <div className="w-full max-w-md space-y-4">
                <Button variant="ghost" onClick={() => { setStep('verify'); setFaceDescriptor(null); }} className="self-start">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Re-verify
                </Button>

                <Card className="border-primary/50">
                    <CardHeader>
                        <CardTitle>Confirm Vote</CardTitle>
                        <CardDescription>
                            You are about to cast a vote. This cannot be undone.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="bg-secondary/50 p-4 rounded-lg">
                             <span className="text-xs text-muted-foreground uppercase">Candidate</span>
                             <p className="text-xl font-bold">{candidateName}</p>
                         </div>

                         <div className="flex items-center gap-2 text-green-600 bg-green-500/10 p-3 rounded text-sm">
                             <CheckCircle className="w-4 h-4" />
                             {faceDescriptor ? "Biometric verification successful" : "Password verification provided"}
                         </div>

                         {error && <div className="bg-red-500/10 text-red-500 p-3 text-sm rounded flex gap-2 items-center"><AlertTriangle className="w-4 h-4" /> {error}</div>}
                    </CardContent>
                    <CardFooter>
                         <Button className="w-full text-lg h-12" onClick={handleRequestOtp} disabled={submitting}>
                             {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                             {submitting ? 'Generating OTP...' : 'Proceed to Confirmation'}
                         </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
      );
  }

  // --- OTP VIEW ---
  if (step === 'otp') {
      const candidateName = election?.candidates.find((c: any) => c.id === selectedCandidate)?.name;

      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-4">
                 <Button variant="ghost" onClick={() => setStep('confirm')} className="self-start">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>

                <Card className="border-primary/50 shadow-lg">
                    <CardHeader>
                        <CardTitle>Enter Verification Code</CardTitle>
                        <CardDescription>
                            We sent a 6-character code to <strong>{maskedEmail}</strong>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-secondary/50 p-4 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground uppercase">Voting For</span>
                            <p className="text-xl font-bold">{candidateName}</p>
                        </div>

                        <div className="flex justify-center gap-2">
                            {otp.map((digit, index) => (
                                <Input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    onPaste={(e) => e.preventDefault()}
                                    className="w-12 h-14 text-center text-2xl font-mono uppercase focus:ring-2 focus:ring-primary"
                                    disabled={submitting}
                                />
                            ))}
                        </div>

                        <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                            <Mail className="w-4 h-4" /> Check your inbox (expires in 2m)
                        </div>

                        {error && <div className="bg-red-500/10 text-red-500 p-3 text-sm rounded flex gap-2 items-center justify-center"><AlertTriangle className="w-4 h-4" /> {error}</div>}
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full text-lg h-12"
                            onClick={handleVerifyOtp}
                            disabled={submitting || otp.some(d => !d)}
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                            {submitting ? 'Verifying...' : 'Confirm Vote'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
      );
  }

  return null;
}
