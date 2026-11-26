import React, { useState } from 'react';
import { ArrowRight, Building2, GraduationCap, Shield, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CosmicBackdrop } from '../components/CosmicBackdrop';
import { HeroAvatarSVG } from '../components/HeroCharacters';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { GenderCategory, HeroId } from '../types';
import { HEROES } from '../utils/dialogueEngine';

const DEFAULT_SUBJECT_CODES = ['MA501', 'CS502', 'CS503', 'AI504', 'CS505'];

export const RegisterPage: React.FC = () => {
  const { registerStudent, registerFaculty, registerCollegeAdmin } = useAuth();
  const { subjects, colleges, enrollCollegeInstitution } = useAppState();
  const navigate = useNavigate();

  const [regRole, setRegRole] = useState<'STUDENT' | 'FACULTY' | 'ADMIN'>('STUDENT');
  const [collegeId, setCollegeId] = useState(colleges[0]?.id || 'clg-au-coe');
  const [gender, setGender] = useState<GenderCategory>('FEMALE');
  const [yearOfStudy, setYearOfStudy] = useState(3);
  const [phone, setPhone] = useState('');
  const [skillsInput, setSkillsInput] = useState('React, Python, AI');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [heroAlias, setHeroAlias] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [registerNumber, setRegisterNumber] = useState('');
  const [semesterNumber, setSemesterNumber] = useState(5);
  const [selectedHero, setSelectedHero] = useState<HeroId>('captain-campus');

  // Faculty fields
  const [facultyId, setFacultyId] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>(['MA501', 'CS502']);
  const [customCodeInput, setCustomCodeInput] = useState('');

  // College Admin onboarding fields
  const [newCollegeCode, setNewCollegeCode] = useState('');
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeCity, setNewCollegeCity] = useState('');
  const [newCollegeDepts, setNewCollegeDepts] = useState('CSE, AI&DS, ECE, IT');

  const [error, setError] = useState('');

  const availableSubjectCodes = Array.from(
    new Set([...DEFAULT_SUBJECT_CODES, ...subjects.map((s) => s.code)])
  );

  const toggleSubjectCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectedCollege = colleges.find((c) => c.id === collegeId) || colleges[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (regRole === 'ADMIN') {
      const enr = enrollCollegeInstitution({
        code: newCollegeCode,
        name: newCollegeName,
        city: newCollegeCity,
        adminName: fullName,
        adminEmail: email,
        departments: newCollegeDepts.split(',').map((d) => d.trim()).filter(Boolean),
      });
      if (!enr.ok || !enr.college) {
        setError(enr.error || 'Could not enroll college.');
        return;
      }
      const res = await registerCollegeAdmin({
        fullName,
        email,
        password,
        collegeId: enr.college.id,
        collegeName: enr.college.name,
        adminCode: `ADM-${enr.college.code}`,
      });
      if (!res.ok) {
        setError(res.error || 'Could not create college admin account.');
        return;
      }
      navigate('/admin');
      return;
    }

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
        collegeId: selectedCollege?.id,
        collegeName: selectedCollege?.name,
        gender,
        phone,
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
      collegeId: selectedCollege?.id,
      collegeName: selectedCollege?.name,
      gender,
      yearOfStudy,
      phone,
      skills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
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
        <div className="mt-5 grid grid-cols-3 gap-1.5 rounded-xl bg-white/5 p-1 max-w-lg">
          <button
            type="button"
            onClick={() => setRegRole('STUDENT')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              regRole === 'STUDENT' ? 'bg-electric-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <User className="h-3.5 w-3.5" /> Student
          </button>
          <button
            type="button"
            onClick={() => setRegRole('FACULTY')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              regRole === 'FACULTY' ? 'bg-[#8138F5] text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" /> Faculty
          </button>
          <button
            type="button"
            onClick={() => setRegRole('ADMIN')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              regRole === 'ADMIN' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" /> Enroll College
          </button>
        </div>

        <h1 className="mt-5 font-display text-2xl sm:text-3xl font-extrabold">
          {regRole === 'ADMIN'
            ? 'Enroll Your College & Create Admin Command'
            : regRole === 'FACULTY'
            ? 'Create Your Faculty Portal Account'
            : 'Create Your Student Campus Profile'}
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          {regRole === 'ADMIN'
            ? 'Onboard your college institution with isolated announcements, student & teacher directories, and ERP controls.'
            : regRole === 'FACULTY'
            ? 'Register with your college & assigned subject codes to view student details, mark attendance, and verify ODs.'
            : 'Connect with your college peers by department & year, join hackathon teams, and protect your attendance.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {regRole === 'ADMIN' ? (
            <div className="grid sm:grid-cols-2 gap-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 p-4">
              <div>
                <label className="block text-xs font-semibold text-amber-200 mb-1">College Code *</label>
                <input
                  required
                  value={newCollegeCode}
                  onChange={(e) => setNewCollegeCode(e.target.value)}
                  placeholder="e.g., SRM-KTR"
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-200 mb-1">College / University Name *</label>
                <input
                  required
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  placeholder="e.g., SRM Institute of Science & Tech"
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-200 mb-1">City / Campus Location</label>
                <input
                  value={newCollegeCity}
                  onChange={(e) => setNewCollegeCity(e.target.value)}
                  placeholder="e.g., Chennai, TN"
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-200 mb-1">Departments (comma-separated)</label>
                <input
                  value={newCollegeDepts}
                  onChange={(e) => setNewCollegeDepts(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Enrolled College *</label>
                <select
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  className="w-full rounded-xl bg-[#101027] border border-white/15 px-3.5 py-2.5 text-sm text-white"
                >
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Gender Hub *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as GenderCategory)}
                  className="w-full rounded-xl bg-[#101027] border border-white/15 px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="FEMALE">Female (Girls Hub)</option>
                  <option value="MALE">Male (Boys Hub)</option>
                  <option value="OTHER">Other / Prefer not to say</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={regRole === 'ADMIN' ? 'e.g., Dr. Rajendran' : regRole === 'FACULTY' ? 'e.g., Dr. Anitha Sundar' : 'e.g., Priya Darshini'}
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
            ) : regRole === 'FACULTY' ? (
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
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98..."
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
                placeholder={regRole === 'ADMIN' ? 'principal@college.edu' : regRole === 'FACULTY' ? 'faculty@campus.edu' : 'student@campus.edu'}
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

            {regRole !== 'ADMIN' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="CSE, AI&DS, ECE..."
                    className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone (Optional)</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98..."
                    className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </>
            )}

            {regRole === 'STUDENT' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Reg No.</label>
                    <input
                      value={registerNumber}
                      onChange={(e) => setRegisterNumber(e.target.value)}
                      placeholder="22CSE099"
                      className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Year</label>
                    <select
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(Number(e.target.value))}
                      className="w-full rounded-xl bg-[#101027] border border-white/15 px-2.5 py-2.5 text-xs text-white"
                    >
                      <option value={1}>1st Yr</option>
                      <option value={2}>2nd Yr</option>
                      <option value={3}>3rd Yr</option>
                      <option value={4}>4th Yr</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Sem</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={semesterNumber}
                      onChange={(e) => setSemesterNumber(Number(e.target.value))}
                      className="w-full rounded-xl bg-white/5 border border-white/15 px-2.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Skills / Interests</label>
                  <input
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="React, Python, Figma, IoT"
                    className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </>
            )}
          </div>

          {regRole === 'STUDENT' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Choose Your AI Companion</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                      <HeroAvatarSVG heroId={hId} mood={active ? 'celebration' : 'idle'} size={60} animateFloat={active} />
                      <div className="mt-2 text-xs font-bold">{meta.name}</div>
                      <div className="text-[10px] text-slate-400">{meta.roleTitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : regRole === 'FACULTY' ? (
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
          ) : null}

          {error && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-400/40 px-4 py-2.5 text-xs text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="neon-button w-full inline-flex items-center justify-center gap-2 py-3.5 text-sm font-extrabold"
          >
            {regRole === 'ADMIN'
              ? 'Enroll College & Launch Admin Command'
              : regRole === 'FACULTY'
              ? 'Activate Faculty Portal Account'
              : 'Activate My AttendanceGuard Account'}
            <ArrowRight className="h-4 w-4 text-[#00D9FF]" />
          </button>
        </form>
      </div>
    </div>
  );
};
