'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, ArrowLeft, ShieldCheck, AlertTriangle, KeyRound } from 'lucide-react';
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
  const [step, setStep] = useState<'select' | 'verify' | 'confirm'>('select');

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
      // We don't verify password here, we just move to confirm step
      // The verification happens at API level when voting
      setStep('confirm');
  };

  const handleVote = async () => {
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

      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        // If 401/403, it might be verification failure
        if (response.status === 401 || response.status === 403) {
             throw new Error(data.error || "Verification failed.");
        }
        throw new Error(data.error || 'Vote failed');
      }

      setVoteReceipt(data.receipt);
    } catch (err: any) {
      setError(err.message);
      // If error, maybe go back to verify step?
      if (err.message.includes("Verification") || err.message.includes("Biometric") || err.message.includes("Password")) {
          setStep('verify'); // Let them try again
          setFaceDescriptor(null);
          // Keep password if they want to correct it? Or clear it?
          // Don't clear password immediately so they can edit
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetSelection = () => {
    setSelectedCandidate(null);
    setFaceDescriptor(null);
    setPassword('');
    setUsePassword(false);
    setStep('select');
    setError(null);
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
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Link>

            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{election?.title}</h1>
                <Badge variant={election?.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {election?.status}
                </Badge>
            </div>

            <h2 className="text-xl font-semibold mb-6">Select a Candidate</h2>
            {error && <div className="bg-red-500/10 text-red-500 p-4 rounded mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> {error}</div>}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {election?.candidates.map((candidate: any) => (
                <Card
                    key={candidate.id}
                    className="hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => onCandidateSelect(candidate.id)}
                >
                  <CardHeader>
                    <CardTitle className="group-hover:text-primary transition-colors">{candidate.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground italic font-medium">{candidate.party}</p>
                  </CardContent>
                  <CardFooter>
                     <Button className="w-full" variant="secondary">Select</Button>
                  </CardFooter>
                </Card>
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
                         <Button className="w-full text-lg h-12" onClick={handleVote} disabled={submitting}>
                             {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                             {submitting ? 'Encrypting & Mining...' : 'Confirm & Vote'}
                         </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
      );
  }

  return null;
}
