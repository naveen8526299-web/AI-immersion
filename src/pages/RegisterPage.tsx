import React, { useState } from 'react';
import { ArrowRight, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CosmicBackdrop } from '../components/CosmicBackdrop';
import { HeroAvatarSVG } from '../components/HeroCharacters';
import { useAuth } from '../contexts/AuthContext';
import { HeroId } from '../types';
import { HEROES } from '../utils/dialogueEngine';

export const RegisterPage: React.FC = () => {
  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [heroAlias, setHeroAlias] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [registerNumber, setRegisterNumber] = useState('');
  const [semesterNumber, setSemesterNumber] = useState(5);
  const [selectedHero, setSelectedHero] = useState<HeroId>('captain-campus');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await registerStudent({
      fullName,
      email,
      password,
      heroAlias,
      department,
      registerNumber,
      semesterNumber,
      selectedHero,
    });
    if (!res.ok) {
      setError(res.error || 'Could not create account.');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen cosmic-gradient text-[#F8FAFF] flex items-center justify-center p-4 py-10">
      <CosmicBackdrop />
      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-violet-400/25 bg-[#17152D]/85 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-lg font-bold">
            <Shield className="h-5 w-5 text-cyan-400" />
            AttendanceGuard
          </Link>
          <Link to="/login" className="text-xs font-semibold text-cyan-300 hover:underline">
            Already registered? Sign In
          </Link>
        </div>

        <h1 className="mt-6 font-display text-2xl sm:text-3xl font-extrabold">Create Your Student Hero Profile</h1>
        <p className="mt-1 text-sm text-slate-300">
          Pick your guardian companion and protect your semester from day one.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Priya Darshini"
                className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Public Squad Hero Alias *</label>
              <input
                required
                value={heroAlias}
                onChange={(e) => setHeroAlias(e.target.value)}
                placeholder="e.g., CyberPhoenix-21"
                className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">College Email *</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campus.edu"
                className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password (min 6 chars) *</label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Register No.</label>
                <input
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  placeholder="22CSE099"
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Semester</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={semesterNumber}
                  onChange={(e) => setSemesterNumber(Number(e.target.value))}
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Choose Your AI Companion</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(HEROES) as HeroId[]).map((hId) => {
                const meta = HEROES[hId];
                const active = selectedHero === hId;
                return (
                  <button
                    key={hId}
                    type="button"
                    onClick={() => setSelectedHero(hId)}
                    className={`rounded-2xl border p-3 flex flex-col items-center text-center transition ${
                      active
                        ? 'border-cyan-400 bg-cyan-500/15 shadow-lg shadow-cyan-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <HeroAvatarSVG heroId={hId} mood={active ? 'celebration' : 'idle'} size={64} animateFloat={active} />
                    <div className="mt-2 text-xs font-bold">{meta.name}</div>
                    <div className="text-[10px] text-slate-400">{meta.roleTitle}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-400/40 px-4 py-2.5 text-xs text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 text-sm font-extrabold text-slate-950 hover:brightness-110 transition"
          >
            Activate My AttendanceGuard Account <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
