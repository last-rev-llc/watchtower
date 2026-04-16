import { describe, expect, it } from 'vitest';

import { generateTestPage } from '../test-page';

describe('generateTestPage', () => {
  it('returns a valid HTML document', () => {
    const html = generateTestPage('/api/healthcheck');
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/i);
    expect(html).toContain('</html>');
  });

  it('interpolates the healthcheck endpoint into the script block', () => {
    const html = generateTestPage('/api/healthcheck');
    expect(html).toContain('"/api/healthcheck"');
  });

  it('includes the copy button markup', () => {
    const html = generateTestPage('/api/healthcheck');
    expect(html).toContain('class="copy-btn"');
    expect(html).toContain('onclick="copyResult()"');
  });

  it('includes the copyResult function implementation', () => {
    const html = generateTestPage('/api/healthcheck');
    expect(html).toContain('function copyResult()');
    expect(html).toContain('navigator.clipboard');
    expect(html).toContain('execCommand');
  });

  it('includes copy-btn CSS styles', () => {
    const html = generateTestPage('/api/healthcheck');
    expect(html).toContain('.copy-btn');
    expect(html).toContain('position: absolute');
  });

  it('handles endpoint paths with leading slashes correctly', () => {
    const html = generateTestPage('/api/v2/healthcheck');
    expect(html).toContain('"/api/v2/healthcheck"');
  });
});
