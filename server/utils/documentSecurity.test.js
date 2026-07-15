import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  DocumentSecurityError,
  detectDocumentType,
  isPathInside,
  sanitizeOriginalFilename,
  validateUploadedDocument,
} from './documentSecurity.js';

const tempFiles = [];

async function writeTempFile(name, buffer) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'seevora-doc-test-'));
  const filePath = path.join(dir, name);
  await fs.writeFile(filePath, buffer);
  tempFiles.push(filePath, dir);
  return filePath;
}

async function makeFile({ name, mimetype, buffer }) {
  const filePath = await writeTempFile(name, buffer);
  return {
    path: filePath,
    originalname: name,
    mimetype,
    size: buffer.length,
  };
}

afterEach(async () => {
  while (tempFiles.length) {
    const entry = tempFiles.pop();
    await fs.rm(entry, { recursive: true, force: true });
  }
});

describe('document type detection', () => {
  it('detects allowed document signatures', () => {
    assert.equal(detectDocumentType(Buffer.from('%PDF-1.7\n')), 'pdf');
    assert.equal(detectDocumentType(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'jpg');
    assert.equal(detectDocumentType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'png');
    assert.equal(detectDocumentType(Buffer.from('RIFF1234WEBPVP8 ', 'ascii')), 'webp');
    assert.equal(detectDocumentType(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])), 'doc');
    assert.equal(detectDocumentType(Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      Buffer.from('[Content_Types].xml word/document.xml', 'ascii'),
    ])), 'docx');
  });

  it('rejects unknown content', () => {
    assert.equal(detectDocumentType(Buffer.from('<script>alert(1)</script>')), '');
  });
});

describe('validateUploadedDocument', () => {
  it('accepts content only when signature, extension, and MIME agree', async () => {
    const file = await makeFile({
      name: 'aadhaar.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7\nbody'),
    });

    const result = await validateUploadedDocument(file);

    assert.equal(result.detectedType, 'pdf');
    assert.equal(result.safeExtension, '.pdf');
    assert.equal(result.safeOriginalName, 'aadhaar.pdf');
  });

  it('rejects a disguised HTML file uploaded as PDF', async () => {
    const file = await makeFile({
      name: 'aadhaar.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('<html>not a pdf</html>'),
    });

    await assert.rejects(
      () => validateUploadedDocument(file),
      DocumentSecurityError
    );
  });

  it('rejects mismatched extension and detected content', async () => {
    const file = await makeFile({
      name: 'photo.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('%PDF-1.7\nbody'),
    });

    await assert.rejects(
      () => validateUploadedDocument(file),
      DocumentSecurityError
    );
  });

  it('sanitizes dangerous display filenames', () => {
    assert.equal(sanitizeOriginalFilename('../aadhar<script>.pdf'), 'aadhar_script_.pdf');
    assert.equal(sanitizeOriginalFilename(''), 'document');
  });
});

describe('document path containment', () => {
  it('accepts only child paths inside the upload root', () => {
    assert.equal(isPathInside('/srv/uploads/private/file.pdf', '/srv/uploads'), true);
    assert.equal(isPathInside('/srv/uploads-private/file.pdf', '/srv/uploads'), false);
    assert.equal(isPathInside('/srv/uploads', '/srv/uploads'), false);
  });
});
