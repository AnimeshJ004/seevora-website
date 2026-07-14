import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CACHE_CONTROL_VALUES,
  preventApiResponseCaching,
  preventSpaHtmlCaching,
  setStaticCacheHeaders,
} from './cacheControl.js';

function fakeResponse() {
  const headers = new Map();
  return {
    headers,
    set(name, value) { headers.set(name, value); return this; },
    setHeader(name, value) { headers.set(name, value); },
  };
}

describe('cache-control policy', () => {
  it('prevents browser and proxy storage of API responses', () => {
    const res = fakeResponse();
    let continued = false;
    preventApiResponseCaching({}, res, () => { continued = true; });
    assert.equal(res.headers.get('Cache-Control'), CACHE_CONTROL_VALUES.api);
    assert.equal(continued, true);
  });

  it('makes Vite fingerprinted assets immutable', () => {
    const res = fakeResponse();
    setStaticCacheHeaders(res, 'D:\\app\\dist\\assets\\index-abc123.js');
    assert.equal(res.headers.get('Cache-Control'), CACHE_CONTROL_VALUES.immutableAsset);
  });

  it('uses a one-day policy for unfingerprinted public files', () => {
    const res = fakeResponse();
    setStaticCacheHeaders(res, 'D:\\app\\dist\\logo.png');
    assert.equal(res.headers.get('Cache-Control'), CACHE_CONTROL_VALUES.publicFile);
  });

  it('does not store direct or fallback SPA HTML', () => {
    const direct = fakeResponse();
    const fallback = fakeResponse();
    setStaticCacheHeaders(direct, 'D:\\app\\dist\\index.html');
    preventSpaHtmlCaching(fallback);
    assert.equal(direct.headers.get('Cache-Control'), CACHE_CONTROL_VALUES.html);
    assert.equal(fallback.headers.get('Cache-Control'), CACHE_CONTROL_VALUES.html);
  });
});
