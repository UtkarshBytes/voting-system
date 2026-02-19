'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Lock, ArrowRight, ShieldCheck, Mail, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      if (data.user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">

      {/* Header Logo */}
      <div className="flex items-center gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
             <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-gray-900">SecureVote</span>
      </div>

      <Card className="w-full max-w-md border-0 shadow-xl rounded-2xl overflow-hidden backdrop-blur-sm bg-white/80 animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center space-y-2 pb-6 border-b border-gray-100 bg-white/50">
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Welcome Back</CardTitle>
          <CardDescription className="text-gray-500 text-base">
            Secure Biometric Voting Access
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                <Link href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                    Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-200 rounded-xl mt-2"
                disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                  <span className="flex items-center justify-center gap-2">
                      Sign In to Vote <ArrowRight className="w-4 h-4" />
                  </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center py-6 bg-gray-50 border-t border-gray-100 flex-col gap-4">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 font-bold hover:underline transition-colors">
              Register to Vote
            </Link>
          </p>
          <div className="flex gap-4 text-xs text-gray-400">
              <Link href="/admin/login" className="hover:text-gray-600 transition-colors">Admin Access</Link>
              <span>•</span>
              <Link href="#" className="hover:text-gray-600 transition-colors">Help Center</Link>
              <span>•</span>
              <Link href="#" className="hover:text-gray-600 transition-colors">Privacy</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
