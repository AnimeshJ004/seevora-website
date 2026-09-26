import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';
import { initDb } from './db/init.js';
import { cleanupExpiredRateLimits, ensureRateLimitSchema } from './db/rateLimitMigration.js';
import { assertInboundEmailSecuritySchema } from './db/secureInboundEmailMigration.js';
import auditRequestRoutes from './routes/auditRequests.js';
import attendanceRoutes from './routes/attendance.js';
import authRoutes from './routes/auth.js';
import chatbotRoutes from './routes/chatbot.js';
import hrEmployeeRoutes from './routes/hrEmployees.js';
import leaveRoutes from './routes/leaveRequests.js';
import adminLeavesRoutes from './routes/adminLeaves.js';
import recruitmentRoutes from './routes/recruitment.js';
import payrollRoutes from './routes/payroll.js';
import documentRoutes from './routes/documents.js';
import employeeDocumentRoutes from './routes/employeeDocuments.js';
import emailOutreachRoutes from './routes/emailOutreach.js';
import leadsRoutes from './routes/leads.js';
import employeeLeavesRoutes from './routes/employeeLeaves.js';
import managerLeavesRoutes from './routes/managerLeaves.js';
import productivityRoutes from './routes/productivity.js';
import businessesRoutes from './routes/businesses.js';

import usersRoutes from './routes/users.js';
import appointmentsRoutes from './routes/appointments.js';
import reviewsRoutes from './routes/reviews.js';
import systemRoutes from './routes/system.js';
import dashboardRoutes from './routes/dashboard.js';
import analyticsRoutes from './routes/analytics.js';
import emailBotRoutes from './routes/emailBot.js';
import emailAgentRoutes from './routes/emailAgent.js';
import salesAgentRoutes from './routes/salesAgent.js';
import whatsappRoutes from './routes/whatsapp.js';
import { runSessionCleanup } from './utils/sessionCleanup.js';
import { startImapPoller } from './services/emailAgent/imapPoller.js';
import { startContactFormProcessor } from './services/emailAgent/contactFormProcessor.js';
import sitemapHandler from './routes/sitemap.js';
import robotsHandler from './routes/robots.js';
import {
  configuredOrigins,
  configureTrustedProxy,
  isTrustedOrigin,
  securityHeaders,
} from './middleware/security.js';
import { assertRateLimitConfiguration } from './middleware/rateLimit.js';
import { cleanupAuthSessions } from './services/auth/sessionService.js';
import { assertPrivacyConfiguration } from './utils/privacy.js';
import {
  preventApiResponseCaching,
  preventSpaHtmlCaching,
  setStaticCacheHeaders,
} from './middleware/cacheControl.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.join(__dirname, '../dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');

if (process.env.NODE_ENV === 'production') {
  const insecureOrigins = Array.from(configuredOrigins())
    .filter((origin) => !origin.startsWith('https://'));
  if (insecureOrigins.length > 0) {
    throw new Error(`CLIENT_ORIGIN must use HTTPS in production. Insecure origins: ${insecureOrigins.join(', ')}`);
  }
}

