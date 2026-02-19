'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Mail, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const FaceRecognition = dynamic(() => import('@/components/face-recognition'), { ssr: false });

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
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

  const handleFaceDetected = (descriptor: Float32Array) => {
    setFaceDescriptor(descriptor);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          role: 'USER',
          faceDescriptor: faceDescriptor ? Array.from(faceDescriptor) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      router.push('/login');
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
          <CardTitle className="text-2xl font-bold text-gray-900">Voter Registration</CardTitle>
          <CardDescription className="text-gray-500">
            Create your secure account to participate in upcoming elections.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="name"
                  required
                  className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                  placeholder="Official Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  required
                  className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                  placeholder="Create a password"
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

            <div className="space-y-3 pt-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Biometric Verification (Optional)
              </Label>
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <FaceRecognition onFaceDetected={handleFaceDetected} isRegistration={true} />
                  {faceDescriptor ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded-lg border border-green-100 animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">Face data securely captured!</span>
                    </div>
                  ) : (
                      <p className="mt-2 text-xs text-center text-blue-600/80">
                          Position your face in the camera frame to enable secure biometric login.
                      </p>
                  )}
              </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 text-center animate-in fade-in slide-in-from-top-1">
                    {error}
                </div>
            )}

            <div className="pt-2">
                <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                    disabled={isLoading}
                >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Create Account'}
                </Button>
                <p className="text-xs text-center text-gray-400 mt-4 leading-relaxed">
                    By clicking "Create Account", you agree to our Terms of Service and Privacy Policy.
                    Your data is protected by industry-standard encryption.
                </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-center py-6 bg-gray-50 border-t border-gray-100 flex-col gap-3">
          <p className="text-sm text-gray-500">
            Already registered?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline transition-colors">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
