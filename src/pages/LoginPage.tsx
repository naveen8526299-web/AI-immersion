import React, { useState } from 'react';
import { ArrowRight, Building2, GraduationCap, Lock, Mail, Shield, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CosmicBackdrop } from '../components/CosmicBackdrop';
import { HeroAvatarSVG } from '../components/HeroCharacters';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { loginDemo, loginWithEmail, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [roleTab, setRoleTab] = useState<UserRole>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await loginWithEmail(email, password, roleTab);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'Sign-in failed.');
      return;
    }
    navigate(roleTab === 'FACULTY' ? '/faculty' : roleTab === 'ADMIN' ? '/admin' : '/dashboard');
  };

  const handleDemoLogin = (role: UserRole) => {
    loginDemo(role);
    navigate(role === 'FACULTY' ? '/faculty' : role === 'ADMIN' ? '/admin' : '/dashboard');
  };

  return (
    <div className="relative min-h-screen cosmic-gradient text-[#F8FAFF] flex items-center justify-center p-4">
      <CosmicBackdrop />
      <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-12 rounded-3xl border border-violet-400/25 bg-[#17152D]/85 backdrop-blur-xl overflow-hidden shadow-2xl">
        {/* Left Visual Showcase */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 font-display text-lg font-bold">
              <Shield className="h-5 w-5 text-cyan-400" />
              AttendanceGuard
            </Link>
            <h2 className="mt-6 font-display text-2xl font-extrabold leading-tight">
              Your Squad. Your Semester Shield.
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Sign in as a Student, Faculty Mentor, or College Administrator.
            </p>
          </div>

          <div className="my-6 flex justify-center">
            <HeroAvatarSVG
              heroId={roleTab === 'STUDENT' ? 'captain-campus' : roleTab === 'FACULTY' ? 'iron-scholar' : 'doctor-deadline'}
              mood="happy"
              size={140}
              auraId="vibranium-shield"
            />
          </div>

          <div className="rounded-xl bg-black/30 border border-white/10 p-3 text-xs text-slate-300">
            {isDemoMode
              ? 'Running in Simulated Demo Mode (localStorage). No secret institutional credentials are stored in frontend code.'
              : 'Connected to Supabase Authentication & Row Level Security.'}
          </div>
        </div>

        {/* Right Form */}
        <div className="md:col-span-7 p-6 sm:p-8">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 p-1 mb-6">
            {(['STUDENT', 'FACULTY', 'ADMIN'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleTab(r)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                  roleTab === r ? 'bg-electric-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                {r === 'STUDENT' && <User className="h-3.5 w-3.5" />}
                {r === 'FACULTY' && <GraduationCap className="h-3.5 w-3.5" />}
                {r === 'ADMIN' && <Building2 className="h-3.5 w-3.5" />}
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Institutional Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={roleTab === 'STUDENT' ? 'arjun.hero@campus.edu' : 'name@campus.edu'}
                  className="w-full rounded-xl bg-white/5 border border-white/15 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-white/5 border border-white/15 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/15 border border-rose-400/40 px-3.5 py-2.5 text-xs text-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 py-3 text-sm font-extrabold text-slate-950 hover:brightness-110 transition disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : `Sign In as ${roleTab}`}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Instant Demo Access */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">
              Instant Simulated Demo Accounts
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('STUDENT')}
                className="rounded-xl bg-cyan-500/15 border border-cyan-400/30 px-3 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25 transition"
              >
                Demo Student
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('FACULTY')}
                className="rounded-xl bg-indigo-500/15 border border-indigo-400/30 px-3 py-2.5 text-xs font-bold text-indigo-200 hover:bg-indigo-500/25 transition"
              >
                Demo Faculty
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                className="rounded-xl bg-purple-500/15 border border-purple-400/30 px-3 py-2.5 text-xs font-bold text-purple-200 hover:bg-purple-500/25 transition"
              >
                Demo Admin
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            New student or faculty to AttendanceGuard?{' '}
            <Link to="/register" className="font-bold text-cyan-300 hover:underline">
              Create Student / Faculty Account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
