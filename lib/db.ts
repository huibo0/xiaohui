import Database from 'better-sqlite3';
import path from 'path';

/** Format a Date as YYYY-MM-DD in local timezone (avoids toISOString UTC shift) */
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
      wrist_stiffness INTEGER NOT NULL DEFAULT 0,
      left_pain INTEGER NOT NULL DEFAULT 0,
      right_pain INTEGER NOT NULL DEFAULT 0,
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

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS ios_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_token TEXT NOT NULL UNIQUE,
      device_name TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_med_logs_date ON med_logs(date);
    CREATE INDEX IF NOT EXISTS idx_symptom_logs_date ON symptom_logs(date);
  `);

  // Migration: if old schema (has 'stiffness' column), recreate table
  try {
    const cols = db.prepare("PRAGMA table_info(symptom_logs)").all() as any[];
    const hasOldCol = cols.some((c: any) => c.name === 'stiffness');
    if (hasOldCol) {
      db.exec(`
        ALTER TABLE symptom_logs RENAME TO symptom_logs_old;
        CREATE TABLE symptom_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL UNIQUE,
          wrist_stiffness INTEGER NOT NULL DEFAULT 0,
          left_pain INTEGER NOT NULL DEFAULT 0,
          right_pain INTEGER NOT NULL DEFAULT 0,
          mood INTEGER NOT NULL DEFAULT 3,
          notes TEXT DEFAULT '',
          created_at TEXT DEFAULT (datetime('now', 'localtime')),
          updated_at TEXT DEFAULT (datetime('now', 'localtime'))
        );
        INSERT INTO symptom_logs (date, wrist_stiffness, left_pain, right_pain, mood, notes, created_at, updated_at)
          SELECT date, stiffness, pain, 0, mood, notes, created_at, updated_at FROM symptom_logs_old;
        DROP TABLE symptom_logs_old;
        CREATE INDEX IF NOT EXISTS idx_symptom_logs_date ON symptom_logs(date);
      `);
    }
  } catch {}


  // Initialize default settings if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM settings').get() as any;
  if (count.c === 0) {
    const defaults: Record<string, string> = {
      morningTime: process.env.MORNING_TIME || '08:00',
      eveningTime: process.env.EVENING_TIME || '20:00',
      checkDelay: process.env.CHECK_DELAY_MINUTES || '30',
      pillNickname: '小药丸',
      pillColor: '#f472b6',
      browserNotify: 'false',
    };
    const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(defaults)) {
      stmt.run(k, v);
    }
  }

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
    const dateStr = localDateStr(d);
    const medLog = getMedLog(dateStr);
    logs.push({ date: dateStr, morning: medLog.morning.taken, evening: medLog.evening.taken });
  }
  return logs;
}

// ========== Symptom Logs ==========

export interface SymptomLog {
  date: string;
  wrist_stiffness: number; // 0-100 手腕僵直
  left_pain: number;       // 0-100 左手指节疼痛
  right_pain: number;      // 0-100 右手指节疼痛
  mood: number;
  notes: string;
}

export function getSymptomLog(date: string): SymptomLog | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM symptom_logs WHERE date = ?').get(date) as any;
  if (!row) return null;
  return {
    date: row.date,
    wrist_stiffness: row.wrist_stiffness,
    left_pain: row.left_pain,
    right_pain: row.right_pain,
    mood: row.mood,
    notes: row.notes || '',
  };
}

export function saveSymptomLog(log: SymptomLog): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO symptom_logs (date, wrist_stiffness, left_pain, right_pain, mood, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    ON CONFLICT(date) DO UPDATE SET
      wrist_stiffness = ?, left_pain = ?, right_pain = ?, mood = ?, notes = ?,
      updated_at = datetime('now', 'localtime')
  `).run(log.date, log.wrist_stiffness, log.left_pain, log.right_pain, log.mood, log.notes,
    log.wrist_stiffness, log.left_pain, log.right_pain, log.mood, log.notes);
}

export function getSymptomHistory(days: number = 30): SymptomLog[] {
  const db = getDb();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = localDateStr(since);

  return db.prepare(
    'SELECT date, wrist_stiffness, left_pain, right_pain, mood, notes FROM symptom_logs WHERE date >= ? ORDER BY date ASC'
  ).all(sinceStr) as SymptomLog[];
}

// ========== Push Logs ==========

export function logPush(type: string, message: string, success: boolean, error?: string): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO push_logs (type, message, success, error) VALUES (?, ?, ?, ?)'
  ).run(type, message, success ? 1 : 0, error || null);
}

// ========== Settings ==========

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row ? row.value : null;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now', 'localtime'))
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now', 'localtime')
  `).run(key, value, value);
}

export function getAllSettings(): Record<string, string> {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as any[];
  const result: Record<string, string> = {};
  for (const row of rows) result[row.key] = row.value;
  return result;
}

export function setMultipleSettings(settings: Record<string, string>): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now', 'localtime'))
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now', 'localtime')
  `);
  const tx = db.transaction(() => {
    for (const [k, v] of Object.entries(settings)) {
      stmt.run(k, v, v);
    }
  });
  tx();
}

// ========== iOS Devices ==========

export function registerDevice(token: string, name?: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO ios_devices (device_token, device_name)
    VALUES (?, ?)
    ON CONFLICT(device_token) DO UPDATE SET device_name = ?
  `).run(token, name || null, name || null);
}

export function unregisterDevice(token: string): void {
  const db = getDb();
  db.prepare('DELETE FROM ios_devices WHERE device_token = ?').run(token);
}

export function getAllDeviceTokens(): string[] {
  const db = getDb();
  const rows = db.prepare('SELECT device_token FROM ios_devices').all() as any[];
  return rows.map(r => r.device_token);
}

// ========== Export (for migration) ==========

export function exportAllData(): { med_logs: any[]; symptom_logs: any[]; push_logs: any[]; settings: any[] } {
  const db = getDb();
  return {
    med_logs: db.prepare('SELECT * FROM med_logs ORDER BY date ASC').all(),
    symptom_logs: db.prepare('SELECT * FROM symptom_logs ORDER BY date ASC').all(),
    push_logs: db.prepare('SELECT * FROM push_logs ORDER BY created_at ASC').all(),
    settings: db.prepare('SELECT * FROM settings').all(),
  };
}
