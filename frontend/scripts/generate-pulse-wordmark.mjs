import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const FRONTEND = path.join(ROOT, 'frontend');
const OUT_DIR = path.join(FRONTEND, 'public', 'brand');
const API = 'https://api.quiver.ai/v1/svgs/generations';
const REFERENCE = path.join(
  process.env.HOME ?? '',
  '.cursor/projects/home-sergio-Desktop-sergioFlores-hackspain-hackspain-2026/assets',
  'Gemini_Generated_Image_dilr50dilr50dilr-0b7b8fb7-d8ff-44d1-981b-8dbecbe4851f.jpg',
);

const PROMPT = [
  'Wide horizontal custom geometric wordmark spelling exactly "PULSE"',
  'in five uppercase Latin letters P U L S E.',
  'Modular ultra-bold logotype, square-cut terminals, 90-degree outer',
  'corners, straight vertical stems. Even stroke, tight tracking.',
  'Cousin of Aktiv Grotesk proportions, not a font rendering.',
  'Signature: the U is only the left stem plus a short bowl (no right stem).',
  'The U trough is moderate: long enough to read as a U, shorter than an L foot.',
  'Keep P L S E tight to that open U so no gap remains. Both vertical',
  'stems of P L E stay square-cut. It must still read as PULSE.',
  'A circular counter is allowed only inside the P. No stadiums, no pills.',
  'Single solid fill #050b2c on a fully transparent background.',
  'No icon, no tagline, no box. Draw only the word PULSE.',
].join(' ');

const INSTRUCTIONS = [
  'The reference image is construction language only: uppercase geometric',
  'PULSE, even stroke, square-cut terminals. Do not copy those letterforms.',
  'Do not spell SOLO or solo. The U has no right stem; a short trough; close the gap.',
  'Crop tightly to PULSE. No background rectangle.',
].join(' ');

/**
 * Loads KEY=value pairs into process.env without printing values.
 *
 * @param {string} file
 */
function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '').trim();
  }
}

/**
 * @param {string} model
 * @param {string} apiKey
 * @param {string} [referenceBase64]
 */
async function generate(model, apiKey, referenceBase64) {
  const body = {
    model,
    prompt: PROMPT,
    instructions: INSTRUCTIONS,
    n: 3,
    temperature: 0.25,
    reasoning_effort: 'high',
    attributes: { viewBox: { minX: 0, minY: 0, width: 640, height: 160 } },
  };
  if (referenceBase64) {
    body.references = [{ base64: referenceBase64 }];
  }
  const response = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, text };
}

/**
 * @param {unknown} payload
 * @returns {string[]}
 */
function extractSvgs(payload) {
  if (!payload || typeof payload !== 'object') return [];
  const data = /** @type {{ data?: unknown }} */ (payload).data;
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const svg = /** @type {{ svg?: unknown }} */ (item).svg;
    return typeof svg === 'string' && svg.includes('<svg') ? [svg] : [];
  });
}

loadEnv(path.join(ROOT, '.env.local'));
loadEnv(path.join(FRONTEND, '.env.local'));
const apiKey = process.env.QUIVERAI_API_KEY;
if (!apiKey) {
  console.error('QUIVERAI_API_KEY is missing');
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
const referenceBase64 = existsSync(REFERENCE)
  ? readFileSync(REFERENCE).toString('base64')
  : undefined;
if (referenceBase64) console.log('reference: attached (base64, not printed)');
else console.log('reference: missing, generating without image');

let model = 'arrow-2-telos';
let result = await generate(model, apiKey, referenceBase64);
if (result.status >= 400) {
  console.log(
    `model ${model} rejected with HTTP ${result.status}, trying arrow-2`,
  );
  model = 'arrow-2';
  result = await generate(model, apiKey, referenceBase64);
}

if (result.status >= 400) {
  console.error(`generation failed HTTP ${result.status}`);
  console.error(result.text.slice(0, 500));
  process.exit(1);
}

const payload = JSON.parse(result.text);
const svgs = extractSvgs(payload);
if (svgs.length === 0) {
  console.error('response had no svg markup');
  process.exit(1);
}

svgs.forEach((svg, index) => {
  const file = path.join(OUT_DIR, `pulse-candidate-cut-${index + 1}.svg`);
  writeFileSync(file, svg, 'utf8');
  console.log(`wrote ${path.relative(FRONTEND, file)} (${svg.length} chars)`);
});
console.log(`model=${model} candidates=${svgs.length}`);
