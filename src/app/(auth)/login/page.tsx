'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Lock,
  User,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ShoppingBag,
  Laptop,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      // Hard redirect ensures cookies are committed and dashboard reloads cleanly
      window.location.href = '/';
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Left Column: Brand Hero Section (visible on lg screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-sky-600 via-sky-700 to-blue-900 text-white flex-col justify-between p-12 overflow-hidden">
        {/* Subtle decorative glowing circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl p-1.5 shadow-lg flex items-center justify-center shrink-0">
            <Image
              src="/logo.png"
              alt="Arasi Iceland & Computers"
              width={56}
              height={56}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Arasi Iceland & Computers
            </h1>
            <p className="text-xs text-sky-200 font-medium">
              Shop Management Portal
            </p>
          </div>
        </div>

        {/* Middle Feature Showcase */}
        <div className="relative z-10 my-auto py-12 max-w-lg space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-sky-100 text-xs font-semibold uppercase tracking-wider border border-white/15">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" />
              Unified Shop Counter
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Fast, simple, and organized store management.
            </h2>
            <p className="text-sky-100 text-sm xl:text-base leading-relaxed">
              Manage billing tokens, vendor orders, tailoring measurements, and daily shop expenses seamlessly in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-sky-500/30 flex items-center justify-center text-sky-200 shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Ice Cream & Retail Sales</h4>
                <p className="text-xs text-sky-200">Catalog billing, box vendor orders & stock tracking</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-sky-500/30 flex items-center justify-center text-sky-200 shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Internet Centre Services</h4>
                <p className="text-xs text-sky-200">Printouts, certificates, PAN & Aadhaar applications</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-sky-500/30 flex items-center justify-center text-sky-200 shrink-0">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Tailoring Orders</h4>
                <p className="text-xs text-sky-200">Blouse & churidar tracking with customer delivery dates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-sky-200/80">
          &copy; {new Date().getFullYear()} Arasi Iceland & Computers. All rights reserved.
        </div>
      </div>

      {/* Right Column: Clean Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-4 py-12 sm:px-8 lg:px-16 min-h-screen">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center space-y-3 mb-6">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-white p-2 shadow-md border border-slate-200 items-center justify-center">
              <Image
                src="/logo.png"
                alt="Arasi Iceland & Computers"
                width={64}
                height={64}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Arasi Iceland & Computers
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Shop Management Portal
              </p>
            </div>
          </div>

          {/* Form Card / Container */}
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="bg-white h-11 text-base"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" /> Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="bg-white h-11 text-base pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-base font-bold h-12 bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-all"
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
          </div>
        </div>
      </div>
    </div>
  );
}
