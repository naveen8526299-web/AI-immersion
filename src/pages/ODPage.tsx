import React, { useMemo, useState } from 'react';
import { Briefcase, CheckCircle2, Clock, Info, Sparkles, XCircle } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { ODEventType } from '../types';
import { evaluateAttendance } from '../utils/attendanceMath';
import { toLocalDateIso } from '../utils/dateUtils';

const EVENT_TYPES: ODEventType[] = [
  'Hackathon',
  'CoE Workshop',
  'Symposium',
  'Sports Event',
  'Technical Competition',
  'College Representation',
  'Official Academic Event',
];

export const ODPage: React.FC = () => {
  const { subjects, odRequests, submitODRequest } = useAppState();

  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<ODEventType>('Hackathon');
  const [startDate, setStartDate] = useState(() => toLocalDateIso());
  const [endDate, setEndDate] = useState(() => toLocalDateIso());
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(subjects[0] ? [subjects[0].id] : []);
  const [periodsPerSubject, setPeriodsPerSubject] = useState(2);
  const [documentNote, setDocumentNote] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Pre-approval impact preview
  const impactPreviews = useMemo(
    () =>
      subjects
        .filter((s) => selectedSubjectIds.includes(s.id))
        .map((s) => {
          const before = evaluateAttendance(s.attended, s.total, s.minPercentage);
          const after = evaluateAttendance(
            s.attended + periodsPerSubject,
            s.total + periodsPerSubject,
            s.minPercentage
          );
          return { subject: s, before, after };
        }),
    [subjects, selectedSubjectIds, periodsPerSubject]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = submitODRequest({
      eventName,
      eventType,
      startDate,
      endDate,
      subjectIds: selectedSubjectIds,
      periodsPerSubject,
      documentNote,
    });
    if (!res.ok) {
      setFeedback({ ok: false, text: res.error || 'Could not submit OD request.' });
      return;
    }
    setFeedback({
      ok: true,
      text: 'OD request submitted! Status is PENDING — credits apply only after Faculty/Admin approval.',
    });
    setEventName('');
    setDocumentNote('');
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
          <Briefcase className="h-3.5 w-3.5" /> Smart OD Reconciliation
        </span>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold">On-Duty (OD) Credit Requests</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Submit Hackathon, CoE workshop, symposium, or sports ODs and preview exact attendance impact before approval.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-3.5 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
        <span>
          Policy Guardrail: OD requests are NOT counted as attended classes until verified & approved by authorized Faculty
          or Admin. Demo approvals are simulated locally and clearly labeled.
        </span>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 glass-card rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="font-display text-lg font-bold">Submit New OD Claim</h2>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Event Name *</label>
              <input
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., National CoE AI Hackathon"
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as ODEventType)}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">Participating Subjects *</label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => {
                const active = selectedSubjectIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSubject(s.id)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                      active
                        ? 'bg-electric-600 text-white border-electric-400'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10'
                    }`}
                  >
                    {s.code} ({s.attended}/{s.total})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Eligible Periods per Subject</label>
              <input
                type="number"
                min={1}
                max={12}
                value={periodsPerSubject}
                onChange={(e) => setPeriodsPerSubject(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Supporting Proof / Document Ref</label>
              <input
                value={documentNote}
                onChange={(e) => setDocumentNote(e.target.value)}
                placeholder="Certificate ID or coordinator note"
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {feedback && (
            <div
              className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                feedback.ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 py-3 text-sm font-extrabold text-slate-950 hover:brightness-110 transition"
          >
            Submit OD Request for Faculty Verification
          </button>
        </form>

        {/* Pre-Approval Impact Preview */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" /> Projected Post-Approval Impact
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Preview how approving +{periodsPerSubject} OD period(s) would affect each selected subject:
          </p>
          {impactPreviews.length === 0 ? (
            <div className="text-xs text-slate-500">Select one or more subjects to preview impact.</div>
          ) : (
            <div className="space-y-3">
              {impactPreviews.map(({ subject, before, after }) => (
                <div key={subject.id} className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3.5 text-xs space-y-1">
                  <div className="font-bold">
                    {subject.code} — {subject.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Before: {before.displayPercentage}</span>
                    <span className="font-bold text-emerald-400">If Approved: {after.displayPercentage}</span>
                  </div>
                  {!before.isEligible && after.isEligible && (
                    <div className="text-emerald-400 font-semibold">Restores {subject.minPercentage}% eligibility!</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OD Requests History */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-display text-lg font-bold mb-4">Your OD Applications & Reconciliation Status</h2>
        <div className="space-y-3">
          {odRequests.map((od) => (
            <div
              key={od.id}
              className="rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{od.eventName}</span>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold">{od.eventType}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-1">
                  Dates: {od.startDate} to {od.endDate} • {od.periodsPerSubject} period(s)/subject •{' '}
                  {od.subjectIds
                    .map((sid) => subjects.find((s) => s.id === sid)?.code || sid)
                    .join(', ')}
                </div>
                {od.remarks && <div className="mt-1 text-cyan-500">Remarks: {od.remarks}</div>}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-bold ${
                    od.status === 'APPROVED'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : od.status === 'REJECTED'
                      ? 'bg-rose-500/15 text-rose-400'
                      : 'bg-amber-500/15 text-amber-400'
                  }`}
                >
                  {od.status === 'APPROVED' ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : od.status === 'REJECTED' ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  {od.status}
                  {od.reconciled && ' • Reconciled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
