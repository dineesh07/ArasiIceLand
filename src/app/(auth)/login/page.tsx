'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Store, Lock, User, Loader2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('kalai');
  const [password, setPassword] = useState('Arasi@123');
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
        body: JSON.stringify({ username, password }),
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
    setUsername('kalai');
    setPassword('Arasi@123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-20 h-20 shrink-0">
            <Image
              src="/logo.png"
              alt="Arasi Iceland & Computers"
              width={80}
              height={80}
              className="w-full h-full drop-shadow-md"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Arasi Iceland & Computers
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            Arun Ice Creams Parlour
          </p>
        </div>

        <Card className="border-slate-200 shadow-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Shop Login</CardTitle>
            <CardDescription className="text-slate-500">
              Sign in to manage your counter sales and bills
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Quick Helper Card */}
            <div className="mb-5 p-3.5 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-sky-600" />
                  Your Shop Account
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
                <div>Username: <strong>kalai</strong></div>
                <div>Password: <strong>Arasi@123</strong></div>
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
                  <User className="w-4 h-4 text-slate-400" /> Username
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. kalai"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
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
