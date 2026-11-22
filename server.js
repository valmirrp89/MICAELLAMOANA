// Servidor Nativo Node.js - Convite Moana da Micaella (4 Anos)
// Otimizado para Deploy no GitHub e Render (Zero Dependências Externas)

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const EVENT_FILE = path.join(DATA_DIR, 'event.json');
const GUESTS_FILE = path.join(DATA_DIR, 'guests.json');

// Garantir diretórios
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// Sessões em memória para autenticação do painel
const activeSessions = new Map();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 Horas

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt < now) activeSessions.delete(token);
  }
}
setInterval(cleanExpiredSessions, 15 * 60 * 1000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.csv': 'text/csv; charset=utf-8'
};

function readJSON(file, fallback = {}) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    console.error(`Erro ao ler ${file}:`, err);
    return fallback;
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Erro ao gravar ${file}:`, err);
    return false;
  }
}

function sendJSON(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function getBearerToken(req) {
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

function verifyAuth(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return null;
  }
  return session;
}

const server = http.createServer(async (req, res) => {
  const reqHost = req.headers.host || 'localhost';
  const parsedUrl = new URL(req.url, `http://${reqHost}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const query = parsedUrl.searchParams;

  // CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // -------------------------------------------------------------
  // API: DETALHES DO EVENTO (PÚBLICO)
  // -------------------------------------------------------------
  if (pathname === '/api/event' && method === 'GET') {
    const event = readJSON(EVENT_FILE, {});
    const safeEvent = { ...event };
    delete safeEvent.adminPassword;
    return sendJSON(res, 200, safeEvent);
  }

  // -------------------------------------------------------------
  // API: AUTENTICAÇÃO DO PAINEL (LOGIN)
  // -------------------------------------------------------------
  if (pathname === '/api/auth/login' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const { password } = body;
      const event = readJSON(EVENT_FILE, {});
      const expectedPassword = event.adminPassword || 'Micaella2022';

      if (!password || password.trim() !== expectedPassword.trim()) {
        return sendJSON(res, 401, { error: 'Senha incorreta. Verifique e tente novamente.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      activeSessions.set(token, {
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_TTL_MS
      });

      return sendJSON(res, 200, {
        success: true,
        token,
        childName: event.childName,
        expiresIn: SESSION_TTL_MS
      });
    } catch (e) {
      return sendJSON(res, 500, { error: 'Erro ao processar login.' });
    }
  }

  if (pathname === '/api/auth/check' && method === 'GET') {
    const session = verifyAuth(req);
    if (!session) return sendJSON(res, 401, { authenticated: false });
    return sendJSON(res, 200, { authenticated: true });
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    const token = getBearerToken(req);
    if (token) activeSessions.delete(token);
    return sendJSON(res, 200, { success: true });
  }

  // -------------------------------------------------------------
  // API: CONFIRMAÇÃO DE PRESENÇA (RSVP)
  // -------------------------------------------------------------
  if (pathname === '/api/rsvp' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const { name, adults, children, companionNames, attending, message } = body;

      if (!name || !name.trim()) {
        return sendJSON(res, 400, { error: 'Por favor, informe seu nome completo.' });
      }

      const isAttending = attending !== false && attending !== 'false' && attending !== 0 && attending !== '0';
      const guests = readJSON(GUESTS_FILE, []);

      const newGuest = {
        id: `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: name.trim(),
        adults: isAttending ? Math.max(1, parseInt(adults, 10) || 1) : 0,
        children: isAttending ? Math.max(0, parseInt(children, 10) || 0) : 0,
        attending: isAttending,
        companionNames: (companionNames || '').trim(),
        message: (message || '').trim(),
        confirmedAt: new Date().toISOString()
      };

      guests.unshift(newGuest);
      writeJSON(GUESTS_FILE, guests);

      return sendJSON(res, 201, {
        success: true,
        message: isAttending
          ? `Presença confirmada com sucesso, ${name.trim()}! Mal podemos esperar para comemorar juntos! 🌺🌊`
          : `Sentiremos sua falta, ${name.trim()}! Agradecemos por nos avisar. ❤️`,
        guest: newGuest
      });
    } catch (e) {
      return sendJSON(res, 500, { error: 'Erro ao registrar confirmação.' });
    }
  }

  // -------------------------------------------------------------
  // API ADMIN: LISTA E ESTATÍSTICAS DE CONVIDADOS (PROTEGIDO)
  // -------------------------------------------------------------
  if (pathname === '/api/admin/guests' && method === 'GET') {
    const session = verifyAuth(req);
    if (!session) {
      return sendJSON(res, 401, { error: 'Acesso negado. Faça login no painel.' });
    }

    const guests = readJSON(GUESTS_FILE, []);
    const stats = guests.reduce(
      (acc, g) => {
        if (g.attending !== false) {
          acc.attendingCount += 1;
          acc.totalAdults += Number(g.adults) || 0;
          acc.totalChildren += Number(g.children) || 0;
          acc.totalPeople += (Number(g.adults) || 0) + (Number(g.children) || 0);
        } else {
          acc.declinedCount += 1;
        }
        acc.totalResponses += 1;
        return acc;
      },
      {
        totalResponses: 0,
        attendingCount: 0,
        declinedCount: 0,
        totalAdults: 0,
        totalChildren: 0,
        totalPeople: 0
      }
    );

    return sendJSON(res, 200, { guests, stats });
  }

  // -------------------------------------------------------------
  // API ADMIN: EXCLUIR CONVIDADO (PROTEGIDO)
  // -------------------------------------------------------------
  if (pathname.startsWith('/api/admin/guests/') && method === 'DELETE') {
    const session = verifyAuth(req);
    if (!session) return sendJSON(res, 401, { error: 'Acesso negado.' });

    const guestId = pathname.replace('/api/admin/guests/', '').trim();
    let guests = readJSON(GUESTS_FILE, []);
    const initialLen = guests.length;
    guests = guests.filter(g => g.id !== guestId);

    if (guests.length === initialLen) {
      return sendJSON(res, 404, { error: 'Convidado não encontrado.' });
    }

    writeJSON(GUESTS_FILE, guests);
    return sendJSON(res, 200, { success: true });
  }

  // -------------------------------------------------------------
  // API ADMIN: EXPORTAR CSV / EXCEL (PROTEGIDO)
  // -------------------------------------------------------------
  if (pathname === '/api/admin/export-csv' && method === 'GET') {
    const token = query.get('token') || getBearerToken(req);
    const session = token ? activeSessions.get(token) : null;
    if (!session || session.expiresAt < Date.now()) {
      res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Acesso expirado ou negado. Faça login novamente.');
    }

    const guests = readJSON(GUESTS_FILE, []);
    let csv = '\uFEFF';
    csv += 'Nome do Convidado;Status;Adultos;Crianças;Total Pessoas;Acompanhantes;Mensagem / Recado;Data da Confirmação\n';

    guests.forEach(g => {
      const isAttending = g.attending !== false;
      const status = isAttending ? 'Confirmado' : 'Não Comparecerá';
      const adults = isAttending ? (Number(g.adults) || 1) : 0;
      const children = isAttending ? (Number(g.children) || 0) : 0;
      const total = adults + children;
      const date = g.confirmedAt ? new Date(g.confirmedAt).toLocaleString('pt-BR') : '';
      const esc = (s) => `"${(s || '').toString().replace(/"/g, '""')}"`;

      csv += `${esc(g.name)};${status};${adults};${children};${total};${esc(g.companionNames)};${esc(g.message)};${esc(date)}\n`;
    });

    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="convidados_micaella.csv"',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(csv);
  }

  // -------------------------------------------------------------
  // API ADMIN: EDITAR EVENTO (PROTEGIDO)
  // -------------------------------------------------------------
  if (pathname === '/api/admin/event' && method === 'POST') {
    const session = verifyAuth(req);
    if (!session) return sendJSON(res, 401, { error: 'Acesso negado.' });

    try {
      const body = await parseBody(req);
      const existing = readJSON(EVENT_FILE, {});
      const updated = { ...existing, ...body };
      writeJSON(EVENT_FILE, updated);
      return sendJSON(res, 200, { success: true, event: updated });
    } catch (e) {
      return sendJSON(res, 400, { error: 'Erro ao salvar evento.' });
    }
  }

  // -------------------------------------------------------------
  // SERVIR ARQUIVOS ESTÁTICOS COM SUPORTE A RANGE REQUESTS (.MP3)
  // -------------------------------------------------------------
  let reqPath = pathname === '/' ? '/index.html' : pathname;
  let safePath = path.normalize(path.join(PUBLIC_DIR, reqPath));

  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Acesso Negado');
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const fallbackIndex = path.join(PUBLIC_DIR, 'index.html');
      if (fs.existsSync(fallbackIndex)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(fallbackIndex).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Arquivo não encontrado');
      }
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const totalSize = stats.size;
    const range = req.headers.range;

    // HTTP 206 Partial Content para Streaming de Áudio no Safari/iOS e Chrome
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.writeHead(416, {
          'Content-Range': `bytes */${totalSize}`,
          'Access-Control-Allow-Origin': '*'
        });
        return res.end();
      }

      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(safePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Accept-Ranges': 'bytes',
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(safePath).pipe(res);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(`🌺🌊 CONVITE ESPECIAL: 4º ANIVERSÁRIO DA MICAELLA (MOANA)`);
  console.log(`🌐 Servidor rodando na porta ${PORT}: http://localhost:${PORT}`);
  console.log(`📊 Painel Administrativo: http://localhost:${PORT}/admin.html`);
  console.log(`🔑 Senha do Painel: Micaella2022`);
  console.log(`================================================================`);
});
