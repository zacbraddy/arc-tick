#!/usr/bin/env node
// Deterministic helpers for project-context/. Zero dependencies.
// <item> = a path (project-context/ideas/foo) or a bare slug found in any stage folder.
//
//   init                                       create folder structure, tags.json, indexes
//   index [--quiet]                            regenerate index.json files from doc frontmatter
//   validate                                   check docs, tags, links, state.json, stories (exit 1 on errors)
//   status [stage]                             board: items, status, next unknown, story progress
//   move <item> <destStageDir>                 move an item folder, rewrite links, log lineage, reindex
//   merge <incoming> <target> [--nest <dir>]   fold one item into another (files, state, links); deletes incoming
//   state init <item> [--type technical|business|mixed]
//   state show <item>
//   state status <item> <active|ready-for-planning|blocked> ["note"]
//   state type <item> <technical|business|mixed>
//   state lineage <item> "<event>"
//   state remove <item> <id>                   remove an unknown/known/decision by id (u3, k2, d1)
//   unknown add <item> "<question>" ["<approach>"] [--top]
//   unknown answer <item> <uId> "<fact>" <source>
//   unknown order <item> <uId...>              listed ids first, in that order
//   known add <item> "<fact>" <source>
//   decision add <item> "<decision>" <evidence>
//   tags stats | add <tag> "<desc>" <dept,..> | merge <a> [b...] --into <c> | remove <tag>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const CTX = path.join(PROJECT, 'project-context');
const STAGES = ['ideas', 'shaping', 'planning', 'execution', 'retro', '10k'];
const FLOW = ['raw', 'ideas', 'shaping', 'planning', 'execution', 'retro'];
const DEPARTMENTS = ['technical', 'competitor-intelligence', 'marketing', 'product', 'sales', 'legal', 'financial'];
const ITEM_STATUSES = ['active', 'ready-for-planning', 'blocked'];
const EPIC_TYPES = ['technical', 'business', 'mixed'];
const STORY_STATUSES = ['draft', 'ready', 'implemented', 'done', 'blocked'];
const STORY_OWNERS = ['agent', 'zac', 'both'];
const TAGS_FILE = path.join(CTX, 'tags.json');
const TAG_LIMIT = 50;

const read = (f) => fs.readFileSync(f, 'utf8');
const posix = (p) => p.split(path.sep).join('/');
const rel = (p) => posix(path.relative(PROJECT, p));
const fail = (msg) => { console.error(`✖ ${msg}`); process.exit(1); };
const unquote = (s) => s.trim().replace(/^["']|["']$/g, '');
const today = () => new Date().toISOString().slice(0, 10);
const isUrl = (s) => /^(https?:|mailto:)/.test(s);

function walk(dir, all = false) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p, all);
    return all || e.name.endsWith('.md') ? [p] : [];
  });
}

// ---------- frontmatter ----------
const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

function parseFrontmatter(text) {
  const m = text.match(FM_RE);
  if (!m) return null;
  const fm = {};
  let listKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && listKey) { fm[listKey].push(unquote(item[1])); continue; }
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    listKey = null;
    if (value === '') { fm[key] = []; listKey = key; }
    else if (value.startsWith('[')) fm[key] = value.replace(/^\[|\]$/g, '').split(',').map(unquote).filter(Boolean);
    else fm[key] = unquote(value);
  }
  return fm;
}

function setFrontmatterTags(text, tags) {
  const m = text.match(FM_RE);
  if (!m) return text;
  const block = m[1].replace(/^tags:.*(?:\r?\n[ \t]*-[ \t]+.*)*/m, `tags: [${tags.join(', ')}]`);
  return text.replace(m[1], block);
}

