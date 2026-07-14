/**
 * dev.mjs — Starts the Express API server and Vite dev server concurrently.
 * Works on Windows (PowerShell / cmd), macOS, and Linux without extra dependencies.
 *
 * Usage: npm run dev:all
 */
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const procs = [
  {
    label: 'server',
    color: '\x1b[36m', // cyan
    cmd: 'npm run dev:server',
  },
  {
    label: 'vite  ',
    color: '\x1b[35m', // magenta
    cmd: 'npm run dev',
  },
];

const children = procs.map(({ label, color, cmd }) => {
  const reset = '\x1b[0m';
  const prefix = `${color}[${label}]${reset} `;

  // shell:true is required on Windows so that .cmd batch files are resolved.
  // We pass the full command as a single string and let the shell parse it.
  const child = spawn(cmd, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
    shell: true,
  });

  const pipeLines = (stream) => {
    createInterface({ input: stream, crlfDelay: Infinity }).on('line', (line) => {
      process.stdout.write(`${prefix}${line}\n`);
    });
  };

  pipeLines(child.stdout);
  pipeLines(child.stderr);

  child.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`${prefix}exited with code ${code}`);
    } else if (signal) {
      console.error(`${prefix}killed by signal ${signal}`);
    }
  });

  return child;
});

// Forward Ctrl+C / SIGTERM to all children
function shutdown(signal) {
  children.forEach((child) => {
    try { child.kill(signal); } catch { /* already dead */ }
  });
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

