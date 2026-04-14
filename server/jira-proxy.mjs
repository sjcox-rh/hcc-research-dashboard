/**
 * Local dev proxy: Jira Cloud REST API (Basic auth) → JSON for the React app.
 * - GET /api/jira/search — paginated board (POST …/search/jql, CHANGE-2046)
 * - GET /api/jira/epic-detail?key=PROJ-123 — same as search?epicKey= (detail uses /api/jira/search?epicKey= for routing)
 * Run: npm run jira-proxy
 */

import http from 'http';
import { readFileSync, existsSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

let lastJiraEnvPath = null;

function applyJiraEnvFromDotFile() {
  const candidates = [join(ROOT, '.env'), join(process.cwd(), '.env')];
  const envPath = candidates.find(p => existsSync(p));
  lastJiraEnvPath = envPath;
  if (!envPath) return;
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key.startsWith('JIRA_')) continue;
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

applyJiraEnvFromDotFile();

const PROXY_PORT = Number(process.env.JIRA_PROXY_PORT || '3848', 10);

function defaultJql() {
  return 'project = CPUX AND component = "HCC" AND issuetype in (Epic, Story) AND text ~ "research"';
}

function effectiveJql() {
  const j = process.env.JIRA_JQL;
  return (j && String(j).trim()) || defaultJql();
}

function jiraSiteBase(raw) {
  const h = String(raw || '')
    .trim()
    .replace(/\/$/, '')
    .replace(/\/rest\/api\/.*$/i, '');
  if (!h) return null;
  try {
    const withScheme = /^https?:\/\//i.test(h) ? h : `https://${h}`;
    const u = new URL(withScheme);
    const path = (u.pathname || '').replace(/\/$/, '');
    return `${u.origin}${path}`;
  } catch {
    return null;
  }
}

function jiraRestUrl(siteBase, restPath) {
  return new URL(restPath, `${siteBase}/`).toString();
}

function adfToPlainText(node) {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (typeof node !== 'object') return '';
  if (node.type === 'text' && typeof node.text === 'string') return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(adfToPlainText).join(' ').replace(/\s+/g, ' ').trim();
  }
  return '';
}

function descriptionPlain(f) {
  const desc = f.description;
  return typeof desc === 'string' ? desc : adfToPlainText(desc);
}

/** Lines like "Goal: ..." or "Research goal: ..." */
function extractGoal(plain) {
  const s = typeof plain === 'string' ? plain : '';
  const m = s.match(/^\s*(?:Research\s+)?goal\s*:\s*(.+)$/im);
  return m ? m[1].trim().split(/\n/)[0].trim() : '';
}

/** Unique http(s) URLs in description (reports, prototypes, docs). */
function extractLinks(plain) {
  const s = typeof plain === 'string' ? plain : '';
  const re = /https?:\/\/[^\s\])"'<>]+/gi;
  const seen = new Set();
  const out = [];
  let m;
  while ((m = re.exec(s)) !== null) {
    let u = m[0].replace(/[.,;:!?)]+$/, '');
    if (!seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

/** URLs from ADF link marks and plain text (e.g. Jira comments). */
function extractLinksFromAdf(node, seen, out) {
  if (node == null || typeof node !== 'object') return;
  if (Array.isArray(node.marks)) {
    for (const m of node.marks) {
      if (m && m.type === 'link' && m.attrs && typeof m.attrs.href === 'string') {
        let h = m.attrs.href.trim().replace(/[.,;:!?)]+$/, '');
        if (/^https?:\/\//i.test(h) && !seen.has(h)) {
          seen.add(h);
          out.push(h);
        }
      }
    }
  }
  if (node.type === 'text' && typeof node.text === 'string') {
    for (const u of extractLinks(node.text)) {
      if (!seen.has(u)) {
        seen.add(u);
        out.push(u);
      }
    }
  }
  if (Array.isArray(node.content)) {
    for (const c of node.content) extractLinksFromAdf(c, seen, out);
  }
}

function summaryWithoutGoal(plain, goal) {
  let s = (typeof plain === 'string' ? plain : '').replace(/\r\n/g, '\n');
  if (goal) {
    s = s.replace(/^\s*(?:Research\s+)?goal\s*:\s*.+$/im, '');
  }
  return s.replace(/\n{3,}/g, '\n\n').trim();
}

