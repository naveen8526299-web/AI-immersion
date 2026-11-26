import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Building2,
  Film,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import { HeroAvatarSVG } from '../components/HeroCharacters';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { CampusMediaPost, GenderCategory } from '../types';
import { assetUrl } from '../utils/assetUrl';
import { evaluateOverallSubjects } from '../utils/attendanceMath';

export const CampusHubPage: React.FC = () => {
  const { user } = useAuth();
  const {
    colleges,
    activeCollegeId,
    setActiveCollegeId,
    subjects,
    demoCohort,
    teachers,
    campusPosts,
    createCampusPost,
    toggleLikeCampusPost,
    addCommentCampusPost,
  } = useAppState();

  const [tab, setTab] = useState<'FEED' | 'STUDENTS' | 'TEACHERS'>('FEED');
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(user?.collegeId || activeCollegeId);
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'FEMALE' | 'MALE'>('ALL');
  const [feedTypeFilter, setFeedTypeFilter] = useState<'ALL' | CampusMediaPost['postType']>('ALL');
  const [search, setSearch] = useState('');

  // Composer state
  const [postType, setPostType] = useState<CampusMediaPost['postType']>('PHOTO');
  const [caption, setCaption] = useState('');
  const [tagsText, setTagsText] = useState('CampusLife, Hackathon, AI');
  const [mediaUrl, setMediaUrl] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const selectedCollege = colleges.find((c) => c.id === selectedCollegeId) || colleges[0];

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
        skills: ['React', 'TypeScript', 'PyTorch', 'Gemini API'],
        hackathonInterest: 'Smart India Hackathon • Full-Stack & AI',
        privacyShowProfile: true,
        privacyShowLocation: true,
        subjects,
      },
      ...demoCohort,
    ],
    [subjects, demoCohort]
  );

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allStudents.filter((s) => {
      if (s.collegeId !== selectedCollegeId) return false;
      if (deptFilter !== 'ALL' && s.department.toLowerCase() !== deptFilter.toLowerCase()) return false;
      if (yearFilter !== 'ALL' && String(s.yearOfStudy || 3) !== yearFilter) return false;
      if (genderFilter !== 'ALL' && s.gender !== genderFilter) return false;
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.registerNumber.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        (s.skills || []).some((sk) => sk.toLowerCase().includes(q)) ||
        (s.hackathonInterest || '').toLowerCase().includes(q)
      );
    });
  }, [allStudents, selectedCollegeId, deptFilter, yearFilter, genderFilter, search]);

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      if (t.collegeId !== selectedCollegeId) return false;
      if (deptFilter !== 'ALL' && t.department.toLowerCase() !== deptFilter.toLowerCase()) return false;
      if (genderFilter !== 'ALL' && t.gender !== genderFilter) return false;
      if (!q) return true;
      return (
        t.fullName.toLowerCase().includes(q) ||
        t.facultyId.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.assignedSubjectCodes.some((c) => c.toLowerCase().includes(q)) ||
        t.researchAreas.some((r) => r.toLowerCase().includes(q))
      );
    });
  }, [teachers, selectedCollegeId, deptFilter, genderFilter, search]);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campusPosts.filter((p) => {
      if (p.collegeId !== selectedCollegeId) return false;
      if (feedTypeFilter !== 'ALL' && p.postType !== feedTypeFilter) return false;
      if (deptFilter !== 'ALL' && p.authorDept.toLowerCase() !== deptFilter.toLowerCase()) return false;
      if (yearFilter !== 'ALL' && String(p.authorYear) !== yearFilter) return false;
      if (genderFilter !== 'ALL' && p.authorGender !== genderFilter) return false;
      if (!q) return true;
      return (
        p.caption.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [campusPosts, selectedCollegeId, feedTypeFilter, deptFilter, yearFilter, genderFilter, search]);

  const handleMediaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('video/')) {
      setMediaUrl(URL.createObjectURL(file));
      setPostType('REEL');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMediaUrl(reader.result);
        setPostType('PHOTO');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsText
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    const res = createCampusPost({ postType, caption, tags, mediaUrl });
    if (res.ok) {
      setCaption('');
      setMediaUrl('');
    }
  };

  const departments = Array.from(new Set([...(selectedCollege?.departments || []), 'CSE', 'AI&DS', 'ECE', 'IT']));

  return (
    <div className="space-y-6">
      {/* Aurora Violet/Cyan Hub Theme Header */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-[#8138F5]/40 bg-gradient-to-br from-[#8138F5]/20 via-[#17152D]/85 to-[#00D9FF]/15 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <HeroAvatarSVG heroId="spider-coder" mood="happy" size={72} />
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8138F5]/25 border border-[#8138F5]/45 px-3 py-0.5 text-[11px] font-bold text-purple-200">
              <Sparkles className="h-3.5 w-3.5 text-[#00D9FF]" /> Campus Network • LinkedIn + Instagram Hub
            </span>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-white">
              {selectedCollege?.name || 'Campus Network'}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Discover students &amp; teachers by College, Department, Year, and Boys/Girls tabs. Share Photos, Reels &amp; Achievements.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-xs">
          <div className="flex items-center gap-2 rounded-xl bg-[#080817]/80 border border-white/15 px-3 py-2">
            <Building2 className="h-4 w-4 text-[#00D9FF]" />
            <select
              value={selectedCollegeId}
              onChange={(e) => {
                setSelectedCollegeId(e.target.value);
                setActiveCollegeId(e.target.value);
              }}
              className="bg-transparent font-bold text-white outline-none"
            >
              {colleges.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#080817]">
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs + Multi-Filter Bar */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'FEED' as const, label: `Photos, Posts & Reels (${filteredPosts.length})`, icon: <ImageIcon className="h-3.5 w-3.5" /> },
              { id: 'STUDENTS' as const, label: `Students (${filteredStudents.length})`, icon: <Users className="h-3.5 w-3.5" /> },
              { id: 'TEACHERS' as const, label: `Teachers (${filteredTeachers.length})`, icon: <GraduationCap className="h-3.5 w-3.5" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                  tab === item.id
                    ? 'bg-gradient-to-r from-[#8138F5] to-[#00D9FF] text-slate-950 shadow-lg'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 p-1 text-xs">
            {[
              { id: 'ALL' as const, label: 'All Students' },
              { id: 'FEMALE' as const, label: 'Girls Hub' },
              { id: 'MALE' as const, label: 'Boys Hub' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setGenderFilter(g.id)}
                className={`rounded-lg px-3 py-1 font-bold transition ${
                  genderFilter === g.id ? 'bg-[#00D9FF] text-slate-950' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-2.5 text-xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, reg no, skill, subject..."
              className="w-full rounded-xl bg-white/5 border border-white/15 pl-8 pr-3 py-2 text-white"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-xl bg-[#101027] border border-white/15 px-3 py-2 text-white font-semibold"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                Dept: {d}
              </option>
            ))}
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-xl bg-[#101027] border border-white/15 px-3 py-2 text-white font-semibold"
          >
            <option value="ALL">All Years (1st – 4th Year)</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
      </div>

      {/* TAB 1: SOCIAL FEED (Photos, Posts, Reels, Achievements) */}
      {tab === 'FEED' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreatePost} className="glass-card rounded-2xl p-5 space-y-3.5 h-fit">
            <h2 className="font-display text-base font-bold flex items-center gap-2 text-[#00D9FF]">
              <Film className="h-4 w-4" /> Share Campus Photo / Post / Reel
            </h2>
            <div className="grid grid-cols-4 gap-1.5 text-[11px]">
              {(['PHOTO', 'POST', 'REEL', 'ACHIEVEMENT'] as const).map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setPostType(pt)}
                  className={`rounded-lg py-1.5 font-bold border transition ${
                    postType === pt
                      ? 'bg-[#8138F5] border-[#8138F5] text-white'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
            <textarea
              required
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share campus life, lab project demo, reel update, or hackathon milestone..."
              className="w-full rounded-xl bg-white/5 border border-white/15 p-3 text-xs text-white"
            />
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="Tags (comma-separated: SIH, React, CSE)"
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs text-white"
            />
            <div className="flex items-center gap-2">
              <input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Optional image/video URL..."
                className="flex-1 rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs text-white"
              />
              <label className="inline-flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-2 text-[11px] font-bold cursor-pointer shrink-0">
                <Upload className="h-3.5 w-3.5 text-[#00D9FF]" /> Upload
                <input type="file" accept="image/*,video/*" onChange={handleMediaFileUpload} className="hidden" />
              </label>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-[#8138F5] to-[#00D9FF] py-2.5 text-xs font-extrabold text-slate-950 hover:brightness-110 transition"
            >
              Publish to {selectedCollege?.code} Feed
            </button>
          </form>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {(['ALL', 'PHOTO', 'REEL', 'POST', 'ACHIEVEMENT'] as const).map((ft) => (
                <button
                  key={ft}
                  onClick={() => setFeedTypeFilter(ft)}
                  className={`rounded-full px-3 py-1 font-bold border transition ${
                    feedTypeFilter === ft
                      ? 'bg-[#00D9FF] border-[#00D9FF] text-slate-950'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>

            {filteredPosts.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center text-xs text-slate-400">
                No campus posts match your filters yet. Share the first Photo, Post, or Reel for {selectedCollege?.name}!
              </div>
            ) : (
              filteredPosts.map((post) => {
                const likedByMe = user ? post.likes.includes(user.id) : false;
                const isVideo =
                  post.postType === 'REEL' &&
                  post.mediaUrl &&
                  (post.mediaUrl.startsWith('blob:') || /\.(mp4|webm|mov)$/i.test(post.mediaUrl));
                const resolvedSrc = post.mediaUrl
                  ? post.mediaUrl.startsWith('/')
                    ? assetUrl(post.mediaUrl.slice(1))
                    : post.mediaUrl
                  : null;

                return (
                  <article key={post.id} className="glass-card rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-sm text-white">{post.authorName}</span>
                          <span className="rounded-full bg-[#8138F5]/25 px-2 py-0.5 text-[10px] font-bold text-purple-200">
                            {post.authorDept} • Year {post.authorYear}
                          </span>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                            {post.authorGender === 'FEMALE' ? 'Girls' : post.authorGender === 'MALE' ? 'Boys' : 'Campus'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          @{post.authorAlias} • {new Date(post.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#00D9FF]/15 border border-[#00D9FF]/35 px-2.5 py-0.5 text-[10px] font-bold text-[#00D9FF]">
                        {post.postType === 'ACHIEVEMENT' && <Award className="h-3 w-3" />}
                        {post.postType === 'REEL' && <Film className="h-3 w-3" />}
                        {post.postType}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{post.caption}</p>

                    {resolvedSrc && (
                      <div className="rounded-2xl overflow-hidden border border-white/10 max-h-72 bg-black/40">
                        {isVideo ? (
                          <video src={resolvedSrc} controls className="w-full max-h-72 object-contain" />
                        ) : (
                          <img src={resolvedSrc} alt={post.postType} className="w-full max-h-72 object-cover" />
                        )}
                      </div>
                    )}

                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((tag) => (
                          <span key={tag} className="text-[11px] font-mono text-[#00D9FF]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/10 flex items-center gap-4 text-xs">
                      <button
                        type="button"
                        onClick={() => toggleLikeCampusPost(post.id)}
                        className={`inline-flex items-center gap-1.5 font-bold transition ${
                          likedByMe ? 'text-rose-400' : 'text-slate-300 hover:text-rose-300'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${likedByMe ? 'fill-rose-400' : ''}`} />
                        {post.likes.length} Likes
                      </button>
                      <span className="inline-flex items-center gap-1.5 text-slate-400">
                        <MessageSquare className="h-4 w-4" /> {post.comments.length} Comments
                      </span>
                    </div>

                    {post.comments.length > 0 && (
                      <div className="space-y-1.5 bg-white/5 rounded-xl p-2.5 text-xs">
                        {post.comments.map((c) => (
                          <div key={c.id}>
                            <strong className="text-[#00D9FF]">{c.authorName}:</strong>{' '}
                            <span className="text-slate-200">{c.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const txt = commentDrafts[post.id] || '';
                        if (!txt.trim()) return;
                        addCommentCampusPost(post.id, txt);
                        setCommentDrafts((prev) => ({ ...prev, [post.id]: '' }));
                      }}
                      className="flex gap-2"
                    >
                      <input
                        value={commentDrafts[post.id] || ''}
                        onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Write a comment..."
                        className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-cyan-300"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REGISTERED STUDENTS DIRECTORY */}
      {tab === 'STUDENTS' && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((st) => {
            const sum = evaluateOverallSubjects(st.subjects);
            const hidePrivate = !st.privacyShowProfile && user?.role === 'STUDENT' && user.id !== st.id;
            return (
              <div key={st.id} className="glass-card rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-base font-bold text-white">
                      {hidePrivate ? st.heroAlias : st.fullName}
                    </div>
                    <div className="text-[11px] font-mono text-[#00D9FF]">
                      {st.registerNumber} • {st.department} • Year {st.yearOfStudy || 3}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      st.gender === 'FEMALE'
                        ? 'bg-pink-500/20 text-pink-300 border border-pink-400/35'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-400/35'
                    }`}
                  >
                    {st.gender === 'FEMALE' ? 'Girls Hub' : st.gender === 'MALE' ? 'Boys Hub' : 'Campus'}
                  </span>
                </div>

                {hidePrivate ? (
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-slate-400 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                    Private Student Profile — only alias &amp; skills shared.
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-cyan-400" /> {st.email}
                    </div>
                    {st.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-emerald-400" /> {st.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                      {st.residenceType || 'Day Scholar'} • Attendance:{' '}
                      <strong className={sum.atRiskCount === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {user?.role === 'STUDENT' && user.id !== st.id
                          ? sum.atRiskCount === 0
                            ? 'Safe Zone'
                            : 'Needs Recovery'
                          : sum.overallEval.displayPercentage}
                      </strong>
                    </div>
                    {st.privacyShowLocation && st.location?.optedIn && (
                      <div className="flex items-center gap-1.5 text-cyan-300">
                        <MapPin className="h-3.5 w-3.5" /> {st.location.zoneLabel}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[11px] text-slate-400">
                  <strong>Hackathon Focus:</strong> {st.hackathonInterest || 'Open to projects'}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(st.skills || []).map((sk) => (
                    <span
                      key={sk}
                      className="rounded-full bg-[#8138F5]/20 border border-[#8138F5]/35 px-2.5 py-0.5 text-[10px] font-bold text-purple-200"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: TEACHERS DIRECTORY (FULL DETAILS) */}
      {tab === 'TEACHERS' && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTeachers.map((t) => (
            <div key={t.id} className="glass-card rounded-2xl p-5 space-y-3 border border-cyan-400/25">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-base font-bold text-white">{t.fullName}</div>
                  <div className="text-[11px] text-[#00D9FF] font-semibold">
                    {t.designation} • {t.department}
                  </div>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-mono text-amber-300">
                  {t.facultyId}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-cyan-400" /> {t.email}
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" /> {t.phone}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-rose-400" /> {t.cabinLocation} ({t.officeHours})
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-amber-400" /> Subjects:{' '}
                  <strong className="font-mono text-white">{t.assignedSubjectCodes.join(', ')}</strong>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {t.researchAreas.map((r) => (
                  <span key={r} className="rounded-full bg-cyan-500/15 border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-200">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
