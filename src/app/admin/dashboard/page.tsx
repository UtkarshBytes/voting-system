'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut, Plus, Trash2, User, Users, FileText, ShieldAlert, Activity, Box, Search } from 'lucide-react';
import { Election } from '@/lib/types';

interface AdminStats {
  activeElectionsCount: number;
  totalVoters: number;
  pendingKycCount: number;
  kycDistribution: Record<string, number>;
  blockchain: {
      height: number;
      latestBlockIndex: number;
      latestBlockHash: string;
  };
  recentActivity: Array<{
      type: string;
      timestamp: number;
      details: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [elections, setElections] = useState<Election[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ name: string } | null>(null);

  // Create Election Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [candidates, setCandidates] = useState([{ name: '', party: '' }]);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    try {
        const res = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include'
        });
        if (res.status === 401) {
            router.push('/admin/login');
        } else {
            const data = await res.json();
            if (data.user.role !== 'ADMIN') {
                router.push('/dashboard'); // Redirect non-admins
            }
            setUser(data.user);
        }
    } catch (err) {
        console.error(err);
    }
  };

  const fetchData = async () => {
    try {
      const [electionsRes, statsRes] = await Promise.all([
          fetch('/api/elections', { method: 'GET', credentials: 'include' }),
          fetch('/api/admin/stats', { method: 'GET', credentials: 'include' })
      ]);

      if (electionsRes.ok) setElections(await electionsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());

    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const response = await fetch('/api/elections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newTitle,
          candidates,
          startTime: Date.now(),
        }),
      });

      if (!response.ok) throw new Error('Failed to create');

      await fetchData();
      setShowCreateForm(false);
      setNewTitle('');
      setCandidates([{ name: '', party: '' }]);
    } catch (error) {
      console.error('Error creating election:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddCandidate = () => setCandidates([...candidates, { name: '', party: '' }]);
  const handleRemoveCandidate = (i: number) => {
      const newC = [...candidates];
      newC.splice(i, 1);
      setCandidates(newC);
  };
  const handleCandidateChange = (i: number, field: 'name' | 'party', val: string) => {
      const newC = [...candidates];
      newC[i][field] = val;
      setCandidates(newC);
  };

  const handleLogout = async () => {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/admin/login');
  };

  const handleReset = async () => {
      if (!confirm('Are you sure you want to ERASE ALL DATA? This cannot be undone.')) return;
      try {
          const res = await fetch('/api/admin/reset', { method: 'POST', credentials: 'include' });
          if (res.ok) {
              await handleLogout();
          } else {
              alert('Failed to reset database');
          }
      } catch (error) {
          console.error(error);
      }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="px-6 h-16 flex items-center justify-between border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
          <User className="w-6 h-6 text-primary" />
          <span>Admin Console</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600 hidden sm:inline-block">
            {user?.name} (Administrator)
          </span>
          <Button variant="ghost" onClick={handleLogout} className="text-slate-500 hover:text-red-600">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8">

        {/* 1. STATUS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Elections</CardTitle></CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.activeElectionsCount || 0}</div>
                    <p className="text-xs text-muted-foreground">Monitoring live votes</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Voters</CardTitle></CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalVoters || 0}</div>
                    <p className="text-xs text-muted-foreground">Registered users</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending KYC</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-yellow-600">{stats?.pendingKycCount || 0}</span>
                        <ShieldAlert className="w-4 h-4 text-yellow-500" />
                    </div>
                    <p className="text-xs text-muted-foreground">Require verification</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Blockchain Height</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-blue-500" />
                        <span className="text-2xl font-bold">{stats?.blockchain.height || 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Latest Block: #{stats?.blockchain.latestBlockIndex}</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 2. ELECTION OVERVIEW */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Election Management</h2>
                    <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
                        {showCreateForm ? 'Cancel' : 'Create Election'}
                    </Button>
                </div>

                {showCreateForm && (
                    <Card className="bg-slate-50 border-dashed border-2">
                        <CardHeader><CardTitle>New Election</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateElection} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Election Title" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Candidates</Label>
                                    {candidates.map((c, i) => (
                                        <div key={i} className="flex gap-2">
                                            <Input required value={c.name} onChange={e => handleCandidateChange(i, 'name', e.target.value)} placeholder="Name" />
                                            <Input required value={c.party} onChange={e => handleCandidateChange(i, 'party', e.target.value)} placeholder="Party" />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCandidate(i)} disabled={candidates.length === 1}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddCandidate}><Plus className="w-4 h-4 mr-2" /> Add Candidate</Button>
                                </div>
                                <Button type="submit" disabled={createLoading}>{createLoading ? <Loader2 className="animate-spin" /> : 'Launch Election'}</Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {elections.length === 0 ? (
                    <div className="p-12 border rounded-lg text-center bg-white">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <h3 className="font-medium text-slate-900">No elections found</h3>
                        <p className="text-slate-500 text-sm">Create a new election to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {elections.map(election => (
                            <Card key={election.id} className="hover:border-primary/50 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between py-4">
                                    <div>
                                        <CardTitle className="text-base">{election.title}</CardTitle>
                                        <CardDescription>Created: {new Date(election.startTime || Date.now()).toLocaleDateString()}</CardDescription>
                                    </div>
                                    <Badge variant={election.status === 'ACTIVE' ? 'default' : 'secondary'}>{election.status}</Badge>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Candidates: {election.candidates.length}</span>
                                        <Link href={`/results?id=${election.id}`} className="text-primary hover:underline">View Results</Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* SIDEBAR: KYC & Blockchain */}
            <div className="space-y-6">
                {/* 3. KYC DISTRIBUTION */}
                <Card>
                    <CardHeader><CardTitle className="text-base">KYC Verification</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {stats && Object.entries(stats.kycDistribution).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between text-sm">
                                <span className="capitalize text-slate-600">{status.replace('_', ' ').toLowerCase()}</span>
                                <span className="font-bold">{count}</span>
                            </div>
                        ))}
                        <Button variant="outline" className="w-full text-xs" disabled>Review Pending (Demo)</Button>
                    </CardContent>
                </Card>

                {/* SYSTEM ACTIONS */}
                <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-2"><CardTitle className="text-base text-red-700">System Actions</CardTitle></CardHeader>
                    <CardContent>
                        <Button variant="destructive" className="w-full" onClick={handleReset}>
                            Reset Database
                        </Button>
                        <p className="text-xs text-red-600/80 mt-2">Erases all users, votes, and blocks. Logs everyone out.</p>
                    </CardContent>
                </Card>

                {/* 6. BLOCKCHAIN ACTIVITY */}
                <Card className="bg-slate-900 text-white border-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-400" /> Network Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                            <div className="space-y-3">
                                {stats.recentActivity.slice(0, 5).map((activity, i) => (
                                    <div key={i} className="text-xs border-l-2 border-slate-700 pl-3 py-1">
                                        <div className="text-slate-400">{new Date(activity.timestamp).toLocaleTimeString()}</div>
                                        <div className="font-medium text-slate-200">{activity.details}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500">No recent network activity.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
