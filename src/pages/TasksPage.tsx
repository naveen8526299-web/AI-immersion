import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Plus, Search, Trash2, X } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { TaskCategory, TaskPriority } from '../types';
import { REWARD_RULES } from '../utils/gamification';
import { addLocalDaysIso, toLocalDateIso } from '../utils/dateUtils';

const CATEGORIES: TaskCategory[] = [
  'Homework',
  'Assignment',
  'Lab Record',
  'CoE Project',
  'Hackathon',
  'Seminar Prep',
  'Exam Prep',
];

export const TasksPage: React.FC = () => {
  const { tasks, subjects, addTask, deleteTask, toggleTaskCompletion } = useAppState();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showAdd, setShowAdd] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Homework');
  const [subjectCode, setSubjectCode] = useState(subjects[0]?.code || 'MA501');
  const [assignedTo, setAssignedTo] = useState('CyberShield-07');
  const [deadline, setDeadline] = useState(() => addLocalDaysIso(3));
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');

  const todayIso = toLocalDateIso();

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        const matchesCat = categoryFilter === 'ALL' || t.category === categoryFilter;
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.subjectCode.toLowerCase().includes(q) ||
          t.assignedTo.toLowerCase().includes(q);
        return matchesCat && matchesSearch;
      }),
    [tasks, categoryFilter, search]
  );

  const overdueTasks = tasks.filter((t) => t.status !== 'COMPLETED' && t.deadline < todayIso);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addTask({
      title: title.trim(),
      description: description.trim(),
      category,
      subjectCode,
      assignedTo,
      deadline,
      priority,
      status: 'TODO',
    });
    setTitle('');
    setDescription('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Shared Homework, Assignments & Projects</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Complete tasks to earn verified Coins & XP (+15 to +50). Duplicate rewards are blocked automatically.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-xs font-extrabold text-slate-950 self-start"
        >
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      {overdueTasks.length > 0 && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-center gap-3 text-xs text-rose-500 dark:text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{overdueTasks.length} overdue task(s):</strong>{' '}
            {overdueTasks.map((t) => `${t.title} (${t.deadline})`).join(', ')}
          </span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, subject code, or assignee..."
            className="w-full rounded-xl glass-card pl-10 pr-4 py-2.5 text-sm focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl glass-card px-3.5 py-2.5 text-sm font-semibold"
        >
          <option value="ALL">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Tasks List */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filteredTasks.map((t) => {
          const isOverdue = t.status !== 'COMPLETED' && t.deadline < todayIso;
          const rew = REWARD_RULES.TASK_REWARDS[t.category] || { coins: 15, xp: 15 };
          return (
            <div
              key={t.id}
              className={`glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 ${
                t.status === 'COMPLETED' ? 'opacity-75' : isOverdue ? 'border-rose-500/45' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 font-bold text-indigo-400">
                      {t.category}
                    </span>
                    <span className="font-mono font-bold text-cyan-400">{t.subjectCode}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 font-bold ${
                      t.priority === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400'
                        : t.priority === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>

                <h3 className={`mt-2 font-display text-base font-bold ${t.status === 'COMPLETED' ? 'line-through' : ''}`}>
                  {t.title}
                </h3>
                {t.description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{t.description}</p>}
              </div>

              <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Assignee:</span> <strong>{t.assignedTo}</strong>
                  <span className={`ml-2 font-mono ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                    Due {t.deadline}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleTaskCompletion(t.id)}
                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 font-bold transition ${
                      t.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-500'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t.status === 'COMPLETED' ? 'Done' : `Complete (+${rew.coins}🪙)`}
                  </button>
                  <button
                    onClick={() => deleteTask(t.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400"
                    title="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md rounded-2xl glass-card bg-white dark:bg-[#0b1233] p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Add Squad Task / Assignment</h3>
              <button type="button" onClick={() => setShowAdd(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title *"
              className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description / submission instructions"
              rows={2}
              className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                className="rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.code}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
            <input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Assigned Hero Alias"
              className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 py-2.5 text-sm font-extrabold text-slate-950"
            >
              Create Task
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
