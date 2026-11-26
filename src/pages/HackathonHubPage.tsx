import React, { useMemo, useState } from 'react';
import { CheckCircle2, Code2, Flame, Plus, Search, Trophy, Users, XCircle } from 'lucide-react';
import { HeroAvatarSVG } from '../components/HeroCharacters';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { toLocalDateIso } from '../utils/dateUtils';

export const HackathonHubPage: React.FC = () => {
  const { user } = useAuth();
  const {
    colleges,
    activeCollegeId,
    hackathons,
    createHackathonPost,
    applyToHackathon,
    reviewHackathonApplicant,
  } = useAppState();

  const [collegeFilter, setCollegeFilter] = useState<string>(user?.collegeId || activeCollegeId);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Create form state
  const [title, setTitle] = useState('');
  const [ideaSummary, setIdeaSummary] = useState('');
  const [domain, setDomain] = useState('AI / Smart Campus');
  const [neededRolesText, setNeededRolesText] = useState('React Developer, ML Engineer');
  const [techStackText, setTechStackText] = useState('React, TypeScript, Gemini API');
  const [teamSizeMax, setTeamSizeMax] = useState(4);
  const [deadline, setDeadline] = useState(toLocalDateIso());
  const [prizeOrEvent, setPrizeOrEvent] = useState('Smart India Hackathon 2026');

  // Apply drafts per hackathonId
  const [applyTargetId, setApplyTargetId] = useState<string | null>(null);
  const [applyPitch, setApplyPitch] = useState('');
  const [applySkills, setApplySkills] = useState((user?.skills || ['React', 'Python']).join(', '));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hackathons.filter((h) => {
      if (collegeFilter !== 'ALL' && h.collegeId !== collegeFilter) return false;
      if (!q) return true;
      return (
        h.title.toLowerCase().includes(q) ||
        h.ideaSummary.toLowerCase().includes(q) ||
        h.domain.toLowerCase().includes(q) ||
        h.neededRoles.some((r) => r.toLowerCase().includes(q)) ||
        h.techStack.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [hackathons, collegeFilter, search]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createHackathonPost({
      title,
      ideaSummary,
      domain,
      neededRoles: neededRolesText.split(',').map((s) => s.trim()),
      techStack: techStackText.split(',').map((s) => s.trim()),
      teamSizeMax,
      deadline,
      prizeOrEvent,
    });
    if (res.ok) {
      setTitle('');
      setIdeaSummary('');
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gold & Emerald Hackathon Forge Theme Header */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-[#FFC857]/40 bg-gradient-to-br from-[#FFC857]/15 via-[#17152D]/90 to-[#22C55E]/15 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <HeroAvatarSVG heroId="nova-forge" mood="celebration" size={74} />
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFC857]/20 border border-[#FFC857]/45 px-3 py-0.5 text-[11px] font-bold text-[#FFC857]">
              <Trophy className="h-3.5 w-3.5" /> Hackathon Forge • Teammate &amp; Idea Matchmaker
            </span>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-white">
              Build Teams Across Departments &amp; Years
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Have a hackathon idea and need extra developers, AI engineers, or designers? Pitch your project or apply to teams with 1 click.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFC857] to-[#22C55E] px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg hover:brightness-110 transition self-start"
        >
          <Plus className="h-4 w-4" /> {showForm ? 'Close Pitch Form' : 'Post Hackathon Idea'}
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 grid sm:grid-cols-2 gap-3 text-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search idea, tech stack (Gemini, React, IoT), or role needed..."
            className="w-full rounded-xl bg-white/5 border border-white/15 pl-8 pr-3 py-2 text-white"
          />
        </div>
        <select
          value={collegeFilter}
          onChange={(e) => setCollegeFilter(e.target.value)}
          className="rounded-xl bg-[#101027] border border-white/15 px-3 py-2 text-white font-semibold"
        >
          <option value="ALL">All Enrolled Colleges</option>
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card rounded-2xl p-5 space-y-3 border border-emerald-400/35 text-xs">
          <h2 className="font-display text-lg font-bold text-[#FFC857]">Pitch a Hackathon Project</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project / Idea Title"
              className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-white"
            />
            <input
              value={prizeOrEvent}
              onChange={(e) => setPrizeOrEvent(e.target.value)}
              placeholder="Hackathon Event (e.g. Smart India Hackathon)"
              className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-white"
            />
            <input
              value={neededRolesText}
              onChange={(e) => setNeededRolesText(e.target.value)}
              placeholder="Needed Roles (comma-separated)"
              className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-white"
            />
            <input
              value={techStackText}
              onChange={(e) => setTechStackText(e.target.value)}
              placeholder="Tech Stack (comma-separated)"
              className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-white"
            />
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Domain (AI, IoT, FinTech, Health)"
              className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={2}
                max={8}
                value={teamSizeMax}
                onChange={(e) => setTeamSizeMax(Number(e.target.value))}
                className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-white font-mono"
              />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-white"
              />
            </div>
          </div>
          <textarea
            required
            rows={3}
            value={ideaSummary}
            onChange={(e) => setIdeaSummary(e.target.value)}
            placeholder="Describe your idea and who would be the best fit..."
            className="w-full rounded-xl bg-white/5 border border-white/15 p-3 text-white"
          />
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-[#FFC857] to-[#22C55E] px-5 py-2.5 font-extrabold text-slate-950"
          >
            Publish Team Call
          </button>
        </form>
      )}

      {/* Teams Grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        {filtered.map((hack) => {
          const college = colleges.find((c) => c.id === hack.collegeId);
          const isCreator = user?.id === hack.creatorId;
          const alreadyApplied = user ? hack.applicants.some((a) => a.applicantId === user.id) : false;

          return (
            <div key={hack.id} className="glass-card rounded-2xl p-5 space-y-3 border border-white/10">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                    <Flame className="h-3 w-3" /> {hack.domain} • {college?.code}
                  </span>
                  <h2 className="mt-1.5 font-display text-lg font-bold text-white">{hack.title}</h2>
                  <p className="text-[11px] text-slate-400">
                    Lead: <strong>{hack.creatorName}</strong> ({hack.creatorDept}, Year {hack.creatorYear}) • {hack.prizeOrEvent}
                  </p>
                </div>
                <span className="rounded-xl bg-[#FFC857]/15 border border-[#FFC857]/35 px-2.5 py-1 text-xs font-mono font-bold text-[#FFC857] shrink-0">
                  <Users className="inline h-3.5 w-3.5 mr-1" />
                  {hack.currentMembers}/{hack.teamSizeMax}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">{hack.ideaSummary}</p>

              <div className="space-y-1.5 text-xs">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-slate-400 font-semibold">Looking for:</span>
                  {hack.neededRoles.map((r) => (
                    <span key={r} className="rounded-full bg-[#FFC857]/20 border border-[#FFC857]/35 px-2.5 py-0.5 text-[10px] font-bold text-[#FFC857]">
                      {r}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                  {hack.techStack.map((t) => (
                    <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono text-cyan-200">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Apply action */}
              {!isCreator && (
                <div className="pt-2">
                  {alreadyApplied ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/35 px-3 py-1.5 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Application Submitted
                    </span>
                  ) : applyTargetId === hack.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const res = applyToHackathon(hack.id, applyPitch, applySkills);
                        if (res.ok) {
                          setApplyTargetId(null);
                          setApplyPitch('');
                        }
                      }}
                      className="space-y-2 rounded-xl bg-white/5 border border-white/10 p-3 text-xs"
                    >
                      <input
                        required
                        value={applySkills}
                        onChange={(e) => setApplySkills(e.target.value)}
                        placeholder="Your skills (e.g. React, UI/UX, PyTorch)"
                        className="w-full rounded-lg bg-[#080817] border border-white/15 px-2.5 py-1.5 text-white"
                      />
                      <textarea
                        required
                        rows={2}
                        value={applyPitch}
                        onChange={(e) => setApplyPitch(e.target.value)}
                        placeholder="Why do you want to join this idea?"
                        className="w-full rounded-lg bg-[#080817] border border-white/15 px-2.5 py-1.5 text-white"
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="rounded-lg bg-emerald-500 px-3 py-1.5 font-bold text-slate-950">
                          Submit Application
                        </button>
                        <button
                          type="button"
                          onClick={() => setApplyTargetId(null)}
                          className="rounded-lg bg-white/10 px-3 py-1.5 font-bold text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setApplyTargetId(hack.id)}
                      className="rounded-xl bg-gradient-to-r from-[#FFC857] to-[#22C55E] px-4 py-2 text-xs font-extrabold text-slate-950 hover:brightness-110 transition"
                    >
                      Apply to Join Team →
                    </button>
                  )}
                </div>
              )}

              {/* Applicants list (Visible to Creator / Admin / Accepted teammates) */}
              {hack.applicants.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-2 text-xs">
                  <div className="font-bold text-slate-300">Applicants ({hack.applicants.length})</div>
                  {hack.applicants.map((a) => (
                    <div key={a.id} className="rounded-xl bg-white/5 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-white">
                          {a.applicantName}{' '}
                          <span className="text-[10px] font-mono text-cyan-300">
                            ({a.department} • Yr {a.yearOfStudy})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300">{a.pitch}</div>
                        <div className="text-[10px] text-amber-300">Skills: {a.skills}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            a.status === 'ACCEPTED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : a.status === 'DECLINED'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {a.status}
                        </span>
                        {(isCreator || user?.role === 'ADMIN') && a.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => reviewHackathonApplicant(hack.id, a.id, 'ACCEPTED')}
                              className="rounded-lg bg-emerald-500/20 p-1 text-emerald-300 hover:bg-emerald-500/35"
                              title="Accept"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => reviewHackathonApplicant(hack.id, a.id, 'DECLINED')}
                              className="rounded-lg bg-rose-500/20 p-1 text-rose-300 hover:bg-rose-500/35"
                              title="Decline"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