// ---------- items & state ----------
function resolveItem(arg) {
  if (!arg) fail('item path or slug required');
  const direct = path.resolve(PROJECT, arg);
  if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) return direct;
  for (const s of FLOW) {
    const p = path.join(CTX, s, arg);
    if (fs.existsSync(p)) return p;
  }
  fail(`item not found: ${arg}`);
}
const stageOf = (item) => rel(item).split('/')[1];
const statePath = (item) => path.join(item, 'state.json');
const emptyState = () => ({ status: 'active', statusNote: '', unknowns: [], knowns: [], decisions: [], lineage: [] });
const hasState = (item) => fs.existsSync(statePath(item));
function loadState(item) {
  if (!hasState(item)) fail(`no state.json in ${rel(item)} — run: state init ${rel(item)}`);
  return JSON.parse(read(statePath(item)));
}
const saveState = (item, s) => fs.writeFileSync(statePath(item), JSON.stringify(s, null, 2) + '\n');
function nextId(list, prefix) {
  const n = Math.max(0, ...list.map((x) => Number(String(x.id).replace(/\D/g, '')) || 0));
  return `${prefix}${n + 1}`;
}
function logLineage(item, event) {
  if (!hasState(item)) return;
  const s = loadState(item);
  s.lineage.push({ date: today(), event });
  saveState(item, s);
}

// ---------- tags ----------
const loadTags = () => (fs.existsSync(TAGS_FILE) ? JSON.parse(read(TAGS_FILE)) : []);
const saveTags = (tags) => fs.writeFileSync(TAGS_FILE, JSON.stringify(tags.sort((a, b) => a.tag.localeCompare(b.tag)), null, 2) + '\n');
const stageDocs = () => STAGES.flatMap((s) => walk(path.join(CTX, s)));

// ---------- stories ----------
function storiesOf(item) {
  return walk(path.join(item, 'stories')).map((f) => {
    const fm = parseFrontmatter(read(f)) ?? {};
    return { file: f, num: path.basename(f).match(/^(\d+)/)?.[1] ?? '?', fm };
  }).sort((a, b) => a.num.localeCompare(b.num));
}
const dependsOn = (fm) => (Array.isArray(fm.dependsOn) ? fm.dependsOn : []).map((d) => String(d).padStart(2, '0'));

// ---------- commands ----------
function init() {
  const dirs = [...FLOW, '10k/technical/architecture', '10k/technical/adrs',
    ...DEPARTMENTS.filter((d) => d !== 'technical').map((d) => `10k/${d}`)];
  for (const d of dirs) {
    const p = path.join(CTX, d);
    fs.mkdirSync(p, { recursive: true });
    if (fs.readdirSync(p).length === 0) fs.writeFileSync(path.join(p, '.gitkeep'), '');
  }
  const wi = path.join(PROJECT, 'workflow-improvements');
  fs.mkdirSync(wi, { recursive: true });
  if (fs.readdirSync(wi).length === 0) fs.writeFileSync(path.join(wi, '.gitkeep'), '');
  if (!fs.existsSync(TAGS_FILE)) saveTags([]);
  buildIndex();
  console.log('✔ project-context initialised');
}

function buildIndex() {
  let changed = 0;
  for (const stage of STAGES) {
    const dir = path.join(CTX, stage);
    if (!fs.existsSync(dir)) continue;
    const entries = walk(dir).map((f) => {
      const fm = parseFrontmatter(read(f)) ?? {};
      return {
        title: typeof fm.title === 'string' ? fm.title : path.basename(f, '.md'),
        path: rel(f),
        shortDescription: typeof fm.shortDescription === 'string' ? fm.shortDescription : '',
        tags: Array.isArray(fm.tags) ? fm.tags : [],
      };
    }).sort((a, b) => a.path.localeCompare(b.path));
    const out = JSON.stringify(entries, null, 2) + '\n';
    const idx = path.join(dir, 'index.json');
    if (!fs.existsSync(idx) || read(idx) !== out) { fs.writeFileSync(idx, out); changed++; }
  }
  return changed;
}

