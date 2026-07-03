import http from 'node:http';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 4173);
const __dirname = dirname(fileURLToPath(import.meta.url));

const pageTemplate = readFileSync(
  join(__dirname, 'public', 'index.html'),
  'utf8'
);
const appCss = readFileSync(join(__dirname, 'public', 'app.css'), 'utf8');
const appJs = readFileSync(join(__dirname, 'public', 'app.js'), 'utf8');

/**
 * In-memory store. The demo intentionally has no database so the whole
 * stack boots in milliseconds — perfect for E2E demonstrations.
 */
const store = {
  otpCodes: new Map(), // email -> { code, expiresAt }
  sessions: new Map(), // token -> { email }
  projects: new Map(), // id -> { id, name, description, ownerEmail, tasks: [] }
  nextProjectId: 1,
  nextTaskId: 1
};

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateOtp = () =>
  Array.from(
    { length: 6 },
    () => OTP_ALPHABET[crypto.randomInt(OTP_ALPHABET.length)]
  ).join('');

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const readBody = req =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

const getSession = req => {
  const cookies = Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .map(pair => pair.trim().split('='))
      .filter(pair => pair.length === 2)
  );
  return cookies.session ? store.sessions.get(cookies.session) : undefined;
};

const handlers = {
  'POST /api/auth/request-code': async (req, res) => {
    const { email } = await readBody(req);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json(res, 400, { error: 'A valid email address is required' });
    }
    const code = generateOtp();
    store.otpCodes.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + OTP_TTL_MS
    });
    return json(res, 200, { ok: true });
  },

  'POST /api/auth/verify-code': async (req, res) => {
    const { email, code } = await readBody(req);
    const entry = store.otpCodes.get((email || '').toLowerCase());
    if (!entry || entry.expiresAt < Date.now() || entry.code !== code) {
      return json(res, 401, { error: 'Invalid or expired code' });
    }
    store.otpCodes.delete(email.toLowerCase());
    const token = crypto.randomBytes(24).toString('hex');
    store.sessions.set(token, { email: email.toLowerCase() });
    res.setHeader(
      'Set-Cookie',
      `session=${token}; Path=/; HttpOnly; SameSite=Lax`
    );
    return json(res, 200, { ok: true });
  },

  'POST /api/auth/logout': async (req, res) => {
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/session=([a-f0-9]+)/);
    if (match) store.sessions.delete(match[1]);
    res.setHeader('Set-Cookie', 'session=; Path=/; Max-Age=0');
    return json(res, 200, { ok: true });
  },

  'GET /api/me': async (req, res) => {
    const session = getSession(req);
    if (!session) return json(res, 401, { error: 'Not authenticated' });
    return json(res, 200, { email: session.email });
  },

  'GET /api/projects': async (req, res) => {
    const session = getSession(req);
    if (!session) return json(res, 401, { error: 'Not authenticated' });
    const projects = [...store.projects.values()].filter(
      project => project.ownerEmail === session.email
    );
    return json(res, 200, { projects });
  },

  'POST /api/projects': async (req, res) => {
    const session = getSession(req);
    if (!session) return json(res, 401, { error: 'Not authenticated' });
    const { name, description } = await readBody(req);
    if (!name?.trim())
      return json(res, 400, { error: 'Project name is required' });
    const project = {
      id: store.nextProjectId++,
      name: name.trim(),
      description: (description || '').trim(),
      ownerEmail: session.email,
      tasks: []
    };
    store.projects.set(project.id, project);
    return json(res, 201, { project });
  },

  'GET /api/test/otp': async (req, res, url) => {
    // Test-only endpoint mirroring "read the OTP from Redis" in real systems.
    const email = (url.searchParams.get('email') || '').toLowerCase();
    const entry = store.otpCodes.get(email);
    if (!entry)
      return json(res, 404, { error: 'No pending code for this email' });
    return json(res, 200, { code: entry.code });
  }
};

const projectRoute = /^\/api\/projects\/(\d+)$/;
const taskRoute = /^\/api\/projects\/(\d+)\/tasks$/;
const taskItemRoute = /^\/api\/projects\/(\d+)\/tasks\/(\d+)$/;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const routeKey = `${req.method} ${url.pathname}`;

  try {
    if (handlers[routeKey]) return await handlers[routeKey](req, res, url);

    const session = getSession(req);

    const projectMatch = url.pathname.match(projectRoute);
    if (projectMatch && req.method === 'GET') {
      if (!session) return json(res, 401, { error: 'Not authenticated' });
      const project = store.projects.get(Number(projectMatch[1]));
      if (!project || project.ownerEmail !== session.email) {
        return json(res, 404, { error: 'Project not found' });
      }
      return json(res, 200, { project });
    }

    const taskMatch = url.pathname.match(taskRoute);
    if (taskMatch && req.method === 'POST') {
      if (!session) return json(res, 401, { error: 'Not authenticated' });
      const project = store.projects.get(Number(taskMatch[1]));
      if (!project || project.ownerEmail !== session.email) {
        return json(res, 404, { error: 'Project not found' });
      }
      const { title } = await readBody(req);
      if (!title?.trim())
        return json(res, 400, { error: 'Task title is required' });
      const task = { id: store.nextTaskId++, title: title.trim(), done: false };
      project.tasks.push(task);
      return json(res, 201, { task });
    }

    const taskItemMatch = url.pathname.match(taskItemRoute);
    if (taskItemMatch && req.method === 'PATCH') {
      if (!session) return json(res, 401, { error: 'Not authenticated' });
      const project = store.projects.get(Number(taskItemMatch[1]));
      const task = project?.tasks.find(
        item => item.id === Number(taskItemMatch[2])
      );
      if (!project || project.ownerEmail !== session.email || !task) {
        return json(res, 404, { error: 'Task not found' });
      }
      const { done } = await readBody(req);
      task.done = Boolean(done);
      return json(res, 200, { task });
    }

    if (url.pathname === '/app.css') {
      res.writeHead(200, { 'Content-Type': 'text/css' });
      return res.end(appCss);
    }
    if (url.pathname === '/app.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      return res.end(appJs);
    }
    if (url.pathname === '/health') {
      return json(res, 200, { status: 'ok' });
    }

    // SPA-style: every other GET serves the shell and the client routes.
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(pageTemplate);
    }

    return json(res, 404, { error: 'Not found' });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`FlowBoard demo app listening on http://127.0.0.1:${PORT}`);
});
