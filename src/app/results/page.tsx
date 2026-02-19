'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, ShieldCheck, QrCode, TrendingUp, Users, Box, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function ResultsContent() {
  const searchParams = useSearchParams();
  const electionId = searchParams.get('id');

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!electionId) return;
    fetchResults();
    const interval = setInterval(fetchResults, 5000); // Live updates
    return () => clearInterval(interval);
  }, [electionId]);

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/elections/${electionId}`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!res.ok) {
        setError('Failed to load results');
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError('Error fetching results');
    } finally {
      setIsLoading(false);
    }
  };

  if (!electionId) {
    return <div className="p-8 text-center">No election ID provided.</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-8 text-center text-red-500">{error || 'No data found'}</div>;
  }

  const { election, results, stats } = data;

  // Calculate rankings
  const candidatesSorted = [...election.candidates].sort((a: any, b: any) => {
    return (results[b.id] || 0) - (results[a.id] || 0);
  });

  const totalVotes = stats.totalVotes;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{election.title}</h1>
            <p className="text-muted-foreground mt-1">Official Election Results • Blockchain Verified</p>
          </div>
          <Badge variant={election.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-lg px-4 py-1">
            {election.status === 'ACTIVE' ? '🔴 LIVE' : 'CLOSED'}
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Votes</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVotes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Verified transactions</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Voter Turnout</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.turnout.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Of registered users</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last Block</CardTitle>
              <Box className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#{stats.lastBlockIndex}</div>
              <p className="text-xs text-muted-foreground truncate w-full" title={stats.lastBlockHash}>
                {stats.lastBlockHash.substring(0, 8)}...
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Candidates Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results (Ranked) */}
          <div className="lg:col-span-2 space-y-6">
             <h2 className="text-2xl font-bold text-slate-800">Candidate Rankings</h2>
             {totalVotes === 0 ? (
               <Card className="p-8 text-center bg-white border-dashed">
                 <div className="flex flex-col items-center gap-2">
                   <Box className="w-12 h-12 text-slate-300" />
                   <h3 className="text-lg font-semibold text-slate-600">Voting has not started yet</h3>
                   <p className="text-sm text-muted-foreground">Be the first to cast a vote!</p>
                 </div>
               </Card>
             ) : (
               <div className="space-y-4">
                  {candidatesSorted.map((candidate: any, index: number) => {
                      const votes = results[candidate.id] || 0;
                      const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                      const isWinner = index === 0 && totalVotes > 0;

                      return (
                          <div key={candidate.id} className={`bg-white p-6 rounded-xl border shadow-sm transition-all hover:shadow-md ${isWinner ? 'border-yellow-400 ring-1 ring-yellow-400/50' : 'border-slate-200'}`}>
                              <div className="flex justify-between items-center mb-4">
                                  <div className="flex items-center gap-4">
                                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${isWinner ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                                          {index + 1}
                                      </div>
                                      <div>
                                          <h3 className="font-bold text-lg">{candidate.name} {isWinner && <span className="text-yellow-500 ml-2">👑</span>}</h3>
                                          <p className="text-sm text-muted-foreground">{candidate.party}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-2xl font-bold">{votes.toLocaleString()}</div>
                                      <div className="text-xs text-muted-foreground">votes</div>
                                  </div>
                              </div>

                              {/* Animated Progress Bar */}
                              <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                      className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${isWinner ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-slate-400'}`}
                                      style={{ width: `${percentage}%` }}
                                  />
                              </div>
                              <div className="flex justify-between mt-2 text-xs font-medium text-slate-500">
                                  <span>{percentage.toFixed(1)}%</span>
                              </div>
                          </div>
                      );
                  })}
               </div>
             )}
          </div>

          {/* Sidebar / Verification */}
          <div className="space-y-6">
             <Card className="bg-slate-900 text-slate-50 border-none shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="text-green-400" />
                        Blockchain Audit
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Verify the integrity of this election using our public ledger.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-slate-800 rounded-lg text-xs font-mono break-all">
                        <span className="text-slate-500 block mb-1">Latest Block Hash:</span>
                        {stats.lastBlockHash}
                    </div>

                    <Link href="/verify">
                        <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                            <QrCode className="w-4 h-4" /> Verify a Vote
                        </Button>
                    </Link>
                </CardContent>
             </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Election Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium">{election.status}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Start Time</span>
                        <span className="font-medium">{new Date(election.startTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">End Time</span>
                        <span className="font-medium">{election.endTime ? new Date(election.endTime).toLocaleDateString() : 'Indefinite'}</span>
                    </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        }>
            <ResultsContent />
        </Suspense>
    );
}
