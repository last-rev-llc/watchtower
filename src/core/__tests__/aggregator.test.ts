import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  aggregateStatus,
  createStatusNode,
  getSiteDisplayName,
  getSiteHealthcheckId,
  getSiteName,
  getStatusMessage
} from '../aggregator';

describe('aggregateStatus', () => {
  it('returns Down when any service is Down using default precedence', () => {
    const services = [
      createStatusNode('a', 'A', 'Up', 'ok'),
      createStatusNode('b', 'B', 'Down', 'fail')
    ];
    expect(aggregateStatus(services)).toBe('Down');
  });

  it('respects custom precedence order', () => {
    const services = [
      createStatusNode('a', 'A', 'Up', 'ok'),
      createStatusNode('b', 'B', 'Unknown', 'unknown'),
      createStatusNode('c', 'C', 'Partial', 'partial')
    ];
    expect(aggregateStatus(services, ['Unknown', 'Partial', 'Up', 'Down'])).toBe('Unknown');
  });

  it('returns Unknown when services list is empty', () => {
    expect(aggregateStatus([])).toBe('Unknown');
  });

  it('returns Up when all services are Up', () => {
    const services = [
      createStatusNode('a', 'A', 'Up', 'ok'),
      createStatusNode('b', 'B', 'Up', 'ok')
    ];
    expect(aggregateStatus(services)).toBe('Up');
  });
});

describe('getStatusMessage', () => {
  it('returns the correct message for each status', () => {
    expect(getStatusMessage('Up')).toBe('All systems operational');
    expect(getStatusMessage('Partial')).toBe('Some services degraded');
    expect(getStatusMessage('Down')).toBe('Critical services unavailable');
    expect(getStatusMessage('Unknown')).toBe('Unable to determine status');
  });

  it('includes prefix when provided', () => {
    expect(getStatusMessage('Up', 'API')).toBe('API: All systems operational');
  });
});

describe('site helpers', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('prefers query param for site name', () => {
    const req = { query: { site: 'Example' } };
    expect(getSiteName(req)).toBe('example');
  });

  it('falls back to header when query missing', () => {
    const req = { headers: { 'x-site-name': 'MySite' } };
    expect(getSiteName(req)).toBe('mysite');
  });

  it('uses SITE env when present', () => {
    process.env.SITE = 'ProdSite';
    expect(getSiteName()).toBe('prodsite');
  });

  it('derives name from DOMAIN env', () => {
    process.env.DOMAIN = 'https://foo.example.com';
    expect(getSiteName()).toBe('foo');
  });

  it('falls back to default "site"', () => {
    expect(getSiteName({})).toBe('site');
  });

  it('builds display name and healthcheck id', () => {
    const req = { query: { site: 'demo' } };
    expect(getSiteDisplayName(req)).toBe('Demo Site Health');
    expect(getSiteHealthcheckId(req)).toBe('demo_healthcheck');
  });
});