function validate() {
  const errors = [];
  const warnings = [];
  const tags = loadTags();
  const known = new Set();
  for (const t of tags) {
    if (known.has(t.tag)) errors.push(`tags.json: duplicate tag "${t.tag}"`);
    known.add(t.tag);
    if (!t.shortDescription) errors.push(`tags.json: "${t.tag}" has no shortDescription`);
    if (!t.department?.length) errors.push(`tags.json: "${t.tag}" has no department`);
    const bad = (t.department ?? []).filter((d) => !DEPARTMENTS.includes(d));
    if (bad.length) errors.push(`tags.json: "${t.tag}" has unknown department(s) ${bad.join(', ')}`);
  }
  if (tags.length > TAG_LIMIT) warnings.push(`${tags.length} tags (> ${TAG_LIMIT}) — time for /curate-tags`);

  for (const f of stageDocs()) {
    const text = read(f);
    const fm = parseFrontmatter(text);
    const where = rel(f);
    if (!fm) { errors.push(`${where}: missing frontmatter`); continue; }
    if (typeof fm.title !== 'string' || !fm.title) errors.push(`${where}: missing title`);
    if (typeof fm.shortDescription !== 'string' || !fm.shortDescription) errors.push(`${where}: missing shortDescription`);
    if (!Array.isArray(fm.tags) || fm.tags.length === 0) errors.push(`${where}: needs at least one tag`);
    else for (const t of fm.tags) if (!known.has(t)) errors.push(`${where}: unregistered tag "${t}" (use: tags add)`);
    if (!/^##\s+Summary/m.test(text)) warnings.push(`${where}: no "## Summary" section`);
    if (/\/stories\/[^/]+\.md$/.test(where)) {
      if (!STORY_STATUSES.includes(fm.status)) errors.push(`${where}: status must be one of ${STORY_STATUSES.join('|')}`);
      if (!STORY_OWNERS.includes(fm.owner)) errors.push(`${where}: owner must be one of ${STORY_OWNERS.join('|')}`);
      if (fm.status === 'blocked' && !fm.blockedReason) errors.push(`${where}: blocked stories need blockedReason (and ideally revisit)`);
    }
  }

  for (const f of walk(CTX)) {
    const body = read(f).replace(/```[\s\S]*?```/g, '');
    for (const [, target] of body.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (isUrl(target) || target.startsWith('#')) continue;
      const clean = decodeURI(target.split('#')[0]);
      const abs = clean.startsWith('/') ? path.join(PROJECT, clean) : path.resolve(path.dirname(f), clean);
      if (!fs.existsSync(abs)) errors.push(`${rel(f)}: broken link → ${target}`);
    }
  }

  for (const f of walk(CTX, true).filter((f) => path.basename(f) === 'state.json')) {
    const item = path.dirname(f);
    const where = rel(f);
    let s;
    try { s = JSON.parse(read(f)); } catch { errors.push(`${where}: invalid JSON`); continue; }
    if (!ITEM_STATUSES.includes(s.status)) errors.push(`${where}: status must be one of ${ITEM_STATUSES.join('|')}`);
    if (s.type && !EPIC_TYPES.includes(s.type)) errors.push(`${where}: type must be one of ${EPIC_TYPES.join('|')}`);
    for (const key of ['unknowns', 'knowns', 'decisions', 'lineage']) if (!Array.isArray(s[key])) errors.push(`${where}: ${key} must be an array`);
    const refs = [...(s.knowns ?? []).map((k) => k.source), ...(s.decisions ?? []).map((d) => d.evidence)];
    for (const r of refs) {
      if (!r || isUrl(r)) continue;
      const abs = r.startsWith('/') ? path.join(PROJECT, r) : path.resolve(item, r);
      if (!fs.existsSync(abs)) errors.push(`${where}: missing source → ${r}`);
    }
    if (!fs.existsSync(path.join(item, 'README.md'))) errors.push(`${rel(item)}: item has state.json but no README.md hub`);
  }

  const stale = buildIndex();
  if (stale) warnings.push(`regenerated ${stale} stale index.json file(s)`);
  warnings.forEach((w) => console.log(`⚠ ${w}`));
  errors.forEach((e) => console.log(`✖ ${e}`));
  if (errors.length) process.exit(1);
  console.log('✔ project-context valid');
}

function status(only) {
  for (const stage of FLOW.slice(1)) {
    if (only && only !== stage) continue;
    const dir = path.join(CTX, stage);
    const items = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()) : [];
    console.log(`\n${stage}/ (${items.length})`);
    for (const e of items) {
      const item = path.join(dir, e.name);
      const s = hasState(item) ? loadState(item) : null;
      const hub = path.join(item, 'README.md');
      const title = fs.existsSync(hub) ? parseFrontmatter(read(hub))?.title : null;
      let line = `  ${e.name}${s?.type ? ` [${s.type}]` : ''} — ${s ? s.status + (s.statusNote ? ` (${s.statusNote})` : '') : 'no state'}`;
      if (typeof title === 'string') line += ` — ${title}`;
      console.log(line);
      if (s?.unknowns.length) console.log(`      ${s.unknowns.length} unknown(s); next: ${s.unknowns[0].id} ${s.unknowns[0].question}`);
      const stories = storiesOf(item);
      if (!stories.length) continue;
      const done = new Set(stories.filter((x) => x.fm.status === 'done').map((x) => x.num));
      const counts = {};
      for (const x of stories) counts[x.fm.status ?? '?'] = (counts[x.fm.status ?? '?'] ?? 0) + 1;
      console.log(`      stories: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}`);
      for (const x of stories) {
        const deps = dependsOn(x.fm);
        const waiting = deps.filter((d) => !done.has(d));
        let note = '';
        if (x.fm.status === 'blocked') note = ` — BLOCKED: ${x.fm.blockedReason ?? '?'}${x.fm.revisit ? ` (revisit ${x.fm.revisit})` : ''}`;
        else if (x.fm.status === 'ready' && !waiting.length) note = ' — parallel-safe';
        else if (waiting.length && x.fm.status !== 'done') note = ` — waits on ${waiting.join(', ')}`;
        console.log(`        ${x.num} ${x.fm.status ?? '?'} [${x.fm.owner ?? '?'}] ${x.fm.title ?? path.basename(x.file)}${note}`);
      }
    }
  }
}

