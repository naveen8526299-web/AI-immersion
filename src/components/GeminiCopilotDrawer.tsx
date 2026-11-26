import React, { useMemo, useState } from 'react';
import { Bot, KeyRound, Send, Sparkles, X } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import {
  askGeminiCampusCopilot,
  getSavedGeminiKey,
  saveSessionGeminiKey,
} from '../services/geminiService';
import { evaluateAttendance } from '../utils/attendanceMath';
import { toLocalDateIso } from '../utils/dateUtils';

interface ChatMsg {
  id: string;
  sender: 'USER' | 'GEMINI';
  text: string;
  meta?: string;
}

export const GeminiCopilotDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { user } = useAuth();
  const {
    subjects,
    overallSummary,
    colleges,
    activeCollegeId,
    demoCohort,
    teachers,
    hackathons,
    morningCheckIns,
  } = useAppState();

  const [apiKey, setApiKey] = useState(getSavedGeminiKey);
  const [showKeyBox, setShowKeyBox] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'init-1',
      sender: 'GEMINI',
      text: 'Hi! I’m your AttendanceGuard Gemini Copilot. Ask me if you should attend college today, how to recover low attendance, or which hackathon teams & peers match your skills.',
      meta: 'Ready',
    },
  ]);

  const activeCollege = colleges.find((c) => c.id === (user?.collegeId || activeCollegeId)) || colleges[0];
  const todayIso = toLocalDateIso();
  const todayCheck = morningCheckIns.find((m) => m.studentId === user?.id && m.date === todayIso);

  const contextData = useMemo(() => {
    const atRisk = subjects
      .map((s) => ({ s, ev: evaluateAttendance(s.attended, s.total, s.minPercentage) }))
      .filter((x) => !x.ev.isEligible)
      .map((x) => ({
        code: x.s.code,
        name: x.s.name,
        percentage: x.ev.displayPercentage,
        recoveryNeeded: x.ev.requiredRecoveryClasses,
      }));

    return {
      studentName: user?.fullName || 'Student',
      role: user?.role || 'STUDENT',
      collegeName: activeCollege?.name || 'Campus',
      overallPct: overallSummary.overallEval.exactPercentage,
      atRiskSubjects: atRisk,
      morningCheckInStatus: todayCheck?.status,
      openHackathonsCount: hackathons.filter((h) => h.collegeId === activeCollege?.id && h.status === 'OPEN').length,
      collegePeersCount: demoCohort.filter((d) => d.collegeId === activeCollege?.id).length + 1,
      teachersCount: teachers.filter((t) => t.collegeId === activeCollege?.id).length,
    };
  }, [user, activeCollege, subjects, overallSummary, todayCheck, hackathons, demoCohort, teachers]);

  if (!open) return null;

  const sendPrompt = async (questionText: string) => {
    const clean = questionText.trim();
    if (!clean || loading) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, sender: 'USER', text: clean }]);
    setInput('');
    setLoading(true);

    const res = await askGeminiCampusCopilot({
      question: clean,
      context: contextData,
      apiKey,
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `g-${Date.now()}`,
        sender: 'GEMINI',
        text: res.reply,
        meta: res.modelUsed,
      },
    ]);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-[#09091D] border-l border-violet-400/30 flex flex-col shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#8138F5]/25 to-[#00D9FF]/20">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#00D9FF] to-[#8138F5] flex items-center justify-center text-slate-950">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display font-bold text-sm text-white">Gemini Campus Copilot</div>
              <div className="text-[11px] text-cyan-300">
                {apiKey.trim() ? 'Live Gemini 4 Hydrogen API Active' : 'Smart Local Advisor (Add API Key Optional)'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowKeyBox((v) => !v)}
              className="rounded-lg bg-white/10 p-2 text-amber-300 hover:bg-white/20 transition"
              title="Configure Gemini API Key"
            >
              <KeyRound className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/10 p-2 text-slate-300 hover:bg-white/20 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showKeyBox && (
          <div className="p-3 bg-[#101027] border-b border-white/10 space-y-2 text-xs">
            <label className="block font-semibold text-slate-300">
              Gemini API Key (saved only in this browser tab session)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  saveSessionGeminiKey(e.target.value);
                }}
                placeholder="Paste AIza... key for live Gemini responses"
                className="flex-1 rounded-xl bg-[#080817] border border-white/15 px-3 py-1.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => setShowKeyBox(false)}
                className="rounded-xl bg-[#00D9FF] px-3 py-1.5 font-bold text-slate-950"
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap ${
                m.sender === 'USER'
                  ? 'ml-8 bg-[#1677FF]/25 border border-[#1677FF]/45 text-white'
                  : 'mr-6 bg-[#17152D] border border-violet-400/25 text-slate-200'
              }`}
            >
              {m.sender === 'GEMINI' && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#00D9FF] mb-1">
                  <Bot className="h-3.5 w-3.5" /> {m.meta || 'Gemini Copilot'}
                </div>
              )}
              {m.text}
            </div>
          ))}
          {loading && (
            <div className="mr-6 rounded-2xl p-3 bg-[#17152D] border border-violet-400/25 text-xs text-cyan-300 animate-pulse">
              Thinking with live attendance &amp; campus telemetry...
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/10 space-y-2 bg-[#080817]">
          <div className="flex flex-wrap gap-1.5">
            {[
              'Should I come to college today?',
              'How can I recover low attendance?',
              'Find hackathon teams for me',
              'Show college teachers & campus hub',
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendPrompt(q)}
                className="rounded-full bg-white/5 hover:bg-white/15 border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-200 transition"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendPrompt(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Gemini about attendance, teammates, campus..."
              className="flex-1 rounded-xl bg-[#101027] border border-white/15 px-3 py-2 text-xs text-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#8138F5] px-3.5 py-2 font-bold text-slate-950 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
