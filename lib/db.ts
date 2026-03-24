import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'xiaohui.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  // Ensure data directory exists
  const dir = path.dirname(DB_PATH);
  const fs = require('fs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS med_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      period TEXT NOT NULL CHECK(period IN ('morning', 'evening')),
      taken INTEGER NOT NULL DEFAULT 0,
      taken_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(date, period)
    );

    CREATE TABLE IF NOT EXISTS symptom_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      stiffness INTEGER NOT NULL DEFAULT 0,
      pain INTEGER NOT NULL DEFAULT 0,
      fatigue INTEGER NOT NULL DEFAULT 0,
      mood INTEGER NOT NULL DEFAULT 3,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS push_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      success INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_med_logs_date ON med_logs(date);
    CREATE INDEX IF NOT EXISTS idx_symptom_logs_date ON symptom_logs(date);
  `);

  return db;
}

// ========== Medication Logs ==========

export interface MedLog {
  date: string;
  morning: { taken: boolean; time?: string };
  evening: { taken: boolean; time?: string };
}

export function getMedLog(date: string): MedLog {
  const db = getDb();
  const rows = db.prepare('SELECT period, taken, taken_at FROM med_logs WHERE date = ?').all(date) as any[];

  const log: MedLog = { date, morning: { taken: false }, evening: { taken: false } };
  for (const row of rows) {
    if (row.period === 'morning') {
      log.morning = { taken: !!row.taken, time: row.taken_at || undefined };
    } else if (row.period === 'evening') {
      log.evening = { taken: !!row.taken, time: row.taken_at || undefined };
    }
  }
  return log;
}

export function markMedTaken(date: string, period: 'morning' | 'evening', takenAt: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO med_logs (date, period, taken, taken_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(date, period) DO UPDATE SET taken = 1, taken_at = ?
  `).run(date, period, takenAt, takenAt);
}

export function undoMedTaken(date: string, period: 'morning' | 'evening'): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO med_logs (date, period, taken, taken_at)
    VALUES (?, ?, 0, NULL)
    ON CONFLICT(date, period) DO UPDATE SET taken = 0, taken_at = NULL
  `).run(date, period);
}

export function getWeekMedLogs(): { date: string; morning: boolean; evening: boolean }[] {
  const db = getDb();
  const logs = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const medLog = getMedLog(dateStr);
    logs.push({ date: dateStr, morning: medLog.morning.taken, evening: medLog.evening.taken });
  }
  return logs;
}

// ========== Symptom Logs ==========

export interface SymptomLog {
  date: string;
  stiffness: number;
  pain: number;
  fatigue: number;
  mood: number;
  notes: string;
}

export function getSymptomLog(date: string): SymptomLog | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM symptom_logs WHERE date = ?').get(date) as any;
  if (!row) return null;
  return {
    date: row.date,
    stiffness: row.stiffness,
    pain: row.pain,
    fatigue: row.fatigue,
    mood: row.mood,
    notes: row.notes || '',
  };
}

export function saveSymptomLog(log: SymptomLog): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO symptom_logs (date, stiffness, pain, fatigue, mood, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    ON CONFLICT(date) DO UPDATE SET
      stiffness = ?, pain = ?, fatigue = ?, mood = ?, notes = ?,
      updated_at = datetime('now', 'localtime')
  `).run(log.date, log.stiffness, log.pain, log.fatigue, log.mood, log.notes,
    log.stiffness, log.pain, log.fatigue, log.mood, log.notes);
}

export function getSymptomHistory(days: number = 14): SymptomLog[] {
  const db = getDb();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];

  return db.prepare(
    'SELECT date, stiffness, pain, fatigue, mood, notes FROM symptom_logs WHERE date >= ? ORDER BY date ASC'
  ).all(sinceStr) as SymptomLog[];
}

// ========== Push Logs ==========

export function logPush(type: string, message: string, success: boolean, error?: string): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO push_logs (type, message, success, error) VALUES (?, ?, ?, ?)'
  ).run(type, message, success ? 1 : 0, error || null);
}

// ========== Export (for migration) ==========

export function exportAllData(): { med_logs: any[]; symptom_logs: any[]; push_logs: any[] } {
  const db = getDb();
  return {
    med_logs: db.prepare('SELECT * FROM med_logs ORDER BY date ASC').all(),
    symptom_logs: db.prepare('SELECT * FROM symptom_logs ORDER BY date ASC').all(),
    push_logs: db.prepare('SELECT * FROM push_logs ORDER BY created_at ASC').all(),
  };
}
