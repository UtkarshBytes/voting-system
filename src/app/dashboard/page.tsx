'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, LogOut, Vote, ShieldCheck, Box, Clock, CheckCircle, BarChart3, Lock, Fingerprint, User } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  if (!user.role) {
      return <div className="flex items-center justify-center min-h-screen bg-slate-50">Loading profile...</div>;
  }

  const activeElections = elections.filter(e => e.status === 'ACTIVE');
  const votedCount = Object.keys(user.hasVoted || {}).length;
  const remainingActive = activeElections.filter(e => e.id && !user.hasVoted?.[e.id]).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/50">

      {/* 1. HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
        <div className="px-6 lg:px-8 h-20 flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <div className="p-1.5 bg-blue-600 rounded-lg shadow-sm">
                        <Vote className="w-5 h-5 text-white" />
                    </div>
                    Voter Dashboard
                </h1>
                <p className="text-xs text-slate-500 font-medium ml-10 hidden sm:block">Blockchain-Verified Voting System</p>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full shadow-sm animate-in fade-in zoom-in">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-green-700 tracking-wide uppercase">Blockchain Verified</span>
                </div>

                <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-bold text-slate-700">{user.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{user.role}</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                            <User className="w-5 h-5 text-slate-500" />
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-full">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
      </header>

      <main className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* 2. STAT CARDS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Active Elections */}
            <Card className="rounded-2xl shadow-sm border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white overflow-hidden group">
                <CardContent className="p-6 relative">
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Vote className="w-24 h-24 text-blue-600" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Vote className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="space-y-1 relative z-10">
                        <h3 className="text-3xl font-bold text-slate-900">{activeElections.length}</h3>
                        <p className="text-sm font-medium text-slate-500">Active Elections</p>
                    </div>
                </CardContent>
            </Card>

            {/* Voting Status */}
            <Card className="rounded-2xl shadow-sm border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white overflow-hidden group">
                <CardContent className="p-6 relative">
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CheckCircle className="w-24 h-24 text-green-600" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="space-y-1 relative z-10">
                        <h3 className="text-3xl font-bold text-slate-900">{votedCount}</h3>
                        <p className="text-sm font-medium text-slate-500">Votes Cast ({remainingActive} pending)</p>
                    </div>
                </CardContent>
            </Card>

            {/* Identity Status */}
            <Card className="rounded-2xl shadow-sm border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white overflow-hidden group">
                <CardContent className="p-6 relative">
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldCheck className="w-24 h-24 text-indigo-600" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 rounded-xl">
                            <ShieldCheck className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                    <div className="space-y-1 relative z-10">
                        <h3 className={`text-xl font-bold ${user.kyc?.status === 'VERIFIED' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {user.kyc?.status === 'VERIFIED' ? 'Verified' : 'Pending'}
                        </h3>
                        <p className="text-sm font-medium text-slate-500">Identity Status</p>
                    </div>
                </CardContent>
            </Card>

            {/* Blockchain Stats */}
            <Card className="rounded-2xl shadow-sm border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white overflow-hidden group">
                <CardContent className="p-6 relative">
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Box className="w-24 h-24 text-purple-600" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl">
                            <Box className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="space-y-1 relative z-10">
                        <h3 className="text-3xl font-bold text-slate-900">{stats?.blockchainHeight || 0}</h3>
                        <p className="text-sm font-medium text-slate-500">Blocks Mined</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* 3. ACTIVE ELECTIONS & RESULTS */}
            <div className="lg:col-span-2 space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        Active Elections
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">{activeElections.length}</Badge>
                    </h2>

                    {activeElections.length === 0 ? (
                        <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-white/50">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Vote className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No active elections</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2">There are currently no elections open for voting. Check back later.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {activeElections.map((election) => {
                                const hasVoted = election.id ? !!user.hasVoted?.[election.id] : false;
                                return (
                                    <div key={election.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide border border-green-200">
                                                        Active
                                                    </span>
                                                    {hasVoted && (
                                                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" /> Voted
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-2xl font-bold text-slate-900">{election.title}</h3>
                                                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4 text-blue-500" />
                                                        <span>{getTimeRemaining(election.endTime)}</span>
                                                    </div>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span>Ends {new Date(election.startTime || Date.now()).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <Link href={hasVoted ? `/results?id=${election.id}` : `/vote/${election.id}`}>
                                                <Button
                                                    size="lg"
                                                    disabled={hasVoted}
                                                    className={hasVoted
                                                        ? "w-full sm:w-40 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200"
                                                        : "w-full sm:w-40 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                                                    }
                                                >
                                                    {hasVoted ? "Already Voted" : "Vote Now"}
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Live Results Preview */}
                {latestResult && latestResult.result.totalVotes > 0 && (
                    <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-blue-600" /> Live Results
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Real-time data from the blockchain</p>
                            </div>
                            <Link href={`/results?id=${latestResult.election.id}`}>
                                <Button variant="ghost" className="text-blue-600 hover:bg-blue-50 font-medium group">
                                    View Full Analytics <span className="group-hover:translate-x-1 transition-transform ml-1">&rarr;</span>
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2">
                                {latestResult.election.title}
                            </h3>
                            {latestResult.election.candidates
                                .map((c: any) => ({
                                    ...c,
                                    votes: latestResult.result.results[c.id] || 0,
                                    percent: latestResult.result.totalVotes > 0 ? ((latestResult.result.results[c.id] || 0) / latestResult.result.totalVotes) * 100 : 0
                                }))
                                .sort((a: any, b: any) => b.votes - a.votes)
                                .slice(0, 3)
                                .map((candidate: any, idx) => (
                                    <div key={candidate.id} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="font-bold text-slate-700 text-sm">
                                                <span className="text-slate-400 mr-2 font-normal">#{idx + 1}</span>
                                                {candidate.name}
                                            </span>
                                            <span className="font-mono font-bold text-blue-600">{candidate.percent.toFixed(1)}%</span>
                                        </div>
                                        <Progress
                                            value={candidate.percent}
                                            className="h-2.5 bg-slate-100 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-indigo-500"
                                        />
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}
            </div>

            {/* 4. SECURITY SIDEBAR */}
            <div>
                <Card className="bg-gradient-to-br from-slate-900 to-blue-950 text-white border-none shadow-2xl rounded-3xl sticky top-24 overflow-hidden">
                    {/* Glow effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <CardHeader className="pb-2 border-b border-white/10">
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <ShieldCheck className="text-emerald-400 w-5 h-5" />
                            Security Center
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6 relative z-10">

                        {/* Identity Status */}
                        <div className="space-y-3">
                            <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Identity Verification</div>
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                {user.kyc?.status === 'VERIFIED' ? (
                                    <div className="bg-emerald-500/20 p-2.5 rounded-full ring-1 ring-emerald-500/50"><ShieldCheck className="w-5 h-5 text-emerald-400" /></div>
                                ) : (
                                    <div className="bg-amber-500/20 p-2.5 rounded-full ring-1 ring-amber-500/50"><ShieldCheck className="w-5 h-5 text-amber-400" /></div>
                                )}
                                <div>
                                    <div className="font-bold text-base text-white">
                                        {user.kyc?.status === 'VERIFIED' ? "Verified Voter" : "Verification Pending"}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                        {user.kyc?.status === 'VERIFIED' ? "Level 3 Access Granted" : "Limited Access"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Biometric Status */}
                        <div className="space-y-3">
                            <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Biometric Security</div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Fingerprint className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                                    <span className="text-sm font-medium text-slate-200">Face Recognition</span>
                                </div>
                                {user.faceDescriptor ? (
                                    <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-xs font-bold">
                                        <CheckCircle className="w-3 h-3" /> Enabled
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Disabled</span>
                                )}
                            </div>
                        </div>

                        {/* Security Alert/Info */}
                        <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 flex gap-3">
                            <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-100 leading-relaxed opacity-90">
                                Your account is protected by 256-bit encryption. All votes are anonymously signed and immutable.
                            </p>
                        </div>

                        <Link href="/profile/security" className="block pt-2">
                            <Button className="w-full h-12 bg-white text-slate-900 hover:bg-slate-50 hover:scale-[1.02] transition-all font-bold rounded-xl shadow-lg">
                                Manage Security Profile
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
