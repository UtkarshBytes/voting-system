'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, Mail, Lock, Building2, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function AdminRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    orgId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    if (password.length > 7) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          orgId: formData.orgId,
          role: 'ADMIN',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      router.push('/admin/login');
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

      <Card className="w-full max-w-lg border-0 shadow-xl rounded-2xl overflow-hidden backdrop-blur-sm bg-white/80 animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center space-y-2 pb-6 border-b border-gray-100 bg-white/50">
          <CardTitle className="text-2xl font-bold text-gray-900">New Organization</CardTitle>
          <CardDescription className="text-gray-500">
            Create an admin account to manage secure elections.
          </CardDescription>
          <div className="flex justify-center mt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 uppercase tracking-wide">
              <ShieldCheck className="w-3 h-3" /> Role: Admin
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name</Label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        id="name"
                        required
                        className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                        placeholder="ORG-XXXX"
                        value={formData.orgId}
                        onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                    />
                </div>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Work Email</Label>
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
              <Label htmlFor="password" classname="text-sm font-semibold text-gray-700">Password</Label>
              <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    required
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
              </div>
              {formData.password && (
                  <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs font-medium text-gray-500">
                          <span>Password Strength</span>
                          <span className={passwordStrength > 75 ? "text-green-600" : passwordStrength > 50 ? "text-yellow-600" : "text-red-600"}>
                              {passwordStrength > 75 ? "Strong" : passwordStrength > 50 ? "Medium" : "Weak"}
                          </span>
                      </div>
                      <Progress value={passwordStrength} className="h-1.5" indicatorColor={passwordStrength > 75 ? "bg-green-500" : passwordStrength > 50 ? "bg-yellow-500" : "bg-red-500"} />
                  </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" classname="text-sm font-semibold text-gray-700">Confirm Password</Label>
              <div className="relative">
                  <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    className={`pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
              </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            <div className="pt-2">
                <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                    disabled={isLoading}
                >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Create Admin Account'}
                </Button>
                <p className="text-xs text-center text-gray-400 mt-3">
                    By registering, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-center py-6 bg-gray-50 border-t border-gray-100 flex-col gap-3">
          <p className="text-sm text-gray-500">
            Already have an organization account?{' '}
            <Link href="/admin/login" className="text-blue-600 font-semibold hover:underline transition-colors">
              Login here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
