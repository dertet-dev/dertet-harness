import { app } from "electron";
import * as fs from "fs/promises";
import * as path from "path";
import { randomUUID } from "crypto";
import { Settings, SessionSummary, MessageRecord, UserMemory, AgentLessons, DertetCodeStreak, SessionKind, AgentMode } from "./types";

function userDataDir(): string {
  return app.getPath("userData");
}

function sessionsDir(): string {
  return path.join(userDataDir(), "sessions");
}

async function ensureDirs(): Promise<void> {
  await fs.mkdir(sessionsDir(), { recursive: true });
}

/**
 * Every "read whole file, mutate in memory, write whole file back" function below shares this
 * per-key lock. Without it, two concurrent calls touching the same file (e.g. a turn's own
 * touchSession() in its `finally` racing a user action like adding a folder, or two sessions'
 * index updates landing at once) would both read the same starting state and the later write
 * would silently clobber the earlier one — a classic lost-update bug that looks like "my change
 * just didn't happen" rather than a crash.
 */
const fileLocks = new Map<string, Promise<unknown>>();
function withFileLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prior = fileLocks.get(key) ?? Promise.resolve();
  const run = prior.then(fn, fn);
  fileLocks.set(key, run.then(() => undefined, () => undefined));
  return run;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

const DEFAULT_SETTINGS: Settings = {
  apiKeys: [],
  activeApiKeyId: null,
  systemPrompt: "",
  personalizationEnabled: true,
  computerUseAllowed: "ask"
};

const SETTINGS_LOCK = "settings";

export async function loadSettings(): Promise<Settings> {
  return readJson(path.join(userDataDir(), "settings.json"), DEFAULT_SETTINGS);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await withFileLock(SETTINGS_LOCK, async () => {
    await writeJson(path.join(userDataDir(), "settings.json"), settings);
  });
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  return withFileLock(SETTINGS_LOCK, async () => {
    const current = await readJson(path.join(userDataDir(), "settings.json"), DEFAULT_SETTINGS);
    const next = { ...current, ...patch };
    await writeJson(path.join(userDataDir(), "settings.json"), next);
    return next;
  });
}

export async function listSessions(): Promise<SessionSummary[]> {
  await ensureDirs();
  const list = await readJson<SessionSummary[]>(path.join(sessionsDir(), "index.json"), []);
  // Migrate sessions persisted before the single folderPath -> folderPaths[] change.
  for (const s of list) {
    if (!Array.isArray((s as any).folderPaths)) {
      const legacy = (s as any).folderPath as string | null | undefined;
      s.folderPaths = legacy ? [legacy] : [];
      delete (s as any).folderPath;
    }
  }
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}

async function saveSessionIndex(list: SessionSummary[]): Promise<void> {
  await writeJson(path.join(sessionsDir(), "index.json"), list);
}

const SESSIONS_INDEX_LOCK = "sessions-index";

export async function createSession(
  kind: SessionKind,
  apiKeyId: string,
  folderPaths: string[],
  title: string
): Promise<SessionSummary> {
  await ensureDirs();
  const now = Date.now();
  const session: SessionSummary = {
    id: randomUUID(),
    kind,
    title,
    createdAt: now,
    updatedAt: now,
    apiKeyId,
    folderPaths,
    mode: "default"
  };
  await withFileLock(SESSIONS_INDEX_LOCK, async () => {
    const list = await listSessions();
    list.unshift(session);
    await saveSessionIndex(list);
  });
  await writeJson(messagesFile(session.id), []);
  return session;
}

export async function addFolderToSession(id: string, folder: string): Promise<void> {
  await withFileLock(SESSIONS_INDEX_LOCK, async () => {
    const list = await listSessions();
    const session = list.find((s) => s.id === id);
    if (!session) return;
    if (!session.folderPaths.includes(folder)) session.folderPaths.push(folder);
    await saveSessionIndex(list);
  });
}

export async function removeFolderFromSession(id: string, folder: string): Promise<void> {
  await withFileLock(SESSIONS_INDEX_LOCK, async () => {
    const list = await listSessions();
    const session = list.find((s) => s.id === id);
    if (!session) return;
    session.folderPaths = session.folderPaths.filter((f) => f !== folder);
    await saveSessionIndex(list);
  });
}

function messagesFile(sessionId: string): string {
  return path.join(sessionsDir(), `${sessionId}.json`);
}

