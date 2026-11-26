import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  Compass,
  Shield,
  Sliders,
  Sparkles,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CosmicBackdrop } from '../components/CosmicBackdrop';
import { HeroAvatarSVG } from '../components/HeroCharacters';
import { useAuth } from '../contexts/AuthContext';
import { evaluateAttendance } from '../utils/attendanceMath';

export const LandingPage: React.FC = () => {
  const { user, loginDemo } = useAuth();
  const navigate = useNavigate();

  // Interactive landing mini-calculator
  const [attended, setAttended] = useState(30);
  const [total, setTotal] = useState(40);
  const evalPreview = evaluateAttendance(attended, total, 75);

  const launchDemo = (role: 'STUDENT' | 'FACULTY' | 'ADMIN') => {
    loginDemo(role);
    navigate(role === 'STUDENT' ? '/dashboard' : role === 'FACULTY' ? '/faculty' : '/admin');
  };

  return (
    <div className="relative min-h-screen cosmic-gradient text-[#F8FAFF] overflow-hidden">
      <CosmicBackdrop />
      {/* Top Navbar */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-lg shadow-cyan-500/30">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-display text-xl font-extrabold tracking-tight">AttendanceGuard</span>
            <span className="ml-2 hidden sm:inline-block rounded-full bg-cyan-400/15 border border-cyan-400/30 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
              AI + Gamified ERP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg hover:brightness-110 transition"
            >
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg hover:brightness-110 transition"
              >
                Join Squad
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16 grid lg:grid-cols-12 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 border border-purple-400/35 px-3.5 py-1.5 text-xs font-bold text-purple-200">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Your Attendance. Your Squad. Your Semester.
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight">
            Protect Your Hall Ticket with{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Exact Math & AI Heroes
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Predict examination eligibility with exact integer arithmetic, simulate bunks safely without touching real
            records, reconcile Hackathon/CoE On-Duty credits, and team up with your squad — while your floating cartoon
            guardian watches every lecture.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => launchDemo('STUDENT')}
              className="neon-button inline-flex items-center gap-2 px-6 py-3.5 text-sm font-extrabold"
            >
              Launch Student Demo <ArrowRight className="h-4 w-4 text-[#00D9FF]" />
            </button>
            <button
              onClick={() => launchDemo('FACULTY')}
              className="rounded-2xl bg-white/10 border border-white/20 px-5 py-3.5 text-sm font-bold text-white hover:bg-white/15 transition"
            >
              Faculty Portal Demo
            </button>
            <button
              onClick={() => launchDemo('ADMIN')}
              className="rounded-2xl bg-purple-500/20 border border-purple-400/30 px-5 py-3.5 text-sm font-bold text-purple-200 hover:bg-purple-500/30 transition"
            >
              Admin Command Demo
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg text-xs">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="font-display text-lg font-bold text-cyan-300">100A ≥ pT</div>
              <div className="text-slate-400">Zero rounding errors</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="font-display text-lg font-bold text-emerald-300">4 AI Heroes</div>
              <div className="text-slate-400">Live emotional reactions</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="font-display text-lg font-bold text-purple-300">OD + Squad</div>
              <div className="text-slate-400">Privacy-masked sync</div>
            </div>
          </div>
        </motion.div>

        {/* Live Hero + Interactive Math Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5"
        >
          <div className="rounded-3xl border border-cyan-400/30 bg-[#0d1436]/85 backdrop-blur-xl p-6 shadow-[0_0_50px_rgba(37,99,235,0.3)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">Live Exact Engine Preview</div>
                <div className="mt-1 font-display text-xl font-bold">Instant 75% Shield Check</div>
              </div>
              <HeroAvatarSVG
                heroId="captain-campus"
                mood={evalPreview.isPerfect ? 'celebration' : evalPreview.isEligible ? 'happy' : 'warning'}
                size={84}
                auraId="vibranium-shield"
              />
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Attended Classes (A): {attended}</span>
                  <span>Total Conducted (T): {total}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  value={attended}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAttended(val);
                    if (val > total) setTotal(val);
                  }}
                  className="w-full accent-cyan-400"
                />
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={total}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTotal(val);
                    if (attended > val) setAttended(val);
                  }}
                  className="w-full accent-purple-400 mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-black/35 border border-white/10 p-4">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase">Exact Percentage</div>
                  <div className="font-display text-2xl font-extrabold text-white">{evalPreview.displayPercentage}</div>
                  <div className="text-xs font-semibold text-cyan-300 mt-0.5">{evalPreview.statusLabel}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 uppercase">
                    {evalPreview.isEligible ? 'Max Safe Absences' : 'Required Recovery'}
                  </div>
                  <div
                    className={`font-display text-2xl font-extrabold ${
                      evalPreview.isEligible ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {evalPreview.isEligible ? evalPreview.maxSafeAbsences : evalPreview.requiredRecoveryClasses}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {evalPreview.isEligible ? 'Consecutive classes' : 'Straight classes needed'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Core Modules Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: <Compass className="h-5 w-5 text-cyan-300" />,
              title: 'AI Hall Ticket Survival Predictor',
              desc: 'Calculates GREEN, YELLOW, or RED exam eligibility across remaining timetable classes and holidays.',
            },
            {
              icon: <Sliders className="h-5 w-5 text-blue-300" />,
              title: 'Non-Destructive Bunk Simulator',
              desc: 'Test hypothetical skips with sliders and hero reactions without ever altering real records.',
            },
            {
              icon: <Briefcase className="h-5 w-5 text-emerald-300" />,
              title: 'Smart OD Reconciliation',
              desc: 'Preview Hackathon & CoE workshop impacts before approval, then auto-reconcile with zero duplicates.',
            },
            {
              icon: <Sparkles className="h-5 w-5 text-purple-300" />,
              title: 'Emotional Cartoon Companions',
              desc: '4 original animated heroes + Thanos Emergency Alert with Web Audio SFX & speech narration.',
            },
            {
              icon: <Award className="h-5 w-5 text-amber-300" />,
              title: 'Avengers Shield & Hero Armory',
              desc: 'Earn verified coins & XP from genuine attendance and completed tasks—never fake claims.',
            },
            {
              icon: <Users className="h-5 w-5 text-pink-300" />,
              title: 'Privacy-Masked Squad Connect',
              desc: 'Collaborate on homework & CoE projects using squad codes like COE-75GUARD without exposing exact %.',
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:border-cyan-400/40 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 mb-3">{f.icon}</div>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-cyan-300 shrink-0" />
          <span>
            Note: Local Demo Mode simulates student, faculty, and admin workflows in browser storage. Real institutional
            ERP updates require authorized Supabase / college integration.
          </span>
        </div>
      </section>
    </div>
  );
};
