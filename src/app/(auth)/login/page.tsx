'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Lock, Mail, Loader2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@shop.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials. Please try again.');
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('owner@shop.com');
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-sky-600 items-center justify-center text-white shadow-md">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Shop Manager
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            Internet Centre · Ice Cream · Tailoring
          </p>
        </div>

        <Card className="border-slate-200 shadow-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Owner Login</CardTitle>
            <CardDescription className="text-slate-500">
              Sign in to manage your counter and bills
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Quick Demo Helper Card */}
            <div className="mb-5 p-3.5 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-sky-600" />
                  Your Database Owner Account
                </span>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-fill
                </button>
              </div>
              <div className="text-xs text-sky-800 space-y-0.5 font-mono">
                <div>Email: <strong>owner@shop.com</strong></div>
                <div>Pass:  <strong>password123</strong></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" /> Email
                </label>
                <Input
                  type="email"
                  required
                  placeholder="owner@shop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" /> Password
                </label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="bg-white"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-base font-bold h-12 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">
          Connected to Neon PostgreSQL &middot; Timezone: Asia/Kolkata (IST)
        </p>
      </div>
    </div>
  );
}
