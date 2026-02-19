'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, LogOut, Vote, User, ShieldCheck, Box, BarChart3, Clock, CheckCircle } from 'lucide-react';
import { Election } from '@/lib/types';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  kyc: {
    status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
    method: 'NONE' | 'FACE' | 'MANUAL';
    updatedAt: number;
  };
  faceDescriptor: any;
  hasVoted: Record<string, boolean>;
}

interface BlockchainStats {
  blockchainHeight: number;
  latestBlockIndex: number;
  latestBlockHash: string;
  totalTransactions: number;
}

interface ElectionResult {
    electionId: string;
    results: Record<string, number>;
    totalVotes: number;
}

export default function VoterDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [latestResult, setLatestResult] = useState<{election: Election, result: ElectionResult} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          fetchUser(),
          fetchElections(),
          fetchStats()
        ]);
      } catch (error) {
        console.error("Dashboard initialization failed", error);
        // Force logout on critical failure
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
      if (elections.length > 0) {
          const targetElection = elections.find(e => e.status === 'ACTIVE') || elections[elections.length - 1];
          if (targetElection && targetElection.id) {
              fetchResult(targetElection.id);
          }
      }
  }, [elections]);

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    });
    if (!res.ok) {
        throw new Error("Auth failed");
    }
    const data = await res.json();
    setUser(data.user);
  };

  const fetchElections = async () => {
    const res = await fetch('/api/elections?status=ACTIVE', {
      method: 'GET',
      credentials: 'include'
    });
    if (res.ok) {
        const data = await res.json();
        setElections(data);
    }
  };

  const fetchStats = async () => {
      const res = await fetch('/api/stats', {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
          const data = await res.json();
          setStats(data);
      }
  };

  const fetchResult = async (electionId: string) => {
      const res = await fetch(`/api/elections/${electionId}`, {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
          const data = await res.json();
          setLatestResult({
              election: data.election,
              result: {
                  electionId: data.election.id,
                  results: data.results,
                  totalVotes: data.stats.totalVotes
              }
          });
      }
  };

  const handleLogout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch (e) {
          console.error("Logout failed", e);
      }
      router.push('/login');
  };

  const getTimeRemaining = (endTime?: number | string | Date) => {
      if (!endTime) return "Indefinite";
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) return "Ended";
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days > 0) return `${days} days left`;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      return `${hours} hours left`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) return null; // Should redirect

  // Safety check for user role if API returns partial data
  if (!user.role) {
      return <div className="flex items-center justify-center min-h-screen">Loading user profile...</div>;
  }

  const activeElections = elections.filter(e => e.status === 'ACTIVE');
  const votedCount = Object.keys(user.hasVoted || {}).length;
  const remainingActive = activeElections.filter(e => e.id && !user.hasVoted?.[e.id]).length;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* 1. HEADER */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
            <div>
                <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
                    <Vote className="w-6 h-6 text-primary" />
                    <span>Voter Dashboard</span>
                </div>
                <p className="text-xs text-muted-foreground hidden sm:block">Blockchain-verified voting system</p>
            </div>

            <div className="flex items-center gap-4">
                <Badge variant="secondary" className="gap-1 bg-green-50 text-green-700 border-green-200 hidden md:flex">
                    <CheckCircle className="w-3 h-3" /> Blockchain Verified
                </Badge>
                <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                <span className="text-sm font-medium text-slate-700 hidden sm:inline-block">
                    {user.name}
                </span>
                <Button variant="ghost" onClick={handleLogout} className="text-slate-500 hover:text-red-600">
                    <LogOut className="w-4 h-4" />
                </Button>
            </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8">

        {/* 2. STATUS CARDS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Active Elections */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Elections</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeElections.length}</div>
                    <p className="text-xs text-muted-foreground">Currently open</p>
                </CardContent>
            </Card>

            {/* Voting Status */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Voting Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{votedCount}</div>
                    <p className="text-xs text-muted-foreground">
                        Elections voted in. {remainingActive} remaining.
                    </p>
                </CardContent>
            </Card>

            {/* KYC Status Snippet */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Identity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <span className={`font-bold ${user.kyc?.status === 'VERIFIED' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {user.kyc?.status === 'VERIFIED' ? 'Verified' : 'Pending'}
                        </span>
                        {user.kyc?.status === 'VERIFIED' && <ShieldCheck className="w-4 h-4 text-green-600" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {user.faceDescriptor ? 'Face ID Active' : 'Face ID Inactive'}
                    </p>
                </CardContent>
            </Card>

            {/* Blockchain Status */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Blockchain</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-primary" />
                        <div className="text-2xl font-bold">{stats?.blockchainHeight || 0}</div>
                    </div>
                    <p className="text-xs text-muted-foreground">Blocks mined</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 3. ACTIVE VOTES (Main Column) */}
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-slate-800">Active Elections</h2>

                {activeElections.length === 0 ? (
                    <div className="p-12 border-2 border-dashed rounded-xl text-center bg-white">
                        <Vote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">No active elections</h3>
                        <p className="text-slate-500">Check back later for upcoming votes.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeElections.map((election) => {
                            const hasVoted = election.id ? !!user.hasVoted?.[election.id] : false;
                            return (
                                <Card key={election.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Active</Badge>
                                                {hasVoted && <Badge variant="secondary" className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Voted</Badge>}
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900">{election.title}</h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                                <Clock className="w-4 h-4" />
                                                <span>Ends: {new Date(election.startTime || Date.now()).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>{getTimeRemaining(election.endTime)}</span>
                                            </div>
                                        </div>

                                        <Link href={hasVoted ? `/results?id=${election.id}` : `/vote/${election.id}`}>
                                            <Button disabled={hasVoted} className={hasVoted ? "w-full sm:w-auto" : "w-full sm:w-auto bg-primary hover:bg-primary/90"}>
                                                {hasVoted ? "Already Voted" : "Vote Now"}
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Live Results Preview */}
                {latestResult && latestResult.result.totalVotes > 0 && (
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-800">Live Results Preview</h2>
                            <Link href={`/results?id=${latestResult.election.id}`}>
                                <Button variant="link" className="text-primary">View Full Results &rarr;</Button>
                            </Link>
                        </div>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">{latestResult.election.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {latestResult.election.candidates
                                    .map((c: any) => ({
                                        ...c,
                                        votes: latestResult.result.results[c.id] || 0,
                                        percent: latestResult.result.totalVotes > 0 ? ((latestResult.result.results[c.id] || 0) / latestResult.result.totalVotes) * 100 : 0
                                    }))
                                    .sort((a: any, b: any) => b.votes - a.votes)
                                    .slice(0, 2)
                                    .map((candidate: any) => (
                                        <div key={candidate.id} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-slate-700">{candidate.name}</span>
                                                <span className="text-slate-500">{candidate.percent.toFixed(1)}%</span>
                                            </div>
                                            <Progress value={candidate.percent} className="h-2" />
                                        </div>
                                    ))
                                }
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* 4. SECURITY SIDEBAR */}
            <div className="space-y-6">
                <Card className="bg-slate-900 text-white border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="text-green-400" />
                            Security Center
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Identity Status</div>
                            <div className="flex items-center gap-3">
                                {user.kyc?.status === 'VERIFIED' ? (
                                    <div className="bg-green-500/20 p-2 rounded-full"><ShieldCheck className="w-6 h-6 text-green-400" /></div>
                                ) : (
                                    <div className="bg-yellow-500/20 p-2 rounded-full"><ShieldCheck className="w-6 h-6 text-yellow-400" /></div>
                                )}
                                <div>
                                    <div className="font-bold text-lg">
                                        {user.kyc?.status === 'VERIFIED' ? "KYC Verified" :
                                         user.kyc?.status === 'PENDING' ? "Pending Verification" : "Not Verified"}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {user.kyc?.status === 'VERIFIED' ? "You are eligible for all elections." : "Please complete verification."}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Biometric Status</div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">{user.faceDescriptor ? "Face ID Configured" : "Not Configured"}</span>
                                {user.faceDescriptor && <CheckCircle className="w-4 h-4 text-green-400" />}
                            </div>
                        </div>

                        <div className="bg-slate-800 p-3 rounded text-xs text-slate-300 leading-relaxed">
                            Biometric verification enhances account security but is optional for voting.
                        </div>

                        <Link href="/profile/security" className="block">
                            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100">
                                Manage Profile
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