export async function deleteSession(id: string): Promise<void> {
  await withFileLock(SESSIONS_INDEX_LOCK, async () => {
    const list = (await listSessions()).filter((s) => s.id !== id);
    await saveSessionIndex(list);
  });
  try {
    await fs.unlink(messagesFile(id));
  } catch {}
}

export async function updateSession(id: string, patch: Partial<SessionSummary>): Promise<void> {
  await withFileLock(SESSIONS_INDEX_LOCK, async () => {
    const list = await listSessions();
    const idx = list.findIndex((s) => s.id === id);
    if (idx < 0) return;
    list[idx] = { ...list[idx], ...patch, updatedAt: Date.now() };
    await saveSessionIndex(list);
  });
}

export async function touchSession(id: string): Promise<void> {
  await updateSession(id, {});
}

export async function loadMessages(sessionId: string): Promise<MessageRecord[]> {
  return readJson<MessageRecord[]>(messagesFile(sessionId), []);
}

export async function saveMessages(sessionId: string, messages: MessageRecord[]): Promise<void> {
  await writeJson(messagesFile(sessionId), messages);
}

export async function appendMessage(sessionId: string, message: MessageRecord): Promise<void> {
  await withFileLock(messagesFile(sessionId), async () => {
    const messages = await loadMessages(sessionId);
    messages.push(message);
    await saveMessages(sessionId, messages);
  });
}

export async function upsertMessage(sessionId: string, message: MessageRecord): Promise<void> {
  await withFileLock(messagesFile(sessionId), async () => {
    const messages = await loadMessages(sessionId);
    const idx = messages.findIndex((m) => m.id === message.id);
    if (idx >= 0) messages[idx] = message;
    else messages.push(message);
    await saveMessages(sessionId, messages);
  });
}

export async function deleteMessagesFrom(sessionId: string, fromMessageId: string): Promise<void> {
  await withFileLock(messagesFile(sessionId), async () => {
    const messages = await loadMessages(sessionId);
    const idx = messages.findIndex((m) => m.id === fromMessageId);
    if (idx < 0) return;
    await saveMessages(sessionId, messages.slice(0, idx));
  });
}

const DEFAULT_MEMORY: UserMemory = { enabled: true, notes: [], updatedAt: 0 };

export async function loadMemory(): Promise<UserMemory> {
  return readJson(path.join(userDataDir(), "memory.json"), DEFAULT_MEMORY);
}

export async function saveMemory(memory: UserMemory): Promise<void> {
  await writeJson(path.join(userDataDir(), "memory.json"), memory);
}

const DEFAULT_LESSONS: AgentLessons = { lessons: [], updatedAt: 0 };
const MAX_LESSONS = 60;

export async function loadLessons(): Promise<AgentLessons> {
  return readJson(path.join(userDataDir(), "lessons.json"), DEFAULT_LESSONS);
}

export async function saveLessons(lessons: AgentLessons): Promise<void> {
  if (lessons.lessons.length > MAX_LESSONS) {
    lessons.lessons = lessons.lessons.slice(lessons.lessons.length - MAX_LESSONS);
  }
  await writeJson(path.join(userDataDir(), "lessons.json"), lessons);
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function loadStreak(): Promise<DertetCodeStreak> {
  return readJson(path.join(userDataDir(), "streak.json"), { lastActiveDate: "", streakDays: 0 });
}

/** Call once per Dertet Code turn. Increments the streak on a new day, resets it if a day was skipped. */
export async function recordDertetCodeActivity(): Promise<DertetCodeStreak> {
  const streak = await loadStreak();
  const today = todayLocal();
  if (streak.lastActiveDate === today) return streak;
  if (streak.lastActiveDate) {
    const prev = new Date(streak.lastActiveDate);
    const diffDays = Math.round((new Date(today).getTime() - prev.getTime()) / 86_400_000);
    streak.streakDays = diffDays === 1 ? streak.streakDays + 1 : 1;
  } else {
    streak.streakDays = 1;
  }
  streak.lastActiveDate = today;
  await writeJson(path.join(userDataDir(), "streak.json"), streak);
  return streak;
}

export async function addSessionUsage(sessionId: string, inputTokens: number, outputTokens: number): Promise<void> {
  await withFileLock(SESSIONS_INDEX_LOCK, async () => {
    const list = await listSessions();
    const session = list.find((s) => s.id === sessionId);
    if (!session) return;
    const usage = session.usage ?? { inputTokens: 0, outputTokens: 0 };
    usage.inputTokens += inputTokens;
    usage.outputTokens += outputTokens;
    session.usage = usage;
    await saveSessionIndex(list);
  });
}