function rewriteAbsoluteRefs(pairs) {
  pairs.sort((a, b) => b[0].length - a[0].length);
  let rewritten = 0;
  for (const f of walk(CTX)) {
    let text = read(f);
    let changed = false;
    for (const [from, to] of pairs) if (text.includes(from)) { text = text.split(from).join(to); changed = true; }
    if (changed) { fs.writeFileSync(f, text); rewritten++; }
  }
  return rewritten;
}

function move(src, destDir) {
  if (!src || !destDir) fail('usage: move <item> <destStageDir>');
  const from = resolveItem(src);
  const toDir = path.resolve(PROJECT, destDir);
  const to = path.join(toDir, path.basename(from));
  if (fs.existsSync(to)) fail(`already exists: ${rel(to)}`);
  fs.mkdirSync(toDir, { recursive: true });
  fs.renameSync(from, to);
  const rewritten = rewriteAbsoluteRefs([['/' + rel(from) + '/', '/' + rel(to) + '/']]);
  logLineage(to, `moved ${stageOf(from)} → ${stageOf(to)}`);
  buildIndex();
  console.log(`✔ moved ${rel(from)} → ${rel(to)} (rewrote links in ${rewritten} file(s))`);
}

function merge(incomingArg, targetArg, nest) {
  const inc = resolveItem(incomingArg);
  const tgt = resolveItem(targetArg);
  if (inc === tgt) fail('cannot merge an item into itself');
  const slug = path.basename(inc);
  const incState = hasState(inc) ? loadState(inc) : emptyState();
  const tgtState = hasState(tgt) ? loadState(tgt) : emptyState();

  const map = new Map();
  for (const f of walk(inc, true)) {
    const r = path.relative(inc, f);
    if (r === 'README.md' || r === 'state.json' || r === 'index.json') continue;
    let dest = nest ? path.join(tgt, nest, slug, r) : path.join(tgt, r);
    if (fs.existsSync(dest)) {
      const ext = path.extname(dest);
      dest = `${ext ? dest.slice(0, -ext.length) : dest}-${slug}${ext}`;
    }
    map.set(f, dest);
  }
  map.set(path.join(inc, 'README.md'), path.join(tgt, 'README.md'));

  for (const [from, to] of map) {
    if (!fs.existsSync(from) || from.endsWith(`${path.sep}README.md`) && path.dirname(from) === inc) continue;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.renameSync(from, to);
  }

  // relative links inside moved docs: resolve against old location, point at new location
  for (const [from, to] of map) {
    if (!to.endsWith('.md') || to === path.join(tgt, 'README.md') || !fs.existsSync(to)) continue;
    const text = read(to).replace(/\]\(([^)\s]+)\)/g, (whole, target) => {
      if (isUrl(target) || target.startsWith('#') || target.startsWith('/')) return whole;
      const [p, anchor] = target.split('#');
      const oldAbs = path.resolve(path.dirname(from), decodeURI(p));
      const newAbs = map.get(oldAbs) ?? oldAbs;
      let r = posix(path.relative(path.dirname(to), newAbs));
      if (!r.startsWith('.')) r = `./${r}`;
      return `](${r}${anchor ? `#${anchor}` : ''})`;
    });
    fs.writeFileSync(to, text);
  }

  const rewritten = rewriteAbsoluteRefs([...map].map(([o, n]) => ['/' + rel(o), '/' + rel(n)]));
  const remap = (p) => {
    if (!p || isUrl(p) || p.startsWith('/')) return p;
    const n = map.get(path.resolve(inc, p));
    return n ? posix(path.relative(tgt, n)) : p;
  };
  for (const u of incState.unknowns) tgtState.unknowns.push({ ...u, id: nextId(tgtState.unknowns, 'u'), from: slug });
  for (const k of incState.knowns) tgtState.knowns.push({ ...k, id: nextId(tgtState.knowns, 'k'), source: remap(k.source), from: slug });
  for (const d of incState.decisions) tgtState.decisions.push({ ...d, id: nextId(tgtState.decisions, 'd'), evidence: remap(d.evidence), from: slug });
  for (const l of incState.lineage) tgtState.lineage.push({ ...l, event: `[${slug}] ${l.event}` });
  tgtState.lineage.push({ date: today(), event: `merged ${slug} from ${stageOf(inc)}${nest ? ` into ${nest}/` : ''}` });
  saveState(tgt, tgtState);
  fs.rmSync(inc, { recursive: true, force: true });
  buildIndex();
  console.log(`✔ merged ${slug} → ${rel(tgt)} (${map.size - 1} file(s) moved, links rewritten in ${rewritten} file(s))`);
  console.log('  Next: dedupe/reprioritise with state commands (state show, state remove, unknown order) and rewrite the target hub.');
}

