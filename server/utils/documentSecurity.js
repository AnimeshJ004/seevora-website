import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const TYPE_RULES = {
  pdf: {
    extension: '.pdf',
    mimes: new Set(['application/pdf']),
  },
  jpg: {
    extension: '.jpg',
    mimes: new Set(['image/jpeg', 'image/jpg']),
  },
  png: {
    extension: '.png',
    mimes: new Set(['image/png']),
  },
  webp: {
    extension: '.webp',
    mimes: new Set(['image/webp']),
  },
  doc: {
    extension: '.doc',
    mimes: new Set(['application/msword']),
  },
  docx: {
    extension: '.docx',
    mimes: new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  },
};

const EXTENSION_TO_TYPE = new Map(
  Object.entries(TYPE_RULES).flatMap(([type, rule]) => {
    const aliases = [[rule.extension, type]];
    if (type === 'jpg') aliases.push(['.jpeg', type]);
    return aliases;
  })
);

export class DocumentSecurityError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'DocumentSecurityError';
    this.statusCode = statusCode;
  }
}

function hasPrefix(buffer, bytes) {
  if (buffer.length < bytes.length) return false;
  return bytes.every((byte, index) => buffer[index] === byte);
}

function bufferIncludesAscii(buffer, value) {
  return buffer.includes(Buffer.from(value, 'ascii'));
}

export function detectDocumentType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return '';

  if (hasPrefix(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'pdf';
  if (hasPrefix(buffer, [0xff, 0xd8, 0xff])) return 'jpg';
  if (hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (
    buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }
  if (hasPrefix(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return 'doc';
  if (
    hasPrefix(buffer, [0x50, 0x4b, 0x03, 0x04])
    && bufferIncludesAscii(buffer, '[Content_Types].xml')
    && bufferIncludesAscii(buffer, 'word/')
  ) {
    return 'docx';
  }

  return '';
}

export function sanitizeOriginalFilename(value) {
  const baseName = path.basename(String(value || 'document')).replace(/\0/g, '');
  const collapsed = baseName.replace(/[^\w .()-]/g, '_').replace(/\s+/g, ' ').trim();
  const safe = collapsed || 'document';
  return safe.length > 180 ? safe.slice(0, 180).trim() : safe;
}

export async function validateUploadedDocument(file) {
  if (!file?.path || !file?.size) {
    throw new DocumentSecurityError('Invalid or unsupported file content.');
  }

  const buffer = await fs.readFile(file.path);
  const detectedType = detectDocumentType(buffer);
  const extensionType = EXTENSION_TO_TYPE.get(path.extname(file.originalname || '').toLowerCase()) || '';
  const rule = TYPE_RULES[detectedType];

  if (!detectedType || !rule || extensionType !== detectedType || !rule.mimes.has(String(file.mimetype || '').toLowerCase())) {
    throw new DocumentSecurityError('Invalid or unsupported file content.');
  }

  return {
    detectedType,
    safeExtension: rule.extension,
    safeOriginalName: sanitizeOriginalFilename(file.originalname),
  };
}

function scanCommand(env) {
  return String(env.DOCUMENT_SCAN_COMMAND || env.CLAMAV_COMMAND || 'clamscan').trim();
}

export function scanUploadedDocument(filePath, env = process.env) {
  const mode = String(env.DOCUMENT_SCAN_MODE || 'disabled').toLowerCase();
  if (mode === 'disabled') return Promise.resolve({ clean: true, skipped: true });
  if (mode !== 'clamav') {
    return Promise.reject(new DocumentSecurityError('Document scanning is misconfigured.', 503));
  }

  return new Promise((resolve, reject) => {
    execFile(scanCommand(env), ['--no-summary', filePath], { timeout: 30_000 }, (error, stdout = '', stderr = '') => {
      const output = `${stdout}\n${stderr}`.trim();
      if (!error) return resolve({ clean: true, output });
      if (error.code === 1) {
        return reject(new DocumentSecurityError('Uploaded file failed security scanning.'));
      }
      return reject(new DocumentSecurityError('Document scanning is temporarily unavailable.', 503));
    });
  });
}

export async function removeFileQuietly(filePath) {
  if (!filePath) return;
  await fs.unlink(filePath).catch(() => {});
}

export function isPathInside(childPath, parentPath) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(childPath));
  return Boolean(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}
