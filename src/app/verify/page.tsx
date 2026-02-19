'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialTxHash = searchParams.get('txHash');
  const initialCode = searchParams.get('code');

  const [input, setInput] = useState(initialTxHash || initialCode || '');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTxHash) {
      handleVerify(initialTxHash, 'hash');
    } else if (initialCode) {
      handleVerify(initialCode, 'code');
    }
  }, [initialTxHash, initialCode]);

  const handleVerify = async (value: string, type?: 'hash' | 'code') => {
    if (!value) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let query = '';
      if (type) {
         query = type === 'hash' ? `txHash=${value}` : `code=${value}`;
      } else {
         // Auto-detect
         if (value.startsWith('VOTE-')) {
            query = `code=${value}`;
         } else {
            query = `txHash=${value}`;
         }
      }

      const res = await fetch(`/api/verify?${query}`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(input);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6 pt-24">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight">Verify Vote</h1>
          <p className="text-muted-foreground text-lg">
            Enter a Transaction Hash or Verification Code (VOTE-XXXX-XXXX) to verify on the blockchain.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste Hash or VOTE-Code..."
            className="flex-1 h-12 text-lg font-mono"
          />
          <Button type="submit" size="lg" disabled={loading} className="gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <Search />} Verify
          </Button>
        </form>

        {error && (
           <Card className="border-red-500/50 bg-red-500/10 animate-in fade-in slide-in-from-bottom-4">
             <CardHeader className="flex flex-row items-center gap-4">
               <XCircle className="w-8 h-8 text-red-500" />
               <div>
                 <CardTitle className="text-red-700">Verification Failed</CardTitle>
                 <CardDescription className="text-red-600/80">{error}</CardDescription>
               </div>
             </CardHeader>
           </Card>
        )}

        {result && (
           <Card className="border-green-500/50 bg-green-500/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
             <CardHeader className="flex flex-row items-center gap-4 bg-green-500/10 border-b border-green-500/20">
               <CheckCircle className="w-8 h-8 text-green-600" />
               <div>
                 <CardTitle className="text-green-800">Vote Verified Successfully</CardTitle>
                 <CardDescription className="text-green-700/80">
                    This transaction is confirmed on the blockchain.
                 </CardDescription>
               </div>
             </CardHeader>
             <CardContent className="space-y-6 pt-6">

                {/* Verification Code Badge */}
                {result.transaction.voteVerificationCode && (
                    <div className="flex flex-col items-center justify-center p-4 bg-background border rounded-lg border-green-200">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Verification Code</span>
                        <span className="text-2xl font-mono font-bold text-green-700 tracking-wider">
                            {result.transaction.voteVerificationCode}
                        </span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Election</label>
                        <p className="font-medium text-lg">{result.election?.title || 'Unknown Election'}</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Candidate</label>
                        <p className="font-medium text-lg">{result.candidate?.name || 'Unknown Candidate'}</p>
                        <p className="text-sm text-muted-foreground">{result.candidate?.party}</p>
                    </div>
                </div>

                <div className="space-y-2 bg-muted/50 p-4 rounded-lg font-mono text-sm break-all border">
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">Blockchain Details</label>
                    <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground">Block Index:</span>
                            <span className="font-bold">#{result.block.index}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground">Transaction Hash:</span>
                            <span className="text-xs">{result.transaction.id}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground">Block Hash:</span>
                            <span className="text-xs">{result.block.hash}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-t pt-2 mt-2">
                            <span className="text-muted-foreground">Timestamp:</span>
                            <span>{new Date(result.transaction.timestamp).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
             </CardContent>
             <CardFooter className="justify-center bg-green-500/10 border-t border-green-500/20 py-4 gap-4">
                <Link href={`/results?id=${result.election?.id}`}>
                    <Button variant="link" className="text-green-700 hover:text-green-800">
                        View Election Results
                    </Button>
                </Link>
             </CardFooter>
           </Card>
        )}
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
