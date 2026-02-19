'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Plus, LogOut, ShieldCheck, Users, Vote, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function PartyDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/party/dashboard', {
        method: 'GET',
        credentials: 'include'
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to load dashboard');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/10 p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Party Dashboard</h1>
                <p className="text-muted-foreground">Manage your party candidates and view statistics.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={fetchDashboard}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
                <Link href="/login">
                    <Button variant="ghost">Logout</Button>
                </Link>
            </div>
        </div>

        {error && <div className="bg-red-500/10 text-red-500 p-4 rounded">{error}</div>}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Party Name</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data?.party?.name}</div>
                    <Badge variant={data?.party?.status === 'ACTIVE' ? 'default' : 'secondary'} className="mt-1">
                        {data?.party?.status}
                    </Badge>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold flex items-center">
                        <Users className="w-5 h-5 mr-2 text-primary" />
                        {data?.stats?.totalMembers}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Candidates</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold flex items-center">
                        <Vote className="w-5 h-5 mr-2 text-primary" />
                        {data?.stats?.candidates?.filter((c: any) => c.electionStatus === 'ACTIVE').length || 0}
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add Candidate Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Register Candidate</CardTitle>
                    <CardDescription>Add a new candidate to an active election.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddCandidateForm elections={data?.stats?.activeElections || []} onSuccess={fetchDashboard} />
                </CardContent>
            </Card>

            {/* Candidates List */}
            <Card>
                <CardHeader>
                    <CardTitle>Candidates Performance</CardTitle>
                    <CardDescription>Votes received across active elections.</CardDescription>
                </CardHeader>
                <CardContent>
                    {(!data?.stats?.candidates || data?.stats?.candidates?.length === 0) ? (
                        <div className="text-center py-8 text-muted-foreground">No candidates registered yet.</div>
                    ) : (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto">
                            {data?.stats?.candidates.map((candidate: any) => (
                                <div key={candidate.id} className="flex items-center justify-between p-4 bg-background border rounded-lg">
                                    <div>
                                        <p className="font-semibold">{candidate.name}</p>
                                        <p className="text-sm text-muted-foreground">Election: {candidate.electionName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold">{candidate.votes}</p>
                                        <p className="text-xs text-muted-foreground">Votes</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}

function AddCandidateForm({ elections, onSuccess }: { elections: any[], onSuccess: () => void }) {
    const [name, setName] = useState('');
    const [electionId, setElectionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!electionId || !name) return;
        setLoading(true);
        setMsg('');
        setError('');

        try {
            const res = await fetch('/api/party/candidate/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    electionId,
                    // TODO: Image upload logic if needed, currently optional in backend
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to add');

            setMsg('Candidate added successfully!');
            setName('');
            setElectionId('');
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Candidate Name</label>
                <Input
                    placeholder="Enter full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Select Election</label>
                <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={electionId}
                    onChange={e => setElectionId(e.target.value)}
                    required
                >
                    <option value="">Choose an active election...</option>
                    {elections?.map((e: any) => (
                        <option key={e._id} value={e._id}>{e.title}</option>
                    ))}
                </select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {msg && <p className="text-sm text-green-500">{msg}</p>}

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Candidate
            </Button>
        </form>
    );
}
