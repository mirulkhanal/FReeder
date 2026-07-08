import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(rootDir, 'dist');
const apkSourcePath = resolve(
  rootDir,
  'android/app/build/outputs/apk/release/app-release.apk',
);
const artifactPath = resolve(distDir, 'freeder-release.apk');

await mkdir(distDir, { recursive: true });
await cp(apkSourcePath, artifactPath);

console.log(`Release artifact created at ${artifactPath}`);
