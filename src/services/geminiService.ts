export interface GeminiCopilotContext {
  studentName: string;
  role: string;
  collegeName: string;
  overallPct: number;
  atRiskSubjects: Array<{ code: string; name: string; percentage: string; recoveryNeeded: number }>;
  morningCheckInStatus?: string;
  openHackathonsCount: number;
  collegePeersCount: number;
  teachersCount: number;
}

export interface GeminiCopilotResult {
  reply: string;
  mode: 'GEMINI_LIVE' | 'LOCAL_SMART_COPILOT';
  modelUsed: string;
}

const GEMINI_KEY_STORAGE = 'ag_gemini_session_key_v1';

export function getSavedGeminiKey(): string {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || '';
  if (envKey.trim()) return envKey.trim();
  try {
    return sessionStorage.getItem(GEMINI_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function saveSessionGeminiKey(key: string): void {
  try {
    if (key.trim()) {
      sessionStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
    } else {
      sessionStorage.removeItem(GEMINI_KEY_STORAGE);
    }
  } catch {
    // ignore storage errors
  }
}

function buildLocalSmartReply(question: string, ctx: GeminiCopilotContext): string {
  const q = question.toLowerCase();

  if (q.includes('come') || q.includes('today') || q.includes('morning') || q.includes('skip') || q.includes('bunk')) {
    if (ctx.atRiskSubjects.length > 0 || ctx.overallPct < 75) {
      const list = ctx.atRiskSubjects
        .map((s) => `${s.code} (${s.percentage}, attend ${s.recoveryNeeded} straight)`)
        .join('; ');
      return `Morning Advisory for ${ctx.studentName} (${ctx.collegeName}): YES — you should definitely attend college today! ${
        list ? `At-risk subjects: ${list}.` : `Overall attendance is ${ctx.overallPct.toFixed(2)}% (< 75%).`
      } Skipping today increases detention risk under college rules.`;
    }
    return `You are currently safe at ${ctx.overallPct.toFixed(2)}% overall attendance with 0 at-risk subjects! Attending today still strengthens your streak and keeps a healthy buffer before exams.`;
  }

  if (q.includes('hack') || q.includes('team') || q.includes('idea') || q.includes('project')) {
    return `There are currently ${ctx.openHackathonsCount} open hackathon project teams in ${ctx.collegeName}. Open Hackathon Forge (/hackathons) to pitch your idea or apply with 1 click to teams matching your skills, and check Campus Hub (/campus-hub) to filter peers by Department & Year!`;
  }

  if (q.includes('teacher') || q.includes('faculty') || q.includes('prof') || q.includes('cabin') || q.includes('location')) {
    return `${ctx.collegeName} currently lists ${ctx.teachersCount} faculty members and ${ctx.collegePeersCount} students in your College Directory (/campus-hub). Opt-in live campus zones and Boys/Girls safety circles are available inside Live Campus Radar (/live-radar).`;
  }

  if (q.includes('attendance') || q.includes('75') || q.includes('recover') || q.includes('status')) {
    if (ctx.atRiskSubjects.length === 0) {
      return `Great news, ${ctx.studentName}! Your overall attendance in ${ctx.collegeName} is ${ctx.overallPct.toFixed(2)}% with all subjects above the 75% hall-ticket threshold.`;
    }
    return `Attention ${ctx.studentName}: Your overall attendance is ${ctx.overallPct.toFixed(2)}%, and ${ctx.atRiskSubjects.length} subject(s) need urgent recovery: ${ctx.atRiskSubjects
      .map((s) => `${s.code} (${s.percentage} -> attend ${s.recoveryNeeded} consecutive classes)`)
      .join(', ')}. Use Recovery Planner (/recovery) or submit valid Hackathon/Event claims in Smart OD (/od).`;
  }

  return `AttendanceGuard Copilot (${ctx.collegeName}):\n• Overall Attendance: ${ctx.overallPct.toFixed(2)}% (${
    ctx.atRiskSubjects.length === 0 ? 'Hall Ticket Eligible' : `${ctx.atRiskSubjects.length} At-Risk Subject(s)`
  })\n• Today's Morning Check-In: ${ctx.morningCheckInStatus || 'Not submitted yet'}\n• Campus Network: ${
    ctx.collegePeersCount
  } students, ${ctx.teachersCount} teachers, ${ctx.openHackathonsCount} open hackathon teams.\n\nAsk about: "Should I come to college today?", "How do I recover MA501?", or "Find hackathon teammates".`;
}

export async function askGeminiCampusCopilot(params: {
  question: string;
  context: GeminiCopilotContext;
  apiKey?: string;
}): Promise<GeminiCopilotResult> {
  const key = (params.apiKey ?? getSavedGeminiKey()).trim();
  if (!key) {
    return {
      reply: buildLocalSmartReply(params.question, params.context),
      mode: 'LOCAL_SMART_COPILOT',
      modelUsed: 'AttendanceGuard Smart Advisor',
    };
  }

  const systemInstruction = `You are the AttendanceGuard Campus Copilot powered by Gemini for ${params.context.collegeName}.
Student/User: ${params.context.studentName} (${params.context.role})
Overall Attendance: ${params.context.overallPct.toFixed(2)}%
At-risk subjects (<75%): ${
    params.context.atRiskSubjects.length > 0
      ? params.context.atRiskSubjects.map((s) => `${s.code} ${s.percentage} (need ${s.recoveryNeeded} straight)`).join(', ')
      : 'None'
  }
Morning Check-In Status: ${params.context.morningCheckInStatus || 'Not submitted'}
Campus Hub Stats: ${params.context.collegePeersCount} peers, ${params.context.teachersCount} faculty, ${params.context.openHackathonsCount} open hackathons.
Give concise, accurate, friendly, actionable guidance referencing exact attendance rules (never round 74.67% to 75%).`;

  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        model: 'gemini-4-hydrogen',
        input: params.question,
        system_instruction: systemInstruction,
        store: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 140)}`);
    }

    const data = (await res.json()) as {
      output_text?: string | null;
      steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
      outputs?: Array<{ type?: string; text?: string }>;
    };

    let extracted = data.output_text || '';
    if (!extracted && Array.isArray(data.steps)) {
      const parts: string[] = [];
      for (const step of data.steps) {
        if (step.type === 'model_output' && Array.isArray(step.content)) {
          for (const c of step.content) {
            if (c.text) parts.push(c.text);
          }
        }
      }
      extracted = parts.join('\n').trim();
    }
    if (!extracted && Array.isArray(data.outputs)) {
      extracted = data.outputs
        .map((o) => o.text || '')
        .join('\n')
        .trim();
    }

    if (!extracted) {
      throw new Error('Empty response from Gemini Interactions API.');
    }

    return {
      reply: extracted,
      mode: 'GEMINI_LIVE',
      modelUsed: 'gemini-4-hydrogen',
    };
  } catch (err) {
    const local = buildLocalSmartReply(params.question, params.context);
    const reason = err instanceof Error ? err.message : 'Network error';
    return {
      reply: `${local}\n\n[Fallback to Smart Local Copilot — Gemini API call note: ${reason}]`,
      mode: 'LOCAL_SMART_COPILOT',
      modelUsed: 'Local Fallback (Gemini Key Error)',
    };
  }
}
