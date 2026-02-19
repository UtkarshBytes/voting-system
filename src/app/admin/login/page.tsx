'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, Mail, Lock, Building2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    orgId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">

      {/* Header Logo */}
      <div className="flex items-center gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
             <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-gray-900">SecureVote</span>
      </div>

      <Card className="w-full max-w-md border-0 shadow-xl rounded-2xl overflow-hidden backdrop-blur-sm bg-white/80 animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center space-y-2 pb-6 border-b border-gray-100 bg-white/50">
          <CardTitle className="text-2xl font-bold text-gray-900">Admin Portal</CardTitle>
          <CardDescription className="text-blue-600 font-medium bg-blue-50 py-1 px-3 rounded-full inline-block text-xs uppercase tracking-wider">
            Authorized Access Only
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
              <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    required
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                    placeholder="admin@organization.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgId" className="text-sm font-semibold text-gray-700">Organization ID</Label>
              <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="orgId"
                    required
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                    placeholder="e.g. ORG-12345"
                    value={formData.orgId}
                    onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                  />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                  <Button variant="link" className="p-0 h-auto text-xs text-blue-600 font-medium" onClick={(e) => e.preventDefault()}>
                      Forgot Password?
                  </Button>
              </div>
              <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    required
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
              </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 text-center animate-in fade-in slide-in-from-top-1">
                    {error}
                </div>
            )}

            <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl mt-2"
                disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Sign In to Admin Console'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center py-6 bg-gray-50 border-t border-gray-100 flex-col gap-3">
          <p className="text-sm text-gray-500">
            Don't have an admin account?{' '}
            <Link href="/admin/register" className="text-blue-600 font-semibold hover:underline transition-colors">
              Register Organization
            </Link>
          </p>
          <div className="w-full border-t border-gray-200 my-1"></div>
          <Link href="/login" className="text-xs text-gray-400 font-medium hover:text-gray-600 transition-colors uppercase tracking-wide">
            Switch to Voter Login
          </Link>
        </CardFooter>
      </Card>

      <p className="mt-8 text-xs text-center text-gray-400 max-w-xs">
          Protected by SecureVote biometric and blockchain technology. Unauthorized access is prohibited.
      </p>
    </div>
  );
}