function showState(item) {
  const s = loadState(item);
  console.log(`${rel(item)} — ${s.status}${s.statusNote ? ` (${s.statusNote})` : ''}${s.type ? ` [${s.type}]` : ''}`);
  console.log('\nUnknowns (priority order):');
  s.unknowns.forEach((u) => console.log(`  ${u.id}  ${u.question}${u.approach ? `  — via: ${u.approach}` : ''}${u.from ? `  (from ${u.from})` : ''}`));
  console.log('\nKnowns:');
  s.knowns.forEach((k) => console.log(`  ${k.id}  ${k.fact}  → ${k.source}${k.from ? `  (from ${k.from})` : ''}`));
  console.log('\nDecisions:');
  s.decisions.forEach((d) => console.log(`  ${d.id}  ${d.decision}  → ${d.evidence}`));
}

function stateCmd([sub, itemArg, ...rest]) {
  const item = resolveItem(itemArg);
  if (sub === 'init') {
    if (hasState(item)) fail(`state.json already exists in ${rel(item)}`);
    const s = emptyState();
    const ti = rest.indexOf('--type');
    if (ti >= 0) { if (!EPIC_TYPES.includes(rest[ti + 1])) fail(`type: ${EPIC_TYPES.join('|')}`); s.type = rest[ti + 1]; }
    s.lineage.push({ date: today(), event: `created in ${stageOf(item)}` });
    saveState(item, s);
    return console.log(`✔ state initialised for ${rel(item)}`);
  }
  if (sub === 'show') return showState(item);
  const s = loadState(item);
  if (sub === 'status') {
    if (!ITEM_STATUSES.includes(rest[0])) fail(`status: ${ITEM_STATUSES.join('|')}`);
    s.status = rest[0];
    s.statusNote = rest[1] ?? '';
    s.lineage.push({ date: today(), event: `status → ${rest[0]}${rest[1] ? `: ${rest[1]}` : ''}` });
  } else if (sub === 'type') {
    if (!EPIC_TYPES.includes(rest[0])) fail(`type: ${EPIC_TYPES.join('|')}`);
    s.type = rest[0];
  } else if (sub === 'lineage') {
    if (!rest[0]) fail('usage: state lineage <item> "<event>"');
    s.lineage.push({ date: today(), event: rest[0] });
  } else if (sub === 'remove') {
    const id = rest[0];
    const key = { u: 'unknowns', k: 'knowns', d: 'decisions' }[id?.[0]];
    if (!key || !s[key].some((x) => x.id === id)) fail(`no entry with id ${id}`);
    s[key] = s[key].filter((x) => x.id !== id);
  } else fail('usage: state init|show|status|type|lineage|remove');
  saveState(item, s);
  console.log(`✔ ${rel(statePath(item))} updated`);
}

