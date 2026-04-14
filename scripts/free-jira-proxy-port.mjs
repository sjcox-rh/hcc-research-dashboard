#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function jiraProxyPortFromDotEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return null;
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = /^JIRA_PROXY_PORT\s*=\s*"?(\d+)"?\s*$/.exec(t);
    if (m) return m[1];
  }
  return null;
}

const port = String(process.env.JIRA_PROXY_PORT || jiraProxyPortFromDotEnv() || '3848').trim();

try {
  const out = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim();
  const pids = out ? out.split(/\n/).map(s => s.trim()).filter(Boolean) : [];
  if (pids.length === 0) {
    console.log(`[free-jira-proxy-port] Nothing listening on port ${port}.`);
    process.exit(0);
  }
  for (const pid of pids) {
    const n = Number(pid, 10);
    if (!Number.isFinite(n) || n <= 0) continue;
    try {
      process.kill(n, 'SIGTERM');
      console.log(`[free-jira-proxy-port] SIGTERM → PID ${n} (port ${port})`);
    } catch (err) {
      console.error(`[free-jira-proxy-port] Could not kill PID ${n}:`, err.message || err);
    }
  }
} catch (e) {
  const st = e && typeof e === 'object' && 'status' in e ? e.status : null;
  if (st === 1) {
    console.log(`[free-jira-proxy-port] Nothing listening on port ${port}.`);
    process.exit(0);
  }
  console.error('[free-jira-proxy-port] lsof failed:', e.message || e);
  process.exit(1);
}
