#!/usr/bin/env node
/**
 * Script to generate FIREBASE_SERVICE_ACCOUNT value for Vercel.
 * Run: node scripts/get-vercel-env.js
 * Copy the output and paste into Vercel env var FIREBASE_SERVICE_ACCOUNT
 */

const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('L serviceAccountKey.json not found');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
const minified = JSON.stringify(serviceAccount);

console.log('\n=== Copy value below for FIREBASE_SERVICE_ACCOUNT on Vercel ===\n');
console.log(minified);
console.log('\n=== End ===\n');
