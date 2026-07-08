import { unzip } from 'fflate';
import JSZip from 'jszip';
import { Dirs, FileSystem } from 'react-native-file-access';

import { yieldToUi } from '../utils/yieldToUi';

import { resolveReadableBookUri } from './bookFile';

const COVER_CACHE_DIR = `${Dirs.CacheDir}/covers`;
const UNPACK_CACHE_DIR = `${Dirs.CacheDir}/epub_unpack`;
const COVER_CACHE_VERSION = 'v2';
const JSZIP_MAX_BYTES = 40 * 1024 * 1024;

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|bmp)$/i;
const HTML_EXTENSIONS = /\.(x?html?|xml)$/i;

const COVER_FILENAME_CANDIDATES = [
  'OEBPS/images/cover.jpg',
  'OEBPS/Images/cover.jpg',
  'OEBPS/image/cover.jpg',
  'images/cover.jpg',
  'Images/cover.jpg',
  'cover.jpg',
];

let extractionQueue: Promise<unknown> = Promise.resolve();
let unpackSequence = 0;

function withExtractionLock<T>(task: () => Promise<T>): Promise<T> {
  const run = extractionQueue.then(task, task);
  extractionQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export type EpubMetadata = {
  title?: string;
  author?: string;
  series?: string;
  coverUri?: string;
};

function cacheKeyForUri(sourceUri: string): string {
  let hash = 0;
  for (let i = 0; i < sourceUri.length; i += 1) {
    hash = (Math.imul(hash, 31) + sourceUri.charCodeAt(i)) % 4294967296;
  }
  return Math.abs(hash).toString(16);
}

function stripFileScheme(uri: string): string {
  return uri.replace(/^file:\/\//, '');
}

function decodeHref(href: string): string {
  try {
    return decodeURIComponent(href);
  } catch {
    return href;
  }
}

function normalizeArchivePath(path: string): string {
  return decodeHref(path).replace(/\\/g, '/').replace(/^\/+/, '');
}

function resolveArchivePath(basePath: string, relativeHref: string): string {
  const decodedHref = normalizeArchivePath(relativeHref);
  const baseDir = basePath.includes('/')
    ? basePath.slice(0, basePath.lastIndexOf('/'))
    : '';

  if (
    baseDir &&
    (decodedHref === baseDir || decodedHref.startsWith(`${baseDir}/`))
  ) {
    return decodedHref;
  }

  const parts = `${baseDir}/${decodedHref}`.split('/');
  const normalized: string[] = [];

  for (const part of parts) {
    if (!part || part === '.') {
      continue;
    }
    if (part === '..') {
      normalized.pop();
      continue;
    }
    normalized.push(part);
  }

  return normalized.join('/');
}

function pathCandidates(basePath: string, href: string): string[] {
  const normalizedHref = normalizeArchivePath(href);
  const resolved = resolveArchivePath(basePath, href);
  return [...new Set([normalizedHref, resolved])];
}

function findOpfPath(containerXml: string): string | null {
  const match = containerXml.match(/full-path=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function parseItemTags(opf: string): string[] {
  const items: string[] = [];
  const regex = /<item\b[\s\S]*?<\/item>|<item\b[^>]*\/>/gi;
  let match = regex.exec(opf);
  while (match) {
    items.push(match[0].replace(/\s+/g, ' ').trim());
    match = regex.exec(opf);
  }
  return items;
}

function readAttr(tag: string, name: string): string | null {
  const pattern = new RegExp(`\\b${name}=["']([^"']+)["']`, 'i');
  return tag.match(pattern)?.[1] ?? null;
}

function readHref(tag: string): string | null {
  return readAttr(tag, 'href');
}

function readId(tag: string): string | null {
  return readAttr(tag, 'id');
}

function readMediaType(tag: string): string | null {
  return readAttr(tag, 'media-type');
}

function hasCoverImageProperty(tag: string): boolean {
  const properties = readAttr(tag, 'properties');
  return properties ? /\bcover-image\b/i.test(properties) : false;
}

function isImagePath(path: string): boolean {
  return IMAGE_EXTENSIONS.test(path) && !/\.svg$/i.test(path);
}

function isHtmlPath(path: string): boolean {
  return HTML_EXTENSIONS.test(path);
}

function looksLikeCoverPath(value: string): boolean {
  const lower = value.toLowerCase();
  if (/cover[_-]?image/i.test(lower)) {
    return true;
  }
  if (/(?:^|[/_.-])cover\.(jpe?g|png|gif|webp)(?:$|[?#])/i.test(lower)) {
    return true;
  }
  return (
    /(?:^|[/_.-])cover(?:$|[/_.-])/i.test(lower) &&
    /\.(jpe?g|png|gif|webp)$/i.test(lower)
  );
}

function isCoverImagePath(value: string): boolean {
  return isImagePath(value) && looksLikeCoverPath(value);
}

function extractImageSrcFromHtml(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<img[^>]+src=["']([^"']+)["']/i,
    /<image[^>]+(?:xlink:)?href=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function findCoverHrefInOpf(opf: string, opfPath: string): string | null {
  const itemTags = parseItemTags(opf);

  for (const tag of itemTags) {
    if (!hasCoverImageProperty(tag)) {
      continue;
    }
    const href = readHref(tag);
    if (href) {
      return resolveArchivePath(opfPath, href);
    }
  }

  const coverImageId =
    opf.match(
      /<meta\b[^>]*\bproperty=["']cover-image["'][^>]*\bcontent=["']([^"']+)["']/i,
    )?.[1] ??
    opf.match(
      /<meta\b[^>]*\bcontent=["']([^"']+)["'][^>]*\bproperty=["']cover-image["']/i,
    )?.[1];

  if (coverImageId) {
    for (const tag of itemTags) {
      if (readId(tag) !== coverImageId) {
        continue;
      }
      const href = readHref(tag);
      if (href) {
        return resolveArchivePath(opfPath, href);
      }
    }
  }

  const coverMetaValue =
    opf.match(
      /<meta\b[^>]*\bname=["']cover["'][^>]*\bcontent=["']([^"']+)["']/i,
    )?.[1] ??
    opf.match(
      /<meta\b[^>]*\bcontent=["']([^"']+)["'][^>]*\bname=["']cover["']/i,
    )?.[1];

  if (coverMetaValue) {
    for (const tag of itemTags) {
      if (readId(tag) !== coverMetaValue) {
        continue;
      }
      const href = readHref(tag);
      if (href) {
        return resolveArchivePath(opfPath, href);
      }
    }

    if (isCoverImagePath(coverMetaValue) || coverMetaValue.includes('/')) {
      return resolveArchivePath(opfPath, coverMetaValue);
    }
  }

  for (const tag of itemTags) {
    const href = readHref(tag);
    const id = readId(tag) ?? '';
    const mediaType = readMediaType(tag) ?? '';
    if (!href || !mediaType.startsWith('image/')) {
      continue;
    }
    if (
      /cover[_-]?image/i.test(id) ||
      /(?:^|\/)cover\.(jpe?g|png|gif|webp)$/i.test(href)
    ) {
      return resolveArchivePath(opfPath, href);
    }
  }

  for (const tag of itemTags) {
    const href = readHref(tag);
    const id = readId(tag) ?? '';
    const mediaType = readMediaType(tag) ?? '';
    if (!href || !mediaType.startsWith('image/')) {
      continue;
    }
    if (looksLikeCoverPath(`${id} ${href}`)) {
      return resolveArchivePath(opfPath, href);
    }
  }

  const linkHref =
    opf.match(
      /<link\b[^>]*\brel=["']cover["'][^>]*\bhref=["']([^"']+)["']/i,
    )?.[1] ??
    opf.match(
      /<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']cover["']/i,
    )?.[1];

  if (linkHref) {
    return resolveArchivePath(opfPath, linkHref);
  }

  const guideHref =
    opf.match(
      /<reference\b[^>]*\btype=["']cover["'][^>]*\bhref=["']([^"']+)["']/i,
    )?.[1] ??
    opf.match(
      /<reference\b[^>]*\bhref=["']([^"']+)["'][^>]*\btype=["']cover["']/i,
    )?.[1];

  if (guideHref) {
    return resolveArchivePath(opfPath, guideHref);
  }

  for (const tag of itemTags) {
    const href = readHref(tag);
    const id = readId(tag) ?? '';
    const mediaType = readMediaType(tag) ?? '';
    if (!href || !looksLikeCoverPath(`${id} ${href}`)) {
      continue;
    }
    if (!mediaType.startsWith('image/')) {
      return resolveArchivePath(opfPath, href);
    }
  }

  for (const tag of itemTags) {
    const href = readHref(tag);
    if (href && /(^|\/)cover\.(jpe?g|png|gif|webp)$/i.test(href)) {
      return resolveArchivePath(opfPath, href);
    }
  }

  return null;
}

function findFirstSpineHref(
  opf: string,
  opfPath: string,
  itemTags: string[],
): string | null {
  const itemsById = new Map<string, string>();
  for (const tag of itemTags) {
    const id = readId(tag);
    const href = readHref(tag);
    if (id && href) {
      itemsById.set(id, href);
    }
  }

  const spineBody = opf.match(/<spine\b[^>]*>([\s\S]*?)<\/spine>/i)?.[1];
  if (!spineBody) {
    return null;
  }

  const firstRef = spineBody.match(
    /<itemref\b[^>]*\bidref=["']([^"']+)["']/i,
  )?.[1];
  if (!firstRef) {
    return null;
  }

  const href = itemsById.get(firstRef);
  return href ? resolveArchivePath(opfPath, href) : null;
}

async function persistCoverFromReader(
  reader: ZipReader,
  coverPath: string,
  cacheKey: string,
  metadata: EpubMetadata,
): Promise<EpubMetadata> {
  const coverBytes = await reader.readBytes(coverPath);
  if (coverBytes) {
    try {
      const coverUri = await writeCoverBytes(coverBytes, cacheKey, coverPath);
      return { ...metadata, coverUri };
    } catch {
      // Fall back to base64 write path.
    }
  }

  const coverBase64 = await reader.readBase64(coverPath);
  if (!coverBase64) {
    return metadata;
  }

  try {
    const coverUri = await writeCoverBase64(coverBase64, cacheKey, coverPath);
    return { ...metadata, coverUri };
  } catch {
    return metadata;
  }
}

function parseOpfMetadata(
  opf: string,
): Pick<EpubMetadata, 'title' | 'author' | 'series'> {
  const title =
    opf.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i)?.[1]?.trim() ??
    opf.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
  const author =
    opf.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i)?.[1]?.trim() ??
    opf.match(/<creator[^>]*>([^<]+)<\/creator>/i)?.[1]?.trim();
  const series =
    opf
      .match(
        /<meta[^>]+name=["']calibre:series["'][^>]+content=["']([^"']+)["']/i,
      )?.[1]
      ?.trim() ??
    opf
      .match(
        /<meta[^>]+property=["']belongs-to-collection["'][^>]*>([^<]+)</i,
      )?.[1]
      ?.trim();
  return { title, author, series };
}

function extensionForPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  if (
    ext === 'png' ||
    ext === 'gif' ||
    ext === 'webp' ||
    ext === 'jpeg' ||
    ext === 'jpg'
  ) {
    return ext === 'jpeg' ? 'jpg' : ext;
  }
  return 'jpg';
}

function getZipEntry(zip: JSZip, path: string): JSZip.JSZipObject | null {
  for (const candidate of pathCandidates('', path)) {
    const direct = zip.file(candidate);
    if (direct) {
      return direct;
    }
  }

  const lower = normalizeArchivePath(path).toLowerCase();
  const match = Object.keys(zip.files).find(
    key => normalizeArchivePath(key).toLowerCase() === lower,
  );

  if (match) {
    return zip.file(match) ?? null;
  }

  const suffix = `/${lower}`;
  const suffixMatch = Object.keys(zip.files).find(key => {
    const normalized = normalizeArchivePath(key).toLowerCase();
    return normalized === lower || normalized.endsWith(suffix);
  });

  return suffixMatch ? zip.file(suffixMatch) ?? null : null;
}

function findCoverPathInZip(zip: JSZip): string | null {
  for (const candidate of COVER_FILENAME_CANDIDATES) {
    if (getZipEntry(zip, candidate)) {
      return candidate;
    }
  }

  const coverFile = Object.keys(zip.files).find(
    key =>
      !zip.files[key].dir && /(?:^|\/)cover\.(jpe?g|png|gif|webp)$/i.test(key),
  );

  return coverFile ?? null;
}

type ZipReader = {
  readText: (path: string) => Promise<string | null>;
  readBase64: (path: string) => Promise<string | null>;
  readBytes: (path: string) => Promise<Uint8Array | null>;
  findCoverByFilename: () => Promise<string | null>;
};

function createZipReader(zip: JSZip): ZipReader {
  return {
    readText: async (path: string) => {
      try {
        const entry = getZipEntry(zip, path);
        return entry ? entry.async('string') : null;
      } catch {
        return null;
      }
    },
    readBase64: async (path: string) => {
      try {
        const entry = getZipEntry(zip, path);
        return entry ? entry.async('base64') : null;
      } catch {
        return null;
      }
    },
    readBytes: async (path: string) => {
      try {
        const entry = getZipEntry(zip, path);
        return entry ? entry.async('uint8array') : null;
      } catch {
        return null;
      }
    },
    findCoverByFilename: async () => findCoverPathInZip(zip),
  };
}

async function resolveCoverFromReader(
  reader: ZipReader,
  href: string,
  basePath: string,
  depth = 0,
): Promise<string | null> {
  if (depth > 3) {
    return null;
  }

  for (const candidate of pathCandidates(basePath, href)) {
    if (isImagePath(candidate)) {
      const bytes = await reader.readBytes(candidate);
      const base64 = bytes ? null : await reader.readBase64(candidate);
      if (bytes || base64) {
        return candidate;
      }
    }

    if (isHtmlPath(candidate)) {
      const html = await reader.readText(candidate);
      if (!html) {
        continue;
      }
      const imageHref = extractImageSrcFromHtml(html);
      if (!imageHref) {
        continue;
      }
      const resolved = await resolveCoverFromReader(
        reader,
        imageHref,
        candidate,
        depth + 1,
      );
      if (resolved) {
        return resolved;
      }
    }
  }

  return null;
}

async function extractMetadataFromReader(
  reader: ZipReader,
  cacheKey: string,
): Promise<EpubMetadata> {
  const containerXml = await reader.readText('META-INF/container.xml');
  if (!containerXml) {
    return {};
  }

  const opfPath = findOpfPath(containerXml);
  if (!opfPath) {
    return {};
  }

  const opf = await reader.readText(opfPath);
  if (!opf) {
    return {};
  }

  const metadata = parseOpfMetadata(opf);
  const itemTags = parseItemTags(opf);

  let coverPath = findCoverHrefInOpf(opf, opfPath);
  if (coverPath) {
    if (isImagePath(coverPath)) {
      const bytes = await reader.readBytes(coverPath);
      if (!bytes && !(await reader.readBase64(coverPath))) {
        coverPath = null;
      }
    } else {
      coverPath = await resolveCoverFromReader(reader, coverPath, opfPath);
    }
  }

  if (!coverPath) {
    const spineHref = findFirstSpineHref(opf, opfPath, itemTags);
    if (spineHref) {
      coverPath = await resolveCoverFromReader(reader, spineHref, opfPath);
    }
  }

  if (!coverPath) {
    coverPath = await reader.findCoverByFilename();
  }

  if (!coverPath) {
    return metadata;
  }

  return persistCoverFromReader(reader, coverPath, cacheKey, metadata);
}

async function ensureCoverCacheDir(): Promise<void> {
  try {
    await FileSystem.mkdir(COVER_CACHE_DIR);
  } catch {
    // Directory already exists.
  }
}

async function isValidCoverFile(path: string): Promise<boolean> {
  if (!(await FileSystem.exists(path))) {
    return false;
  }

  try {
    const stat = await FileSystem.stat(path);
    if ((stat.size ?? 0) <= 128) {
      return false;
    }

    const headerB64 = await FileSystem.readFileChunk(path, 0, 12, 'base64');
    const header = base64ToUint8Array(headerB64);
    if (header.length < 3) {
      return false;
    }

    const isJpeg =
      header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const isPng =
      header.length >= 4 &&
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47;
    const isGif =
      header.length >= 3 &&
      header[0] === 0x47 &&
      header[1] === 0x49 &&
      header[2] === 0x46;
    const isWebp =
      header.length >= 12 &&
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46;

    return isJpeg || isPng || isGif || isWebp;
  } catch {
    return false;
  }
}

async function removeInvalidCoverFile(path: string): Promise<void> {
  if (!(await FileSystem.exists(path))) {
    return;
  }

  if (await isValidCoverFile(path)) {
    return;
  }

  try {
    await FileSystem.unlink(path);
  } catch {
    // Ignore cleanup errors.
  }
}

export async function isCoverUriValid(coverUri?: string): Promise<boolean> {
  if (!coverUri?.startsWith('file://')) {
    return false;
  }
  return isValidCoverFile(stripFileScheme(coverUri));
}

/* eslint-disable no-bitwise -- Base64 codec relies on bit operations. */
function base64ToUint8Array(base64: string): Uint8Array {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i += 4) {
    const c1 = chars.indexOf(clean[i] ?? 'A');
    const c2 = chars.indexOf(clean[i + 1] ?? 'A');
    const c3 = clean[i + 2] === '=' ? -1 : chars.indexOf(clean[i + 2] ?? 'A');
    const c4 = clean[i + 3] === '=' ? -1 : chars.indexOf(clean[i + 3] ?? 'A');

    const n1 = (c1 << 2) | (c2 >> 4);
    bytes.push(n1 & 0xff);

    if (c3 >= 0) {
      const n2 = ((c2 & 15) << 4) | (c3 >> 2);
      bytes.push(n2 & 0xff);
    }

    if (c4 >= 0) {
      const n3 = ((c3 & 3) << 6) | c4;
      bytes.push(n3 & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1];
    const c = bytes[i + 2];

    const hasB = b != null;
    const hasC = c != null;
    const bVal = hasB ? b : 0;
    const cVal = hasC ? c : 0;

    const n = (a << 16) | (bVal << 8) | cVal;

    result += chars[(n >> 18) & 63];
    result += chars[(n >> 12) & 63];
    result += hasB ? chars[(n >> 6) & 63] : '=';
    result += hasC ? chars[n & 63] : '=';
  }

  return result;
}
/* eslint-enable no-bitwise */

function bytesToText(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let text = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, bytes.length);
    for (let j = i; j < end; j += 1) {
      text += String.fromCharCode(bytes[j]);
    }
  }
  return text;
}

function shouldExtractForCover(name: string): boolean {
  const lower = normalizeArchivePath(name).toLowerCase();
  if (lower.startsWith('meta-inf/')) {
    return true;
  }
  if (lower.endsWith('.opf')) {
    return true;
  }
  if (/(^|\/)cover\.(jpe?g|png|gif|webp)$/i.test(lower)) {
    return true;
  }
  if (/(^|\/)[^/]*cvi[^/]*\.x?html?$/i.test(lower)) {
    return true;
  }
  return false;
}

async function readEpubBytes(epubPath: string): Promise<Uint8Array> {
  const base64 = await FileSystem.readFile(epubPath, 'base64');
  return base64ToUint8Array(base64);
}

function findBytesForPath(
  files: Record<string, Uint8Array>,
  path: string,
): Uint8Array | null {
  for (const candidate of pathCandidates('', path)) {
    const direct = files[candidate];
    if (direct) {
      return direct;
    }
  }

  const lower = normalizeArchivePath(path).toLowerCase();
  for (const [key, data] of Object.entries(files)) {
    const normalized = normalizeArchivePath(key).toLowerCase();
    if (normalized === lower) {
      return data;
    }
  }

  const suffix = `/${lower}`;
  for (const [key, data] of Object.entries(files)) {
    const normalized = normalizeArchivePath(key).toLowerCase();
    if (normalized.endsWith(suffix)) {
      return data;
    }
  }

  return null;
}

function createMapReader(files: Record<string, Uint8Array>): ZipReader {
  return {
    readText: async (path: string) => {
      const data = findBytesForPath(files, path);
      return data ? bytesToText(data) : null;
    },
    readBase64: async (path: string) => {
      const data = findBytesForPath(files, path);
      return data ? uint8ArrayToBase64(data) : null;
    },
    readBytes: async (path: string) => findBytesForPath(files, path),
    findCoverByFilename: async () => {
      for (const candidate of COVER_FILENAME_CANDIDATES) {
        if (findBytesForPath(files, candidate)) {
          return candidate;
        }
      }

      const coverFile = Object.keys(files).find(key =>
        /(?:^|\/)cover\.(jpe?g|png|gif|webp)$/i.test(key),
      );
      return coverFile ?? null;
    },
  };
}

async function writeCoverBytes(
  coverBytes: Uint8Array,
  cacheKey: string,
  coverPath: string,
): Promise<string> {
  const ext = extensionForPath(coverPath);
  const outputPath = `${COVER_CACHE_DIR}/${cacheKey}_${COVER_CACHE_VERSION}.${ext}`;

  await ensureCoverCacheDir();
  await FileSystem.writeFile(
    outputPath,
    uint8ArrayToBase64(coverBytes),
    'base64',
  );

  if (!(await isValidCoverFile(outputPath))) {
    try {
      await FileSystem.unlink(outputPath);
    } catch {
      // Ignore cleanup errors.
    }
    throw new Error('Cached cover file is invalid.');
  }

  return `file://${outputPath}`;
}

async function writeCoverBase64(
  coverBase64: string,
  cacheKey: string,
  coverPath: string,
): Promise<string> {
  const ext = extensionForPath(coverPath);
  const outputPath = `${COVER_CACHE_DIR}/${cacheKey}_${COVER_CACHE_VERSION}.${ext}`;

  await ensureCoverCacheDir();
  await FileSystem.writeFile(outputPath, coverBase64, 'base64');

  if (!(await isValidCoverFile(outputPath))) {
    try {
      await FileSystem.unlink(outputPath);
    } catch {
      // Ignore cleanup errors.
    }
    throw new Error('Cached cover file is invalid.');
  }

  return `file://${outputPath}`;
}

async function getLocalEpubPath(
  fileUrl: string,
  fileName: string,
): Promise<string> {
  const readableUri = await resolveReadableBookUri(fileUrl, fileName);
  return stripFileScheme(readableUri);
}

async function extractUsingJsZip(
  epubPath: string,
  cacheKey: string,
): Promise<EpubMetadata> {
  try {
    const bytes = await readEpubBytes(epubPath);
    const zip = await JSZip.loadAsync(bytes);
    return extractMetadataFromReader(createZipReader(zip), cacheKey);
  } catch {
    return {};
  }
}

async function extractUsingFflate(
  epubPath: string,
  cacheKey: string,
): Promise<EpubMetadata> {
  try {
    const bytes = await readEpubBytes(epubPath);
    const files = await new Promise<Record<string, Uint8Array>>(
      (resolve, reject) => {
        unzip(
          bytes,
          { filter: file => shouldExtractForCover(file.name) },
          (err, data) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(data);
          },
        );
      },
    );

    if (!findBytesForPath(files, 'META-INF/container.xml')) {
      return {};
    }

    return extractMetadataFromReader(createMapReader(files), cacheKey);
  } catch {
    return {};
  }
}

async function safeRemoveDirectory(dir: string): Promise<void> {
  if (!(await FileSystem.exists(dir))) {
    return;
  }

  let entries;
  try {
    entries = await FileSystem.statDir(dir);
  } catch {
    return;
  }

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (i > 0 && i % 8 === 0) {
      await yieldToUi();
    }
    try {
      if (entry.type === 'directory') {
        await safeRemoveDirectory(entry.path);
        continue;
      }
      await FileSystem.unlink(entry.path);
    } catch {
      // Ignore cleanup errors.
    }
  }

  try {
    await FileSystem.unlink(dir);
  } catch {
    // Ignore cleanup errors.
  }
}

async function readDiskTextIfExists(path: string): Promise<string | null> {
  if (!(await FileSystem.exists(path))) {
    return null;
  }
  try {
    return await FileSystem.readFile(path, 'utf8');
  } catch {
    return null;
  }
}

function createUnpackDir(cacheKey: string): string {
  unpackSequence += 1;
  const nonce = Math.random().toString(36).slice(2, 10);
  return `${UNPACK_CACHE_DIR}/${cacheKey}_${COVER_CACHE_VERSION}_${unpackSequence}_${nonce}`;
}

async function extractUsingUnzip(
  epubPath: string,
  cacheKey: string,
): Promise<EpubMetadata> {
  const unpackDir = createUnpackDir(cacheKey);

  try {
    await FileSystem.mkdir(unpackDir);
  } catch {
    return {};
  }

  try {
    await FileSystem.unzip(epubPath, unpackDir);
  } catch {
    await safeRemoveDirectory(unpackDir);
    return {};
  }

  try {
    const reader: ZipReader = {
      readText: async (path: string) => {
        for (const candidate of pathCandidates('', path)) {
          const absPath = `${unpackDir}/${candidate}`;
          const content = await readDiskTextIfExists(absPath);
          if (content) {
            return content;
          }
        }
        return null;
      },
      readBase64: async (path: string) => {
        for (const candidate of pathCandidates('', path)) {
          const absPath = `${unpackDir}/${candidate}`;
          if (!(await FileSystem.exists(absPath))) {
            continue;
          }
          try {
            return await FileSystem.readFile(absPath, 'base64');
          } catch {
            // Try next candidate.
          }
        }
        return null;
      },
      readBytes: async (path: string) => {
        for (const candidate of pathCandidates('', path)) {
          const absPath = `${unpackDir}/${candidate}`;
          if (!(await FileSystem.exists(absPath))) {
            continue;
          }
          try {
            const base64 = await FileSystem.readFile(absPath, 'base64');
            return base64ToUint8Array(base64);
          } catch {
            // Try next candidate.
          }
        }
        return null;
      },
      findCoverByFilename: async () => {
        for (const candidate of COVER_FILENAME_CANDIDATES) {
          const absPath = `${unpackDir}/${candidate}`;
          if (await FileSystem.exists(absPath)) {
            return candidate;
          }
        }
        return null;
      },
    };

    const containerXml = await reader.readText('META-INF/container.xml');
    if (!containerXml) {
      return {};
    }

    return extractMetadataFromReader(reader, cacheKey);
  } catch {
    return {};
  } finally {
    await safeRemoveDirectory(unpackDir);
  }
}

async function findCachedCover(cacheKey: string): Promise<string | null> {
  const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const prefixes = [
    `${cacheKey}_${COVER_CACHE_VERSION}`,
    `${cacheKey}_v1`,
    cacheKey,
  ];

  for (const prefix of prefixes) {
    for (const ext of extensions) {
      const path = `${COVER_CACHE_DIR}/${prefix}.${ext}`;
      if (await FileSystem.exists(path)) {
        if (await isValidCoverFile(path)) {
          return `file://${path}`;
        }
        await removeInvalidCoverFile(path);
      }
    }
  }

  return null;
}

async function extractFromLocalEpub(
  epubPath: string,
  cacheKey: string,
): Promise<EpubMetadata> {
  let fileSize = 0;
  try {
    const stat = await FileSystem.stat(epubPath);
    fileSize = stat.size ?? 0;
  } catch {
    fileSize = 0;
  }

  // Prefer native unzip first to keep JS thread responsive.
  const strategies: Array<() => Promise<EpubMetadata>> = [
    () => extractUsingUnzip(epubPath, cacheKey),
    () => extractUsingFflate(epubPath, cacheKey),
  ];

  if (fileSize === 0 || fileSize <= JSZIP_MAX_BYTES) {
    strategies.push(() => extractUsingJsZip(epubPath, cacheKey));
  }

  for (const strategy of strategies) {
    await yieldToUi();
    const result = await strategy();
    if (result.coverUri) {
      return result;
    }
  }

  return {};
}

export async function getCachedCoverUri(
  fileUrl: string,
): Promise<string | null> {
  return findCachedCover(cacheKeyForUri(fileUrl));
}

export async function clearCachedCoverForBook(fileUrl: string): Promise<void> {
  const cacheKey = cacheKeyForUri(fileUrl);
  const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const prefixes = [
    `${cacheKey}_${COVER_CACHE_VERSION}`,
    `${cacheKey}_v1`,
    cacheKey,
  ];

  for (const prefix of prefixes) {
    for (const ext of extensions) {
      const path = `${COVER_CACHE_DIR}/${prefix}.${ext}`;
      if (!(await FileSystem.exists(path))) {
        continue;
      }
      try {
        await FileSystem.unlink(path);
      } catch {
        // Best-effort cache cleanup.
      }
    }
  }
}

export async function extractEpubMetadata(
  fileUrl: string,
  fileName: string,
): Promise<EpubMetadata> {
  const cacheKey = cacheKeyForUri(fileUrl);
  const existing = await findCachedCover(cacheKey);
  if (existing) {
    return { coverUri: existing };
  }

  try {
    return await withExtractionLock(async () => {
      await yieldToUi();

      const cached = await findCachedCover(cacheKey);
      if (cached) {
        return { coverUri: cached };
      }

      const epubPath = await getLocalEpubPath(fileUrl, fileName);
      await yieldToUi();
      return extractFromLocalEpub(epubPath, cacheKey);
    });
  } catch {
    const cached = await findCachedCover(cacheKey);
    return cached ? { coverUri: cached } : {};
  }
}
