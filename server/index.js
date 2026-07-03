import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';
import { initDb } from './db/init.js';
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
import newsletterRoutes from './routes/newsletter.js';
import webhooksRoutes from './routes/webhooks.js';
import leadsRoutes from './routes/leads.js';
import emailBotRoutes from './routes/emailBot.js';
import employeeLeavesRoutes from './routes/employeeLeaves.js';
import productivityRoutes from './routes/productivity.js';
import businessesRoutes from './routes/businesses.js';
import usersRoutes from './routes/users.js';
import appointmentsRoutes from './routes/appointments.js';
import reviewsRoutes from './routes/reviews.js';
import systemRoutes from './routes/system.js';
import dashboardRoutes from './routes/dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required. Copy .env.example to .env and set a strong secret.');
}

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

/* Serve uploaded files */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
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
app.use('/api/employee', employeeDocumentRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/email-bot', emailBotRoutes);
app.use('/api/productivity', productivityRoutes);
app.use('/api/businesses', businessesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

await initDb();

const server = app.listen(port, () => {
  console.log(`Seevora API running on http://localhost:${port}`);
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
// Trigger restart
