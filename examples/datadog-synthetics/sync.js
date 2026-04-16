#!/usr/bin/env node
// @ts-check
/**
 * Sync Datadog synthetic test definitions from local JSON files.
 *
 * Usage:
 *   node sync.js [directory]
 *
 * Defaults to the current directory if no argument is provided.
 *
 * Behaviour:
 *   - Each *.json file in the directory is treated as a synthetic test definition.
 *   - If the JSON has a top-level `public_id`, the test is UPDATED (PUT).
 *   - If the JSON has no `public_id`, the test is CREATED (POST) and the
 *     returned `public_id` is written back to the file.
 *
 * Required env vars:
 *   DATADOG_API_KEY   — Datadog API key
 *   DATADOG_APP_KEY   — Datadog Application key
 *
 * Optional env vars:
 *   DATADOG_SITE      — Datadog site (default: datadoghq.com)
 *
 * Exits non-zero on any failure. Safe to run repeatedly (idempotent for PUTs).
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DD_API_KEY = process.env.DATADOG_API_KEY;
const DD_APP_KEY = process.env.DATADOG_APP_KEY;
const DD_SITE = process.env.DATADOG_SITE || 'datadoghq.com';
const API_BASE = `https://api.${DD_SITE}/api/v1/synthetics/tests`;

if (!DD_API_KEY || !DD_APP_KEY) {
  console.error('ERROR: DATADOG_API_KEY and DATADOG_APP_KEY must be set in the environment.');
  process.exit(1);
}

const targetDir = path.resolve(process.argv[2] || '.');

if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
  console.error(`ERROR: ${targetDir} is not a directory.`);
  process.exit(1);
}

const files = fs
  .readdirSync(targetDir)
  .filter((f) => f.endsWith('.json') && !f.startsWith('.'))
  .map((f) => path.join(targetDir, f));

if (files.length === 0) {
  console.log(`No *.json files found in ${targetDir}. Nothing to sync.`);
  process.exit(0);
}

console.log(`Syncing ${files.length} synthetic test(s) from ${targetDir}\n`);

const headers = {
  'DD-API-KEY': DD_API_KEY,
  'DD-APPLICATION-KEY': DD_APP_KEY,
  'Content-Type': 'application/json'
};

async function syncFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse JSON: ${filePath}: ${err.message}`);
  }

  const name = path.basename(filePath);
  const existingId = doc.public_id;

  // Strip Datadog-generated metadata fields from the request body. These are
  // returned by GET /tests/{id} but rejected by POST/PUT (Datadog responds with
  // "Additional properties are not allowed"). `public_id` is our own local
  // tracker for which Datadog test each JSON maps to.
  const METADATA_FIELDS = [
    'public_id',
    'monitor_id',
    'org_id',
    'created_at',
    'modified_at',
    'created_by',
    'modified_by',
    'deleted_at',
    'creator'
  ];
  const body = Object.fromEntries(
    Object.entries(doc).filter(([k]) => !METADATA_FIELDS.includes(k))
  );

  if (existingId) {
    const res = await fetch(`${API_BASE}/${existingId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PUT ${existingId} failed (${res.status}): ${text}`);
    }
    console.log(`  UPDATE  ${name}  (public_id: ${existingId})`);
    return { action: 'update', public_id: existingId };
  }

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`POST failed (${res.status}): ${body}`);
  }
  const created = await res.json();
  const newId = created.public_id;
  if (!newId) {
    throw new Error(`POST succeeded but no public_id returned for ${name}`);
  }

  doc.public_id = newId;
  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  console.log(`  CREATE  ${name}  (public_id: ${newId}) — written back to file`);
  return { action: 'create', public_id: newId };
}

(async () => {
  let created = 0;
  let updated = 0;
  const errors = [];

  for (const file of files) {
    try {
      const result = await syncFile(file);
      if (result.action === 'create') created++;
      else updated++;
    } catch (err) {
      errors.push({ file, message: err.message });
      console.error(`  ERROR   ${path.basename(file)}: ${err.message}`);
    }
  }

  console.log(`\nSummary: ${created} created, ${updated} updated, ${errors.length} failed`);
  process.exit(errors.length === 0 ? 0 : 1);
})();