function extractIssues(data) {
  if (!data || typeof data !== 'object') return [];
  const iss = data.issues;
  if (Array.isArray(iss)) return iss;
  if (iss && typeof iss === 'object' && Array.isArray(iss.nodes)) return iss.nodes;
  if (Array.isArray(data.values)) return data.values;
  return [];
}

function issueKeysEqual(a, b) {
  return String(a || '').trim().toUpperCase() === String(b || '').trim().toUpperCase();
}

/**
 * When POST search/jql returns no row for key = "X" (seen with some Jira Cloud responses), GET issue/X still works.
 * @returns {object|null} raw issue JSON, or null on 404
 */
async function fetchJiraIssueByKey(siteBase, auth, issueKey, fields) {
  const fieldsParam = fields.join(',');
  const encKey = encodeURIComponent(String(issueKey).trim());
  const restPath = `rest/api/3/issue/${encKey}?fields=${encodeURIComponent(fieldsParam)}`;
  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: 'application/json',
  };
  const url = jiraRestUrl(siteBase, restPath);
  let jiraRes = await fetch(url, { headers, redirect: 'manual' });
  const text = await jiraRes.text();
  if (jiraRes.status === 404) return null;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const err = new Error('Invalid JSON from Jira');
    err.jiraStatus = jiraRes.status;
    throw err;
  }
  if (!jiraRes.ok) {
    const err = new Error(data.errorMessages?.join('; ') || data.message || 'Jira issue fetch failed');
    err.jiraStatus = jiraRes.status;
    err.jiraData = data;
    throw err;
  }
  return data;
}

function bodySaysRemoved(text, data) {
  const blob = `${text || ''}${data ? JSON.stringify(data) : ''}`;
  return /The requested API has been removed|migrate to.*\/search\/jql/i.test(blob);
}

function normalizeIssue(issue) {
  const f = issue.fields || issue;
  const plain = descriptionPlain(f);
  const goal = extractGoal(plain);
  const links = extractLinks(plain);
  const body = summaryWithoutGoal(plain, goal);
  const summaryText = body.length > 400 ? `${body.slice(0, 397)}…` : body;

  return {
    key: issue.key || issue.issueKey || '',
    title: f.summary || '',
    summary: summaryText || plain.slice(0, 400),
    goal: goal || null,
    status: f.status?.name || '',
    statusCategoryKey: f.status?.statusCategory?.key || '',
    issueType: f.issuetype?.name || '',
    assignee: f.assignee?.displayName || null,
    created: f.created || null,
    updated: f.updated || null,
    dueDate: f.duedate || null,
    labels: Array.isArray(f.labels) ? f.labels : [],
    links: Array.isArray(links) ? links : [],
    parentKey: f.parent?.key || null,
  };
}

function isValidJiraIssueKey(key) {
  return typeof key === 'string' && /^[A-Za-z][A-Za-z0-9_]*-\d+$/.test(key.trim());
}

function normalizeAttachments(f, siteBase) {
  const list = f.attachment;
  if (!Array.isArray(list)) return [];
  let origin = '';
  try {
    origin = new URL(siteBase).origin;
  } catch {
    /* ignore */
  }
  return list.map(a => {
    let contentUrl = typeof a.content === 'string' ? a.content : '';
    if (contentUrl.startsWith('/')) contentUrl = `${origin}${contentUrl}`;
    return {
      id: a.id,
      filename: a.filename || 'attachment',
      contentUrl,
      size: typeof a.size === 'number' ? a.size : null,
      mimeType: a.mimeType || null,
    };
  });
}

/** Full description text, attachments, and empty commentLinks (filled later). */
function normalizeResearchIssueDetail(issue, siteBase) {
  const f = issue.fields || issue;
  const plain = descriptionPlain(f);
  const goal = extractGoal(plain);
  const links = extractLinks(plain);
  const body = summaryWithoutGoal(plain, goal);
  const attachments = normalizeAttachments(f, siteBase);

  return {
    key: issue.key || issue.issueKey || '',
    title: f.summary || '',
    summary: body || plain,
    goal: goal || null,
    status: f.status?.name || '',
    statusCategoryKey: f.status?.statusCategory?.key || '',
    issueType: f.issuetype?.name || '',
    assignee: f.assignee?.displayName || null,
    created: f.created || null,
    updated: f.updated || null,
    dueDate: f.duedate || null,
    labels: Array.isArray(f.labels) ? f.labels : [],
    links: Array.isArray(links) ? links : [],
    parentKey: f.parent?.key || null,
    attachments,
    commentLinks: [],
  };
}

