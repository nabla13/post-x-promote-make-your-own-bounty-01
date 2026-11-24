// Entry program for the make.fun bounty "Promote make.fun's make-your-own-bounty
// post on X" (Node 22, standard library only, no network).
//
// The entry is the X post itself: one post of the entrant's own that quotes or
// links make.fun's make-your-own-bounty post, with a photo of its own attached.
// This program's only job is to hand the post's address to the gate: it reads
// POST.json from the repository root and writes the same JSON to
// /output/POST.json, where the gate reads it. Nothing the program writes
// about the post is scored.
//
// Run locally the way the grader does:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const sourcePath = join(BOT_DIR, 'POST.json');
const outputPath = join(OUTPUT_DIR, 'POST.json');

let raw: string;
try {
  raw = readFileSync(sourcePath, 'utf8');
} catch (err) {
  console.error(`POST.json could not be read from ${BOT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}

let post: unknown;
try {
  post = JSON.parse(raw);
} catch (err) {
  console.error(`POST.json is not valid JSON: ${(err as Error).message}`);
  process.exit(1);
}

if (typeof post !== 'object' || post === null || typeof (post as { url?: unknown }).url !== 'string') {
  console.error('POST.json must be JSON of the form {"url": "https://x.com/<handle>/status/<id>"}');
  process.exit(1);
}

const url = (post as { url: string }).url;

// The gate is the judge of the address, so a strange one is a warning, not a
// failure: the program still hands it over and exits 0. A placeholder (the
// <handle>/<id> template) or anything that is not an X status address will be
// refused by the gate as invalid, which is the correct outcome until the real
// post's address replaces it.
const STATUS_SHAPE = /^https:\/\/(x\.com|twitter\.com)\/[^\/]+\/status\/\d+$/;
if (!STATUS_SHAPE.test(url)) {
  console.error(
    `warning: "${url}" is not an X post address of the form https://x.com/<handle>/status/<id>; the gate will refuse it until POST.json names the real post`,
  );
}

mkdirSync(OUTPUT_DIR, { recursive: true });
const written = JSON.stringify(post, null, 2) + '\n';
writeFileSync(outputPath, written, 'utf8');

// Read the copy back and make sure what landed is exactly what was written.
const readBack = readFileSync(outputPath, 'utf8');
if (readBack !== written) {
  console.error(`POST.json written to ${outputPath} does not match what was read from ${sourcePath}`);
  process.exit(1);
}

console.log(`POST.json written to ${outputPath}: ${url}`);
