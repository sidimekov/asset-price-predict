import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(scriptDir, '..');

function sha256(filePath) {
  const h = createHash('sha256');
  h.update(readFileSync(filePath));
  return h.digest('hex');
}

function ensureFile(relPath, expectedHash) {
  const fullPath = path.join(rootDir, relPath);
  if (!existsSync(fullPath)) {
    throw new Error(`Missing file: ${relPath}`);
  }
  const digest = sha256(fullPath);
  if (expectedHash && digest !== expectedHash) {
    throw new Error(
      `Hash mismatch for ${relPath}: expected ${expectedHash}, got ${digest}`,
    );
  }
}

function main() {
  const manifestPath = path.join(
    rootDir,
    'apps/web/src/config/ml.manifest.json',
  );
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  const modelPath = path.join(
    'apps/web/public',
    manifest.path.replace(/^\//, ''),
  );
  ensureFile(modelPath, manifest.onnxSha256);

  if (manifest.quantPath) {
    const quantPath = path.join(
      'apps/web/public',
      manifest.quantPath.replace(/^\//, ''),
    );
    ensureFile(quantPath, manifest.quantSha256);
  }

  const tvPath = 'docs/modeling/test_vectors.json';
  const tvFull = path.join(rootDir, tvPath);
  if (!existsSync(tvFull)) {
    throw new Error(`Missing test vectors: ${tvPath}`);
  }
  const tv = JSON.parse(readFileSync(tvFull, 'utf8'));
  if (!tv?.cases?.length) {
    throw new Error('test_vectors.json has no cases');
  }

  console.log(
    `Model artifacts OK (modelVer=${manifest.modelVer}, cases=${tv.cases.length})`,
  );
}

main();