async function fetchIssueCommentLinks(siteBase, auth, issueKey) {
  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: 'application/json',
  };
  const seen = new Set();
  const out = [];
  let startAt = 0;
  const pageSize = 50;
  const maxTotal = 500;

  for (;;) {
    const path = `rest/api/3/issue/${encodeURIComponent(issueKey)}/comment?startAt=${startAt}&maxResults=${pageSize}`;
    const url = jiraRestUrl(siteBase, path);
    let jiraRes;
    try {
      jiraRes = await fetch(url, { headers, redirect: 'manual' });
    } catch {
      break;
    }
    if (!jiraRes.ok) break;
    let data;
    try {
      data = await jiraRes.json();
    } catch {
      break;
    }
    const comments = Array.isArray(data.comments) ? data.comments : [];
    for (const c of comments) {
      if (c.body && typeof c.body === 'object') {
        extractLinksFromAdf(c.body, seen, out);
      }
      const plain = typeof c.body === 'string' ? c.body : adfToPlainText(c.body);
      for (const u of extractLinks(plain)) {
        if (!seen.has(u)) {
          seen.add(u);
          out.push(u);
        }
      }
    }
    if (comments.length < pageSize) break;
    startAt += pageSize;
    if (startAt >= maxTotal) break;
  }
  return out;
}

function normalizedPathname(reqUrl) {
  try {
    let p = new URL(reqUrl || '/', 'http://127.0.0.1').pathname;
    p = p.replace(/\/+/g, '/');
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
  } catch {
    return '';
  }
}

/**
 * POST /search/jql (v3, fallback to latest). Returns parsed JSON or throws with { status, data } on HTTP errors.
 */
async function postJiraJqlSearch(siteBase, auth, postBody) {
  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  let postUrl = jiraRestUrl(siteBase, 'rest/api/3/search/jql');
  let jiraRes = await fetch(postUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(postBody),
    redirect: 'manual',
  });
  let text = await jiraRes.text();
  if (!jiraRes.ok && bodySaysRemoved(text, null)) {
    postUrl = jiraRestUrl(siteBase, 'rest/api/latest/search/jql');
    jiraRes = await fetch(postUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(postBody),
      redirect: 'manual',
    });
    text = await jiraRes.text();
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const err = new Error('Invalid JSON from Jira');
    err.jiraStatus = jiraRes.status;
    err.jiraRaw = text.slice(0, 500);
    throw err;
  }
  if (!jiraRes.ok) {
    const err = new Error(data.errorMessages?.join('; ') || data.message || 'Jira request failed');
    err.jiraStatus = jiraRes.status;
    err.jiraData = data;
    throw err;
  }
  return data;
}

/** Paginate JQL results until isLast / empty page / maxIssues / maxPages. */
async function collectIssuesFromJql(siteBase, auth, jql, fields, maxIssues, maxPages = 25) {
  const out = [];
  let nextPageToken;
  for (let page = 0; page < maxPages && out.length < maxIssues; page += 1) {
    const pageSize = Math.min(100, maxIssues - out.length);
    const postBody = {
      jql,
      maxResults: pageSize,
      fields,
      ...(nextPageToken ? { nextPageToken } : {}),
    };
    const data = await postJiraJqlSearch(siteBase, auth, postBody);
    const chunk = extractIssues(data);
    out.push(...chunk);
    nextPageToken = data.nextPageToken;
    if (data.isLast === true || !nextPageToken || chunk.length === 0) break;
  }
  return out;
}

function jqlErrorLikelyEpicLinkField(msg) {
  const m = String(msg || '').toLowerCase();
  return (
    /epic link/.test(m) ||
    /field.*does not exist/.test(m) ||
    /unable to find.*field/.test(m) ||
    /invalid field/.test(m)
  );
}

