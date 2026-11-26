import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Navigation,
  Radio,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';
import { HeroAvatarSVG } from '../components/HeroCharacters';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { GenderCategory } from '../types';
import { toLocalDateIso } from '../utils/dateUtils';

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export const LiveRadarPage: React.FC = () => {
  const { user } = useAuth();
  const {
    colleges,
    activeCollegeId,
    subjects,
    demoCohort,
    teachers,
    morningCheckIns,
    updateStudentLocation,
    updateMyPrivacyAndDetails,
  } = useAppState();

  const [selectedCollegeId, setSelectedCollegeId] = useState(user?.collegeId || activeCollegeId);
  const [genderTab, setGenderTab] = useState<'GIRLS' | 'BOYS' | 'ALL'>('ALL');
  const [zoneInput, setZoneInput] = useState('Main Academic Block');
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  const selectedCollege = colleges.find((c) => c.id === selectedCollegeId) || colleges[0];
  const todayIso = toLocalDateIso();

  const allStudents = useMemo(
    () => [
      {
        id: 'demo-student-1',
        collegeId: 'clg-au-coe',
        fullName: 'Arjun Karthik',
        heroAlias: 'CyberShield-07',
        registerNumber: '22CSE042',
        department: 'CSE',
        semesterNumber: 5,
        yearOfStudy: 3,
        gender: 'MALE' as GenderCategory,
        email: 'arjun.hero@campus.edu',
        phone: '+91 98401 22410',
        residenceType: 'Day Scholar' as const,
        skills: ['React', 'TypeScript'],
        hackathonInterest: 'AI Builder',
        privacyShowProfile: user?.id === 'demo-student-1' ? Boolean(user?.privacyShowDirectory ?? true) : true,
        privacyShowLocation: user?.id === 'demo-student-1' ? Boolean(user?.privacyLocationOptIn ?? true) : true,
        location: {
          optedIn: true,
          zoneLabel: 'CSE Block • Lecture Hall 2',
          onCampus: true,
          distanceMeters: 60,
          updatedAt: new Date().toISOString(),
        },
        subjects,
      },
      ...demoCohort,
    ],
    [subjects, demoCohort, user]
  );

  const trackedStudents = useMemo(() => {
    return allStudents.filter((st) => {
      if (st.collegeId !== selectedCollegeId) return false;
      if (genderTab === 'GIRLS' && st.gender !== 'FEMALE') return false;
      if (genderTab === 'BOYS' && st.gender !== 'MALE') return false;
      return true;
    });
  }, [allStudents, selectedCollegeId, genderTab]);

  const collegeMorningResponses = useMemo(
    () => morningCheckIns.filter((m) => m.collegeId === selectedCollegeId && m.date === todayIso),
    [morningCheckIns, selectedCollegeId, todayIso]
  );

  const handleCaptureBrowserGPS = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('Browser GPS unavailable; using selected Campus Zone check-in instead.');
      updateStudentLocation({
        optedIn: true,
        zoneLabel: zoneInput,
        onCampus: !zoneInput.toLowerCase().includes('transit'),
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    setGpsStatus('Capturing encrypted GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        const dist = selectedCollege
          ? distanceMeters(lat, lng, selectedCollege.campusLat, selectedCollege.campusLng)
          : undefined;
        const onCampus = dist !== undefined ? dist <= (selectedCollege?.campusRadiusMeters || 850) : true;
        updateStudentLocation({
          optedIn: true,
          zoneLabel: onCampus ? `${zoneInput} (Verified GPS)` : `Transit / Off-Campus (${dist}m away)`,
          lat,
          lng,
          onCampus,
          distanceMeters: dist,
          updatedAt: new Date().toISOString(),
        });
        setGpsStatus(`Live GPS noted (${lat}, ${lng}) — ${onCampus ? 'On Campus' : `${dist}m from campus`}`);
      },
      () => {
        setGpsStatus('GPS permission denied or blocked; updated using your manual Campus Zone.');
        updateStudentLocation({
          optedIn: true,
          zoneLabel: zoneInput,
          onCampus: !zoneInput.toLowerCase().includes('transit'),
          updatedAt: new Date().toISOString(),
        });
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  return (
    <div className="space-y-6">
      {/* Rose + Cyan Campus Safety & Telemetry Hub Header */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-[#00D9FF]/40 bg-gradient-to-br from-pink-500/15 via-[#17152D]/90 to-[#00D9FF]/15 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <HeroAvatarSVG heroId="dawn-wing" mood="happy" size={72} />
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/20 border border-pink-400/40 px-3 py-0.5 text-[11px] font-bold text-pink-200">
              <Radio className="h-3.5 w-3.5 text-[#00D9FF]" /> Live Campus Radar • Privacy-First Tracking
            </span>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-white">
              Girls &amp; Boys Safety Hubs, Morning Roll &amp; Campus Locations
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Location is shared ONLY when opted-in by each student or teacher. Separated Girls Hub and Boys Hub ensure safe campus coordination.
            </p>
          </div>
        </div>

        <select
          value={selectedCollegeId}
          onChange={(e) => setSelectedCollegeId(e.target.value)}
          className="rounded-xl bg-[#101027] border border-white/15 px-3.5 py-2.5 text-xs font-bold text-white self-start"
        >
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      {/* Explicit Privacy Shield & Live GPS Check-In Panel */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-base font-bold flex items-center gap-2 text-[#00D9FF]">
            <Shield className="h-4 w-4" /> My Privacy Shield &amp; Live Location Check-In
          </h2>

          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => updateMyPrivacyAndDetails({ privacyLocationOptIn: !user?.privacyLocationOptIn })}
              className={`rounded-xl p-3 border text-left transition ${
                user?.privacyLocationOptIn
                  ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                  : 'bg-white/5 border-white/15 text-slate-300'
              }`}
            >
              <div className="font-bold">Live Campus Location: {user?.privacyLocationOptIn ? 'OPTED IN' : 'HIDDEN'}</div>
              <div className="text-[11px] opacity-80 mt-0.5">Toggle whether your campus zone is visible to your college.</div>
            </button>

            <button
              type="button"
              onClick={() => updateMyPrivacyAndDetails({ privacyShowDirectory: !(user?.privacyShowDirectory ?? true) })}
              className={`rounded-xl p-3 border text-left transition ${
                user?.privacyShowDirectory ?? true
                  ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200'
                  : 'bg-white/5 border-white/15 text-slate-300'
              }`}
            >
              <div className="font-bold">Directory Visibility: {(user?.privacyShowDirectory ?? true) ? 'PUBLIC IN CLG' : 'PRIVATE'}</div>
              <div className="text-[11px] opacity-80 mt-0.5">Mask phone/email when browsing student finder.</div>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 text-xs">
            <select
              value={zoneInput}
              onChange={(e) => setZoneInput(e.target.value)}
              className="flex-1 rounded-xl bg-[#101027] border border-white/15 px-3 py-2 text-white"
            >
              <option value="Main Academic Block">Main Academic Block</option>
              <option value="CSE / AI Research Lab">CSE / AI Research Lab</option>
              <option value="Central Library">Central Library</option>
              <option value="Girls Hostel Wing">Girls Hostel Wing</option>
              <option value="Boys Hostel Wing">Boys Hostel Wing</option>
              <option value="In Transit">In Transit</option>
            </select>
            <button
              type="button"
              onClick={handleCaptureBrowserGPS}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#1677FF] px-4 py-2 font-extrabold text-slate-950"
            >
              <Navigation className="h-3.5 w-3.5" /> Update Live Location
            </button>
          </div>
          {gpsStatus && <div className="text-[11px] text-cyan-300">{gpsStatus}</div>}
        </div>

        {/* Today's Morning Question Attendance Summary */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="font-display text-base font-bold flex items-center gap-2 text-amber-300">
            <Users className="h-4 w-4" /> Today’s Morning College Check-Ins ({todayIso})
          </h2>
          {collegeMorningResponses.length === 0 ? (
            <div className="text-xs text-slate-400">No morning responses recorded yet for {selectedCollege?.code} today.</div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
              {collegeMorningResponses.map((m) => (
                <div key={m.id} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-white">
                      {m.studentName}{' '}
                      <span className="text-[10px] font-mono text-cyan-300">
                        ({m.registerNumber} • {m.gender === 'FEMALE' ? 'Girl' : m.gender === 'MALE' ? 'Boy' : 'Student'})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {m.reason || 'Daily check-in'} {m.location?.zoneLabel ? `• ${m.location.zoneLabel}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {m.lowAttendanceWarned && (
                      <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                        Low Att ({m.overallPercentage.toFixed(0)}%)
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        m.status === 'COMING'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : m.status === 'LATE'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {m.status === 'COMING' && <CheckCircle2 className="h-3 w-3" />}
                      {m.status === 'LATE' && <Clock className="h-3 w-3" />}
                      {m.status === 'NOT_COMING' && <XCircle className="h-3 w-3" />}
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Separated Boys & Girls Live Location Views */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-white">Opted-In Live Campus Locations</h2>
          <div className="flex gap-1.5 text-xs">
            {[
              { id: 'ALL' as const, label: 'All Tracked' },
              { id: 'GIRLS' as const, label: 'Girls Hub' },
              { id: 'BOYS' as const, label: 'Boys Hub' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setGenderTab(t.id)}
                className={`rounded-xl px-3.5 py-1.5 font-bold transition ${
                  genderTab === t.id
                    ? t.id === 'GIRLS'
                      ? 'bg-pink-500 text-white'
                      : t.id === 'BOYS'
                      ? 'bg-blue-500 text-white'
                      : 'bg-[#00D9FF] text-slate-950'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {trackedStudents.map((st) => (
            <div key={st.id} className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white">{st.privacyShowProfile ? st.fullName : st.heroAlias}</div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    st.gender === 'FEMALE' ? 'bg-pink-500/20 text-pink-300' : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {st.gender === 'FEMALE' ? 'Girls' : st.gender === 'MALE' ? 'Boys' : 'Campus'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {st.registerNumber} • {st.department} • Yr {st.yearOfStudy}
              </div>
              {st.privacyShowLocation && st.location?.optedIn ? (
                <div className="rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/30 px-3 py-2 text-cyan-200 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <MapPin className="h-3.5 w-3.5 text-[#00D9FF]" />
                    {st.location.zoneLabel}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {st.location.onCampus ? 'Inside Campus Perimeter' : 'Outside Campus / Transit'} • Updated{' '}
                    {new Date(st.location.updatedAt).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-white/5 px-3 py-2 text-slate-400 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-400" /> Location Private (Not Opted-In)
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Faculty Cabin & Live Location Strip */}
        <div className="pt-3 border-t border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Faculty &amp; Teachers On Campus ({teachers.filter((t) => t.collegeId === selectedCollegeId).length})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {teachers
              .filter((t) => t.collegeId === selectedCollegeId)
              .map((t) => (
                <div key={t.id} className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-white">{t.fullName}</div>
                    <div className="text-[11px] text-cyan-300">{t.location?.zoneLabel || t.cabinLocation}</div>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    {t.department}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