function unknownCmd([sub, itemArg, ...rest]) {
  const item = resolveItem(itemArg);
  const s = loadState(item);
  const args = rest.filter((a) => a !== '--top');
  if (sub === 'add') {
    if (!args[0]) fail('usage: unknown add <item> "<question>" ["<approach>"] [--top]');
    const entry = { id: nextId(s.unknowns, 'u'), question: args[0], approach: args[1] ?? '' };
    rest.includes('--top') ? s.unknowns.unshift(entry) : s.unknowns.push(entry);
    console.log(`✔ added ${entry.id}`);
  } else if (sub === 'answer') {
    const [id, fact, source] = args;
    if (!id || !fact || !source) fail('usage: unknown answer <item> <uId> "<fact>" <source>');
    const u = s.unknowns.find((x) => x.id === id);
    if (!u) fail(`no unknown ${id}`);
    s.unknowns = s.unknowns.filter((x) => x.id !== id);
    const k = { id: nextId(s.knowns, 'k'), fact, source, answers: u.question };
    s.knowns.push(k);
    console.log(`✔ ${id} answered → ${k.id}`);
  } else if (sub === 'order') {
    const first = args.map((id) => s.unknowns.find((x) => x.id === id) ?? fail(`no unknown ${id}`));
    s.unknowns = [...first, ...s.unknowns.filter((x) => !args.includes(x.id))];
    console.log(`✔ reordered: ${s.unknowns.map((x) => x.id).join(', ')}`);
  } else fail('usage: unknown add|answer|order');
  saveState(item, s);
}

function knownCmd([sub, itemArg, fact, source]) {
  if (sub !== 'add' || !fact || !source) fail('usage: known add <item> "<fact>" <source>');
  const item = resolveItem(itemArg);
  const s = loadState(item);
  const k = { id: nextId(s.knowns, 'k'), fact, source };
  s.knowns.push(k);
  saveState(item, s);
  console.log(`✔ added ${k.id}`);
}

function decisionCmd([sub, itemArg, decision, evidence]) {
  if (sub !== 'add' || !decision || !evidence) fail('usage: decision add <item> "<decision>" <evidence>');
  const item = resolveItem(itemArg);
  const s = loadState(item);
  const d = { id: nextId(s.decisions, 'd'), decision, evidence };
  s.decisions.push(d);
  s.lineage.push({ date: today(), event: `decided: ${decision}` });
  saveState(item, s);
  console.log(`✔ added ${d.id}`);
}

function tagUsage() {
  const usage = new Map();
  for (const f of stageDocs()) for (const t of parseFrontmatter(read(f))?.tags ?? []) usage.set(t, [...(usage.get(t) ?? []), rel(f)]);
  return usage;
}

