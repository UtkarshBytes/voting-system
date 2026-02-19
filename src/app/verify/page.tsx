'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || searchParams.get('voteId');

  const [input, setInput] = useState(initialCode || '');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (voteId: string) => {
    if (!voteId) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/public/verify?voteId=${encodeURIComponent(voteId)}`, {
        method: 'GET',
        // credentials: 'omit' // No credentials needed for public endpoint
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      if (!data.valid) {
          setError('Invalid Vote ID');
      } else {
          setResult(data);
      }

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(input);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">

        <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Verify Your Vote</h1>
            <p className="text-muted-foreground">
                Enter your Vote ID to confirm it has been recorded on the blockchain.
            </p>
        </div>

        <Card className="shadow-lg border-t-4 border-t-primary">
            <CardHeader>
                <CardTitle>Vote ID Lookup</CardTitle>
                <CardDescription>Enter the code from your voting receipt.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., VOTE-1234-ABCD"
                    className="flex-1 font-mono uppercase"
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span className="ml-2 hidden sm:inline">Verify</span>
                  </Button>
                </form>
            </CardContent>
        </Card>

        {error && (
           <Card className="border-red-500/50 bg-red-50 animate-in fade-in slide-in-from-bottom-2">
             <CardContent className="flex items-center gap-4 p-6">
               <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
               <div>
                 <h3 className="font-semibold text-red-900">Verification Failed</h3>
                 <p className="text-red-700">{error}</p>
               </div>
             </CardContent>
           </Card>
        )}

        {result && result.valid && (
           <Card className="border-green-500/50 bg-white shadow-xl animate-in fade-in slide-in-from-bottom-2 overflow-hidden">
             <div className="bg-green-50 p-6 flex items-center gap-4 border-b border-green-100">
               <CheckCircle className="w-10 h-10 text-green-600 flex-shrink-0" />
               <div>
                 <h3 className="text-xl font-bold text-green-800">Vote Recorded</h3>
                 <p className="text-green-700">This vote is confirmed on the blockchain.</p>
               </div>
             </div>

             <CardContent className="space-y-4 p-6">
                <div className="grid gap-1">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Election</label>
                    <p className="font-medium text-lg text-foreground">{result.electionTitle}</p>
                </div>

                <div className="grid gap-1">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Timestamp</label>
                    <p className="font-mono text-sm">{new Date(result.timestamp).toLocaleString()}</p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg font-mono text-xs break-all space-y-3 border">
                    <div>
                        <span className="block text-muted-foreground mb-1">Block Number</span>
                        <span className="font-bold text-foreground">#{result.blockNumber}</span>
                    </div>
                    <div>
                        <span className="block text-muted-foreground mb-1">Blockchain Hash</span>
                        <span className="text-foreground">{result.blockchainHash}</span>
                    </div>
                </div>
             </CardContent>

             <CardFooter className="bg-gray-50 p-4 flex justify-center text-sm text-muted-foreground">
                <p>Private vote details are not publicly accessible.</p>
             </CardFooter>
           </Card>
        )}
      </div>
    </div>
  );
}

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
