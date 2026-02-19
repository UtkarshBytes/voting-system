'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, CheckCircle, XCircle, ShieldCheck, ArrowLeft, Hash } from 'lucide-react';

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
          setError('Invalid Vote ID. Please check your receipt and try again.');
      } else {
          setResult(data);
      }

    } catch (err: any) {
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(input);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Background Blobs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob pointer-events-none"></div>
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000 pointer-events-none"></div>

      <div className="w-full max-w-lg space-y-8 relative z-10">

        {/* Navigation & Header */}
        <div className="space-y-6 text-center animate-in fade-in slide-in-from-top-4 duration-500">
             <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
            </Link>

            <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-white rounded-2xl shadow-md">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Verify Your Vote</h1>
                <p className="text-lg text-gray-600 max-w-sm mx-auto">
                    Enter your Vote ID to confirm it has been securely recorded on the blockchain.
                </p>
            </div>
        </div>

        {/* Verification Card */}
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
            <CardContent className="p-8 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                      <label htmlFor="voteId" className="text-sm font-semibold text-gray-700 ml-1">Vote ID</label>
                      <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            id="voteId"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="e.g., VOTE-1234-ABCD"
                            className="pl-10 h-12 text-lg font-mono uppercase border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                            autoComplete="off"
                        />
                      </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !input}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-xl"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <span className="flex items-center gap-2">
                            Verify Status <Hash className="w-4 h-4 opacity-70" />
                        </span>
                    )}
                  </Button>
                </form>
            </CardContent>
        </Card>

        {/* Results Section */}
        {error && (
           <Card className="border-l-4 border-l-red-500 shadow-lg bg-white animate-in fade-in slide-in-from-bottom-4 duration-300 rounded-xl overflow-hidden">
             <CardContent className="flex items-start gap-4 p-6">
               <div className="p-2 bg-red-50 rounded-full">
                    <XCircle className="w-6 h-6 text-red-500" />
               </div>
               <div>
                 <h3 className="font-bold text-gray-900 text-lg">Verification Failed</h3>
                 <p className="text-gray-600 mt-1">{error}</p>
                 <p className="text-xs text-gray-400 mt-2">Make sure you have copied the full ID from your receipt.</p>
               </div>
             </CardContent>
           </Card>
        )}

        {result && result.valid && (
           <Card className="border-0 shadow-2xl bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl ring-1 ring-black/5">
             <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 flex items-center gap-4 border-b border-green-100">
               <div className="p-3 bg-white rounded-full shadow-sm">
                    <CheckCircle className="w-8 h-8 text-green-600" />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-green-900">Vote Successfully Recorded</h3>
                 <p className="text-green-700 text-sm font-medium">Confirmed on Blockchain Network</p>
               </div>
             </div>

             <CardContent className="space-y-6 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Election</label>
                        <p className="font-bold text-lg text-gray-900">{result.electionTitle}</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Timestamp</label>
                        <p className="font-mono text-sm font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded inline-block">
                            {new Date(result.timestamp).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="bg-gray-900 p-5 rounded-xl font-mono text-xs break-all space-y-4 text-gray-300 shadow-inner">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                        <span className="text-gray-500 uppercase font-semibold">Block Number</span>
                        <span className="text-white font-bold text-base">#{result.blockNumber}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 uppercase font-semibold mb-2">Transaction Hash</span>
                        <span className="text-blue-400 leading-relaxed tracking-wide">{result.blockchainHash}</span>
                    </div>
                </div>
             </CardContent>

             <CardFooter className="bg-gray-50 p-4 flex justify-center text-xs text-gray-500 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    SecureVote Protocol: Private vote details are encrypted and hidden.
                </div>
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
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