function tagsCmd([sub, ...args]) {
  const tags = loadTags();
  if (sub === 'stats') {
    const usage = tagUsage();
    const known = new Set(tags.map((t) => t.tag));
    console.log(`${tags.length} tags registered (soft limit ${TAG_LIMIT})\n`);
    for (const t of [...tags].sort((a, b) => (usage.get(b.tag)?.length ?? 0) - (usage.get(a.tag)?.length ?? 0))) {
      console.log(`${String(usage.get(t.tag)?.length ?? 0).padStart(4)}  ${t.tag}  [${t.department.join(', ')}]  ${t.shortDescription}`);
    }
    const unregistered = [...usage.keys()].filter((t) => !known.has(t));
    if (unregistered.length) console.log(`\nUsed but unregistered: ${unregistered.join(', ')}`);
    return;
  }
  if (sub === 'add') {
    const [tag, desc, depts] = args;
    if (!tag || !desc || !depts) fail('usage: tags add <tag> "<description>" <dept,dept>');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tag)) fail('tags are kebab-case');
    if (tags.some((t) => t.tag === tag)) fail(`tag exists: ${tag}`);
    const department = depts.split(',').map((d) => d.trim());
    const bad = department.filter((d) => !DEPARTMENTS.includes(d));
    if (bad.length) fail(`unknown department(s): ${bad.join(', ')} — valid: ${DEPARTMENTS.join(', ')}`);
    saveTags([...tags, { tag, shortDescription: desc, department }]);
    return console.log(`✔ added tag ${tag}`);
  }
  if (sub === 'merge') {
    const i = args.indexOf('--into');
    const into = args[i + 1];
    const from = args.slice(0, i).filter((t) => t !== into);
    if (i < 1 || !into) fail('usage: tags merge <a> [b...] --into <c>');
    const target = tags.find((t) => t.tag === into);
    if (!target) fail(`target tag "${into}" not registered — add it first`);
    let touched = 0;
    for (const f of stageDocs()) {
      const text = read(f);
      const current = parseFrontmatter(text)?.tags ?? [];
      if (!current.some((t) => from.includes(t))) continue;
      fs.writeFileSync(f, setFrontmatterTags(text, [...new Set(current.map((t) => (from.includes(t) ? into : t)))]));
      touched++;
    }
    for (const t of tags.filter((t) => from.includes(t.tag))) target.department = [...new Set([...target.department, ...t.department])];
    saveTags(tags.filter((t) => !from.includes(t.tag)));
    buildIndex();
    return console.log(`✔ merged ${from.join(', ')} → ${into} (${touched} doc(s) updated)`);
  }
  if (sub === 'remove') {
    const [tag] = args;
    const used = tagUsage().get(tag);
    if (used?.length) fail(`"${tag}" is used by ${used.length} doc(s); merge it instead`);
    saveTags(tags.filter((t) => t.tag !== tag));
    return console.log(`✔ removed tag ${tag}`);
  }
  fail('usage: tags stats | add | merge | remove');
}

const [cmd, ...args] = process.argv.slice(2);
switch (cmd) {
  case 'init': init(); break;
  case 'index': {
    if (!fs.existsSync(CTX)) process.exit(0);
    const n = buildIndex();
    if (!args.includes('--quiet')) console.log(`✔ ${n} index file(s) updated`);
    break;
  }
  case 'validate': validate(); break;
  case 'status': status(args[0]); break;
  case 'move': move(args[0], args[1]); break;
  case 'merge': {
    const ni = args.indexOf('--nest');
    merge(args[0], args[1], ni >= 0 ? args[ni + 1] : undefined);
    break;
  }
  case 'state': stateCmd(args); break;
  case 'unknown': unknownCmd(args); break;
  case 'known': knownCmd(args); break;
  case 'decision': decisionCmd(args); break;
  case 'tags': tagsCmd(args); break;
  default: {
    const lines = read(fileURLToPath(import.meta.url)).split('\n');
    console.log(lines.slice(1, lines.findIndex((l) => l.startsWith('import'))).join('\n'));
  }
}
