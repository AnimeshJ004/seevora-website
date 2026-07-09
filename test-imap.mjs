import { readFileSync } from 'fs';
import Imap from 'imap';

const env = readFileSync('.env', 'utf8');
const get = k => env.match(new RegExp(k + '=(.+)'))?.[1]?.trim();

const user = get('IMAP_USER');
const password = get('IMAP_PASS');

process.stdout.write(`User: ${user}\nPass: ${password}\nConnecting...\n`);

const imap = new Imap({
  user, password,
  host: 'imap.hostinger.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  connTimeout: 15000,
  authTimeout: 15000,
});

imap.once('ready', () => {
  process.stdout.write('✅ IMAP CONNECTED!\n');
  imap.openBox('INBOX', true, (err, box) => {
    if (err) { process.stdout.write('Box error: ' + err.message + '\n'); }
    else { process.stdout.write('✅ INBOX: ' + box.messages.total + ' messages\n'); }
    imap.end();
  });
});

imap.once('error', err => {
  process.stdout.write('❌ Error: ' + err.message + '\n');
});

imap.connect();