// ── API Key validation ────────────────────────────────────────────────────────
const aiProvider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
if (aiProvider === 'anthropic') {
  if (!process.env.ANTHROPIC_CHATBOT_API_KEY) {
    console.warn('[Config] ⚠️  ANTHROPIC_CHATBOT_API_KEY not set — website chatbot will return empty replies');
  }
  if (!process.env.ANTHROPIC_EMAIL_API_KEY) {
    console.warn('[Config] ⚠️  ANTHROPIC_EMAIL_API_KEY not set — email AI agent is disabled');
  }
} else {
  if (!process.env.GROQ_CHATBOT_API_KEY) {
    console.warn('[Config] ⚠️  GROQ_CHATBOT_API_KEY not set — website chatbot will return empty replies');
  }
  if (!process.env.GROQ_EMAIL_API_KEY) {
    console.warn('[Config] ⚠️  GROQ_EMAIL_API_KEY not set — email AI agent is disabled');
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
const port = Number(process.env.PORT || 4000);
const host = String(process.env.HOST || '127.0.0.1');

configureTrustedProxy(app);
app.disable('x-powered-by');
app.use(securityHeaders);

app.use(cors({
  origin(origin, callback) {
    if (!origin || isTrustedOrigin(origin)) return callback(null, true);
    return callback(new Error('Request origin could not be verified by CORS.'));
  },
  credentials: true,
}));
app.use('/api', preventApiResponseCaching);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', dependencies: { postgres: 'up' } });
  } catch {
    return res.status(503).json({ status: 'degraded', dependencies: { postgres: 'down' } });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/audit-requests', auditRequestRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/hr/attendance', attendanceRoutes);
app.use('/api/hr/employees', hrEmployeeRoutes);
app.use('/api/hr/leaves', leaveRoutes);
app.use('/api/admin/leaves', adminLeavesRoutes);
app.use('/api/hr/recruitment', recruitmentRoutes);
app.use('/api/hr/payroll', payrollRoutes);
app.use('/api/hr/documents', documentRoutes);
app.use('/api/employee/leaves', employeeLeavesRoutes);
app.use('/api/manager/leaves', managerLeavesRoutes);
app.use('/api/employee', employeeDocumentRoutes);
app.use('/api/email-outreach', emailOutreachRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/email-bot', emailBotRoutes);
app.use('/api/email-agent', emailAgentRoutes);
app.use('/api/productivity', productivityRoutes);
app.use('/api/businesses', businessesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sales-agent', salesAgentRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// SEO Routes — must be registered before static/SPA catch-all
app.get('/sitemap.xml', sitemapHandler);
app.get('/robots.txt', robotsHandler);

if (fs.existsSync(clientIndexPath)) {
  const clientIndex = fs.readFileSync(clientIndexPath, 'utf8');
  app.use(express.static(clientDistPath, { index: false, setHeaders: setStaticCacheHeaders }));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    const html = clientIndex.replaceAll('__CSP_NONCE__', res.locals.cspNonce || '');
    preventSpaHtmlCaching(res);
    res.type('html').send(html);
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

let server;
const backgroundIntervals = [];

function startBackgroundJobs() {
  const campaignInterval = setInterval(async () => {
    try {
      const now = new Date();
      const { rows } = await pool.query(
        `SELECT id FROM email_campaigns
         WHERE status = 'scheduled' AND scheduled_at <= $1`,
        [now]
      );
      if (rows.length > 0) {
        console.log(`[Scheduler] Found ${rows.length} scheduled campaigns ready to send.`);
        const { sendCampaign } = await import('./utils/campaignSender.js');
        for (const row of rows) {
          console.log(`[Scheduler] Sending campaign: ${row.id}`);
          await sendCampaign(row.id);
        }
      }
    } catch (error) {
      console.error('[Scheduler] Error running scheduled campaigns job:', error.message);
    }
  }, 30000);

  const salesCleanupInterval = setInterval(runSessionCleanup, 60 * 60 * 1000);
  const authCleanupInterval = setInterval(() => {
    cleanupAuthSessions().catch((error) => {
      console.error('[Auth] Session cleanup failed:', error.message);
    });
  }, 60 * 60 * 1000);
  const rateLimitCleanupInterval = setInterval(() => {
    cleanupExpiredRateLimits().catch((error) => {
      console.error('[RateLimit] Bucket cleanup failed:', error.message);
    });
  }, 60 * 60 * 1000);

  campaignInterval.unref?.();
  salesCleanupInterval.unref?.();
  authCleanupInterval.unref?.();
  rateLimitCleanupInterval.unref?.();
  backgroundIntervals.push(
    campaignInterval,
    salesCleanupInterval,
    authCleanupInterval,
    rateLimitCleanupInterval
  );
}

async function startServer() {
  assertRateLimitConfiguration();
  assertPrivacyConfiguration();
  await initDb();
  await ensureRateLimitSchema(pool);
  await assertInboundEmailSecuritySchema(pool);
  await cleanupAuthSessions();
  await cleanupExpiredRateLimits(pool);
  console.log('Database initialized successfully.');

  await runSessionCleanup();
  startImapPoller();
  startContactFormProcessor();
  startBackgroundJobs();

  server = app.listen(port, host, () => {
    console.log(`Seevora API running on http://${host}:${port}`);
  });
}

startServer().catch(async (error) => {
  console.error('Failed to initialize server:', error);
  await pool.end().catch(() => {});
  process.exit(1);
});

async function shutdown() {
  backgroundIntervals.forEach(clearInterval);

  if (!server) {
    await pool.end();
    process.exit(0);
  }

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
