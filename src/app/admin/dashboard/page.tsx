'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Loader2, LogOut, Plus, Trash2, User, Users, FileText,
    ShieldAlert, Activity, Box, Search, Settings,
    Bell, ChevronRight, LayoutDashboard, Flag, ShieldCheck,
    Menu, X, Server, Database
} from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
                router.push('/dashboard');
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

  if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* 1. SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:block shadow-xl`}>
        <div className="h-16 flex items-center px-6 border-b border-white/10">
            <div className="flex items-center gap-2 font-bold text-xl">
                <div className="p-1.5 bg-blue-600 rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <span>Admin Portal</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
            </button>
        </div>

        <nav className="p-4 space-y-2 mt-4">
            <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/20 font-medium transition-all">
                <LayoutDashboard className="w-5 h-5" /> Dashboard
            </Link>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-all font-medium">
                <FileText className="w-5 h-5" /> Elections
            </Link>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-all font-medium">
                <Flag className="w-5 h-5" /> Parties
            </Link>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-all font-medium">
                <Users className="w-5 h-5" /> Voters & KYC
            </Link>
            <div className="my-4 border-t border-white/10"></div>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-all font-medium">
                <Settings className="w-5 h-5" /> Settings
            </Link>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-white/10 bg-slate-900">
            <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">
                    {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">Administrator</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg">
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* TOP NAVBAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                    <Menu className="w-6 h-6" />
                </button>
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search elections, users..." className="pl-10 w-64 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative text-slate-500 hover:bg-slate-100 rounded-xl">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </Button>
            </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                        <p className="text-sm text-slate-500">Welcome back, here's what's happening today.</p>
                    </div>
                    <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-200 hover:shadow-xl transition-all">
                        {showCreateForm ? 'Cancel' : 'Create New Election'}
                    </Button>
                </div>

                {/* CREATE ELECTION FORM */}
                {showCreateForm && (
                    <Card className="border-0 shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4">
                        <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                        <CardHeader>
                            <CardTitle>Launch New Election</CardTitle>
                            <CardDescription>Configure election details and candidates.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateElection} className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Election Title</Label>
                                    <Input required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. 2024 Presidential Election" className="h-11 rounded-xl" />
                                </div>

                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-slate-700 font-semibold">Candidates</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={handleAddCandidate} className="h-8 text-xs rounded-lg border-dashed border-slate-300">
                                            <Plus className="w-3 h-3 mr-1" /> Add Candidate
                                        </Button>
                                    </div>

                                    {candidates.map((c, i) => (
                                        <div key={i} className="flex gap-3 items-center animate-in fade-in slide-in-from-left-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">{i + 1}</div>
                                            <Input required value={c.name} onChange={e => handleCandidateChange(i, 'name', e.target.value)} placeholder="Candidate Name" className="flex-1 h-10 rounded-lg" />
                                            <Input required value={c.party} onChange={e => handleCandidateChange(i, 'party', e.target.value)} placeholder="Party Affiliation" className="flex-1 h-10 rounded-lg" />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCandidate(i)} disabled={candidates.length === 1} className="text-slate-400 hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button type="submit" disabled={createLoading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-11 shadow-lg shadow-blue-200">
                                        {createLoading ? <Loader2 className="animate-spin" /> : 'Launch Election'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* 3. STATUS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-3xl font-bold text-slate-900">{stats?.activeElectionsCount || 0}</h3>
                                <p className="text-sm font-medium text-slate-500">Active Elections</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                                    <Users className="w-6 h-6 text-indigo-600" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-3xl font-bold text-slate-900">{stats?.totalVoters || 0}</h3>
                                <p className="text-sm font-medium text-slate-500">Registered Voters</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                                    <ShieldAlert className="w-6 h-6 text-amber-600" />
                                </div>
                                {stats && stats.pendingKycCount > 0 && (
                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">Action Needed</Badge>
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-3xl font-bold text-slate-900">{stats?.pendingKycCount || 0}</h3>
                                <p className="text-sm font-medium text-slate-500">Pending KYC Reviews</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group bg-slate-900 text-white border-none">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/10 rounded-xl">
                                    <Box className="w-6 h-6 text-blue-400" />
                                </div>
                                <Activity className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-3xl font-bold">{stats?.blockchain.height || 0}</h3>
                                <p className="text-sm font-medium text-slate-400">Blockchain Height</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* 4. ACTIVE ELECTIONS LIST */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-lg font-bold text-slate-800">Recent Elections</h2>

                        {elections.length === 0 ? (
                            <div className="p-12 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-white">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="font-medium text-slate-900">No elections found</h3>
                                <p className="text-slate-500 text-sm mt-1">Get started by creating a new election.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {elections.map(election => (
                                    <div key={election.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <Badge variant={election.status === 'ACTIVE' ? 'default' : 'secondary'} className={election.status === 'ACTIVE' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-none' : ''}>
                                                    {election.status}
                                                </Badge>
                                                <span className="text-xs text-slate-400 font-medium">ID: {election.id?.substring(0, 8)}...</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{election.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {election.candidates.length} Candidates</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span>Created {new Date(election.startTime || Date.now()).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="rounded-lg h-10 px-4 border-slate-200" onClick={() => router.push(`/results?id=${election.id}`)}>
                                                Analytics
                                            </Button>
                                            <Button size="sm" className="rounded-lg h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white">
                                                Manage <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 5. SIDEBAR: ACTIVITY & HEALTH */}
                    <div className="space-y-6">

                        {/* SYSTEM HEALTH */}
                        <Card className="rounded-2xl border-slate-200 shadow-sm">
                            <CardHeader className="pb-3 border-b border-slate-100">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Server className="w-4 h-4 text-slate-500" /> System Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Blockchain Node</span>
                                    <Badge className="bg-green-100 text-green-700 border-none hover:bg-green-200">Online</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Database</span>
                                    <Badge className="bg-green-100 text-green-700 border-none hover:bg-green-200">Connected</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">API Latency</span>
                                    <span className="font-mono text-xs text-slate-500">24ms</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ACTIVITY TIMELINE */}
                        <Card className="rounded-2xl border-slate-200 shadow-sm">
                            <CardHeader className="pb-3 border-b border-slate-100">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-slate-500" /> Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                                    <div className="space-y-0 relative">
                                        <div className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-100"></div>
                                        {stats.recentActivity.slice(0, 5).map((activity, i) => (
                                            <div key={i} className="flex gap-3 pb-4 last:pb-0 relative">
                                                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white mt-1.5 relative z-10 shrink-0 shadow-sm"></div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{activity.details}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 text-center py-4">No recent activity recorded.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* DANGER ZONE */}
                        <Card className="border-red-100 bg-red-50/50 rounded-2xl overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-red-800 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" /> Admin Controls
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button variant="destructive" size="sm" className="w-full shadow-red-200 shadow-md" onClick={handleReset}>
                                    Reset System Database
                                </Button>
                                <p className="text-[10px] text-red-600/70 mt-2 text-center">
                                    Caution: This action is irreversible.
                                </p>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