/** Epic/issue detail: anchor issue + children in separate searches so maxResults never drops the epic (CHANGE-2046 /search/jql). */
async function respondWithEpicDetail(res, siteBase, auth, epicKey) {
  res.setHeader('X-Hcc-Jira-Proxy', 'epic-detail');
  const fields = [
    'summary',
    'description',
    'status',
    'issuetype',
    'assignee',
    'created',
    'updated',
    'duedate',
    'labels',
    'parent',
    'components',
    'attachment',
  ];
  const browseBase = `${siteBase}/browse`;
  const jqlAnchor = `key = "${epicKey}"`;
  /** Company-managed: stories often use Epic Link; next-gen usually uses parent. */
  let jqlChildren = `parent = "${epicKey}" OR "Epic Link" = ${epicKey}`;

  try {
    let rawAnchor = [];
    try {
      rawAnchor = await collectIssuesFromJql(siteBase, auth, jqlAnchor, fields, 1, 1);
    } catch (e) {
      res.writeHead(e.jiraStatus || 502, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: e instanceof Error ? e.message : 'Jira request failed',
          details: e.jiraData?.errors || null,
        }),
      );
      return;
    }

    if (rawAnchor.length === 0) {
      try {
        const direct = await fetchJiraIssueByKey(siteBase, auth, epicKey, fields);
        if (direct) rawAnchor = [direct];
      } catch (e) {
        const debug = String(process.env.JIRA_PROXY_DEBUG || '').trim() === '1';
        if (debug) {
          console.warn('[jira-proxy] GET issue/{key} anchor fallback failed:', e instanceof Error ? e.message : e);
        }
      }
    }

    let rawChildren = [];
    try {
      rawChildren = await collectIssuesFromJql(siteBase, auth, jqlChildren, fields, 500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (jqlErrorLikelyEpicLinkField(msg)) {
        jqlChildren = `parent = "${epicKey}"`;
        rawChildren = await collectIssuesFromJql(siteBase, auth, jqlChildren, fields, 500);
      } else {
        res.writeHead(e.jiraStatus || 502, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: msg || 'Jira request failed',
            details: e.jiraData?.errors || null,
          }),
        );
        return;
      }
    }

    const byKey = new Map();
    for (const raw of rawAnchor) {
      const k = raw.key || raw.issueKey;
      if (k) byKey.set(k, raw);
    }
    for (const raw of rawChildren) {
      const k = raw.key || raw.issueKey;
      if (k && !byKey.has(k)) byKey.set(k, raw);
    }
    const rawIssues = [...byKey.values()];

    const jql = `Anchor:\n${jqlAnchor}\n\nChildren:\n${jqlChildren}`;
    const details = [];
    for (const raw of rawIssues) {
      const base = normalizeResearchIssueDetail(raw, siteBase);
      const commentLinks = await fetchIssueCommentLinks(siteBase, auth, base.key);
      base.commentLinks = commentLinks;
      details.push(base);
    }

    const isEpicType = t =>
      String(t || '')
        .trim()
        .toLowerCase() === 'epic';
    const epic =
      details.find(d => issueKeysEqual(d.key, epicKey) && isEpicType(d.issueType)) || null;
    const rootIssue = !epic ? details.find(d => issueKeysEqual(d.key, epicKey)) || null : null;

    /** Children JQL already scopes to this epic (parent or Epic Link); exclude the focal issue only. */
    const stories = details.filter(d => !issueKeysEqual(d.key, epicKey));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        epicKey,
        jql,
        jiraBrowseBase: browseBase,
        epic,
        rootIssue,
        stories,
        issues: details,
      }),
    );
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Proxy error' }));
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  applyJiraEnvFromDotFile();

  const reqPath = normalizedPathname(req.url);

  const siteBase = jiraSiteBase(process.env.JIRA_HOST);
  const email = process.env.JIRA_EMAIL || '';
  const token = process.env.JIRA_API_TOKEN || '';

  if (!siteBase || !email || !token) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Missing Jira configuration',
        hint: 'Set JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN in .env (see .env.example)',
      }),
    );
    return;
  }

  const auth = Buffer.from(`${email}:${token}`, 'utf8').toString('base64');

  if (reqPath === '/api/jira/epic-detail') {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const epicKey = (url.searchParams.get('key') || '').trim();
    if (!isValidJiraIssueKey(epicKey)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid or missing issue key', hint: 'Use ?key=PROJ-123' }));
      return;
    }
    await respondWithEpicDetail(res, siteBase, auth, epicKey);
    return;
  }

  if (reqPath !== '/api/jira/search') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1`);
  const epicKeyParam = (url.searchParams.get('epicKey') || '').trim();
  if (epicKeyParam && isValidJiraIssueKey(epicKeyParam)) {
    await respondWithEpicDetail(res, siteBase, auth, epicKeyParam);
    return;
  }

  res.setHeader('X-Hcc-Jira-Proxy', 'search-jql');

  const startAt = Math.max(0, parseInt(url.searchParams.get('startAt') || '0', 10) || 0);
  const maxResults = Math.min(100, Math.max(1, parseInt(url.searchParams.get('maxResults') || '50', 10) || 50));

  const fields = [
    'summary',
    'description',
    'status',
    'issuetype',
    'assignee',
    'created',
    'updated',
    'duedate',
    'labels',
    'parent',
    'components',
  ];

  const jql = effectiveJql();

  try {
    const searchPaths = ['rest/api/3/search/jql', 'rest/api/latest/search/jql'];
    let activePath = searchPaths[0];
    const debug = String(process.env.JIRA_PROXY_DEBUG || '').trim() === '1';

    const collected = [];
    let nextPageToken;
    let lastPayload;
    const maxPages = 25;

    function parseJiraJson(text) {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    }

    async function callJiraSearch(remaining, pageToken) {
      const pageSize = Math.min(100, Math.max(1, remaining));
      const postBody = {
        jql,
        maxResults: pageSize,
        fields,
        ...(pageToken ? { nextPageToken: pageToken } : {}),
      };
      const headers = {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      const postUrl = jiraRestUrl(siteBase, activePath);
      if (debug) console.log(`[jira-proxy] POST ${postUrl}`);

      let jiraRes = await fetch(postUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(postBody),
        redirect: 'manual',
      });
      let text = await jiraRes.text();
      let data = parseJiraJson(text);

      if (jiraRes.status >= 300 && jiraRes.status < 400) {
        const loc = jiraRes.headers.get('location');
        return {
          jiraRes,
          text: JSON.stringify({
            errorMessages: [`HTTP ${jiraRes.status} redirect${loc ? ` to ${loc}` : ''}`],
          }),
        };
      }

      if (activePath === searchPaths[0] && bodySaysRemoved(text, data)) {
        activePath = searchPaths[1];
        const fb = jiraRestUrl(siteBase, activePath);
        if (debug) console.log(`[jira-proxy] retry POST ${fb}`);
        jiraRes = await fetch(fb, {
          method: 'POST',
          headers,
          body: JSON.stringify(postBody),
          redirect: 'manual',
        });
        text = await jiraRes.text();
      }

      return { jiraRes, text };
    }

    for (let page = 0; page < maxPages && collected.length < startAt + maxResults; page += 1) {
      const remaining = startAt + maxResults - collected.length;
      const { jiraRes, text } = await callJiraSearch(remaining, nextPageToken);
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        res.writeHead(jiraRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON from Jira', raw: text.slice(0, 500) }));
        return;
      }

      if (!jiraRes.ok) {
        res.writeHead(jiraRes.status, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: data.errorMessages?.join('; ') || data.message || 'Jira request failed',
            details: data.errors || null,
          }),
        );
        return;
      }

      const msg = data.errorMessages?.join('; ') || '';
      if (msg && extractIssues(data).length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: msg, details: data.errors || null }));
        return;
      }

      lastPayload = data;
      const pageIssues = extractIssues(data);
      collected.push(...pageIssues);
      nextPageToken = data.nextPageToken;
      const done = data.isLast === true || !nextPageToken || pageIssues.length === 0;
      if (done) break;
    }

    const slice = collected.slice(startAt, startAt + maxResults);
    const issues = slice.map(normalizeIssue);
    const browseBase = `${siteBase}/browse`;

    const totalKnown =
      lastPayload?.isLast === true
        ? collected.length
        : typeof lastPayload?.total === 'number'
          ? lastPayload.total
          : collected.length;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        jql,
        total: totalKnown,
        startAt,
        maxResults,
        jiraBrowseBase: browseBase,
        jiraProjectUrl: `${siteBase}/browse/CPUX`,
        issues,
      }),
    );
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Proxy error' }));
  }
});

server.on('error', err => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(
      `[jira-proxy] Port ${PROXY_PORT} in use. Run: npm run jira-proxy:free-port (or set JIRA_PROXY_PORT in .env).`,
    );
  } else {
    console.error('[jira-proxy] Server error:', err);
  }
  process.exit(1);
});

server.listen(PROXY_PORT, '127.0.0.1', () => {
  applyJiraEnvFromDotFile();
  console.log(`Jira proxy listening on http://127.0.0.1:${PROXY_PORT}`);
  console.log(
    `[jira-proxy] JIRA_* from ${lastJiraEnvPath ? basename(lastJiraEnvPath) : '(none)'} | POST …/search/jql`,
  );
});
