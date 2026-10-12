#!/usr/bin/env node
// Time-box tracker for the tech test. Wired as SessionStart/Stop hooks; renders worklog.md from worklog-state.json.
//   start                      (hook) open a new row for this session, start rounded UP to the minute
//   stop                       (hook) set finish (rounded DOWN) on every hand-off; latest hand-off wins
//   describe <sessionId> <txt> set the row's description
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const statePath = join(root, '.claude', 'worklog-state.json');
const worklogPath = join(root, 'worklog.md');
const MINUTE = 60_000;

const INTRO = `# Worklog

I couldn't find an unbroken hour for this test alongside my other commitments, so I worked on it across several shorter sessions. This log records each one so you can see that Task 1 took no more than the hour allowed in total.

Times are captured automatically from the system clock: start times round up to the next minute and finish times round down. Each session runs until my last hand-off with the coding agent, so later rounds of edits in the same session are included.
`;

const loadState = () => (existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : { sessions: {}, rows: [] });
const saveState = (state) => writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');

const readStdin = () => {
  try {
    const raw = readFileSync(0, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const roundUp = (ms) => Math.ceil(ms / MINUTE) * MINUTE;
const roundDown = (ms) => Math.floor(ms / MINUTE) * MINUTE;
const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtTime = (ms) => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const durationMin = (row) => (row.finish == null ? 0 : (row.finish - row.start) / MINUTE);
const cell = (text) => (text || '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');

const render = (state) => {
  let total = 0;
  const lines = state.rows.map((row, i) => {
    const mins = durationMin(row);
    total += mins;
    const finish = row.finish == null ? 'in progress' : fmtTime(row.finish);
    return `| ${i + 1} | ${fmtDate(row.start)} | ${fmtTime(row.start)} | ${finish} | ${mins} | ${total} | ${cell(row.description) || '_TBD_'} |`;
  });
  const table = [
    '| # | Date | Start | Finish | Duration (min) | Total elapsed (min) | What we did |',
    '|---|------|-------|--------|----------------|---------------------|-------------|',
    ...lines,
  ].join('\n');
  writeFileSync(worklogPath, `${INTRO}\n## Sessions\n\n${table}\n`);
};

const describeCmd = (sessionId) => `node .claude/scripts/worklog.mjs describe ${sessionId} "<one-line summary of what we did>"`;

const [command, ...args] = process.argv.slice(2);
const state = loadState();

if (command === 'start') {
  const { session_id: sessionId, source } = readStdin();
  if (!sessionId) process.exit(0);
  // Compaction continues the same working period; startup/resume/clear begin a new one so idle gaps aren't counted.
  if (source !== 'compact' || state.sessions[sessionId] == null) {
    state.rows.push({ start: roundUp(Date.now()), finish: null, description: '' });
    state.sessions[sessionId] = state.rows.length - 1;
    saveState(state);
    render(state);
  }
  const row = state.rows[state.sessions[sessionId]];
  console.log(`Worklog: this session's start time is logged as ${fmtTime(row.start)} in worklog.md. Before your final hand-off, record what we did with: ${describeCmd(sessionId)}`);
} else if (command === 'stop') {
  const { session_id: sessionId, stop_hook_active: stopHookActive } = readStdin();
  const index = state.sessions[sessionId];
  if (index == null) process.exit(0); // session wasn't registered at start, so it isn't time-boxed
  const row = state.rows[index];
  row.finish = Math.max(row.start, roundDown(Date.now()));
  saveState(state);
  render(state);
  if (!row.description && !stopHookActive) {
    console.log(JSON.stringify({
      decision: 'block',
      reason: `worklog.md needs a short description of this session. Run: ${describeCmd(sessionId)}`,
    }));
  }
} else if (command === 'describe') {
  const [sessionId, ...words] = args;
  const index = state.sessions[sessionId];
  if (index == null || !words.length) {
    console.error('Usage: worklog.mjs describe <sessionId> <description> (sessionId must be a logged session)');
    process.exit(1);
  }
  state.rows[index].description = words.join(' ').trim();
  saveState(state);
  render(state);
  console.log(`Worklog row ${index + 1} described.`);
} else {
  console.error('Usage: worklog.mjs start|stop|describe <sessionId> <description>');
  process.exit(1);
}
