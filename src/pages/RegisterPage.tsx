import React, { useState } from 'react';
import { ArrowRight, GraduationCap, Shield, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CosmicBackdrop } from '../components/CosmicBackdrop';
import { HeroAvatarSVG } from '../components/HeroCharacters';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { HeroId } from '../types';
import { HEROES } from '../utils/dialogueEngine';

const DEFAULT_SUBJECT_CODES = ['MA501', 'CS502', 'CS503', 'AI504', 'CS505'];

export const RegisterPage: React.FC = () => {
  const { registerStudent, registerFaculty } = useAuth();
  const { subjects } = useAppState();
  const navigate = useNavigate();

  const [regRole, setRegRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [heroAlias, setHeroAlias] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [registerNumber, setRegisterNumber] = useState('');
  const [semesterNumber, setSemesterNumber] = useState(5);
  const [selectedHero, setSelectedHero] = useState<HeroId>('captain-campus');

  // Faculty fields
  const [facultyId, setFacultyId] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>(['MA501', 'CS502']);
  const [customCodeInput, setCustomCodeInput] = useState('');

  const [error, setError] = useState('');

  const availableSubjectCodes = Array.from(
    new Set([...DEFAULT_SUBJECT_CODES, ...subjects.map((s) => s.code)])
  );

  const toggleSubjectCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (regRole === 'FACULTY') {
      const extraCodes = customCodeInput
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);
      const res = await registerFaculty({
        fullName,
        email,
        password,
        department,
        facultyId,
        assignedSubjectCodes: [...selectedCodes, ...extraCodes],
      });
      if (!res.ok) {
        setError(res.error || 'Could not create faculty account.');
        return;
      }
      navigate('/faculty');
      return;
    }

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

        {/* Role Selector */}
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-white/5 p-1 max-w-sm">
          <button
            type="button"
            onClick={() => setRegRole('STUDENT')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              regRole === 'STUDENT' ? 'bg-electric-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <User className="h-3.5 w-3.5" /> Student Register
          </button>
          <button
            type="button"
            onClick={() => setRegRole('FACULTY')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              regRole === 'FACULTY' ? 'bg-[#8138F5] text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" /> Faculty Register
          </button>
        </div>

        <h1 className="mt-5 font-display text-2xl sm:text-3xl font-extrabold">
          {regRole === 'FACULTY' ? 'Create Your Faculty Portal Account' : 'Create Your Student Hero Profile'}
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          {regRole === 'FACULTY'
            ? 'Register with your assigned subject codes to view student details, mark attendance, and verify ODs.'
            : 'Pick your guardian companion and protect your semester from day one.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={regRole === 'FACULTY' ? 'e.g., Dr. Anitha Sundar' : 'e.g., Priya Darshini'}
                className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {regRole === 'STUDENT' ? (
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
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Faculty Employee ID *</label>
                <input
                  required
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  placeholder="e.g., FAC-CSE-204"
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">College Email *</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={regRole === 'FACULTY' ? 'faculty@campus.edu' : 'student@campus.edu'}
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

            {regRole === 'STUDENT' && (
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
            )}
          </div>

          {regRole === 'STUDENT' ? (
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
          ) : (
            <div className="space-y-3 rounded-2xl bg-white/5 border border-white/10 p-4">
              <label className="block text-xs font-semibold text-cyan-300">
                Assigned Subject Codes (Faculty Access Control) *
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSubjectCodes.map((code) => {
                  const active = selectedCodes.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleSubjectCode(code)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-mono font-bold transition ${
                        active
                          ? 'bg-[#8138F5] text-white border-purple-300'
                          : 'bg-white/5 border-white/15 text-slate-300 hover:border-white/30'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {code}
                    </button>
                  );
                })}
              </div>
              <input
                value={customCodeInput}
                onChange={(e) => setCustomCodeInput(e.target.value)}
                placeholder="Or enter extra subject codes separated by comma (e.g., CS506, EC501)"
                className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-400/40 px-4 py-2.5 text-xs text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="neon-button w-full inline-flex items-center justify-center gap-2 py-3.5 text-sm font-extrabold"
          >
            {regRole === 'FACULTY' ? 'Activate Faculty Portal Account' : 'Activate My AttendanceGuard Account'}
            <ArrowRight className="h-4 w-4 text-[#00D9FF]" />
          </button>
        </form>
      </div>
    </div>
  );
};
