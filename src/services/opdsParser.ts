import type { OpdsEntry, OpdsFeed, OpdsLink, OpdsSearchTemplate } from '../types/opds';

const EPUB_TYPES = new Set([
  'application/epub+zip',
  'application/epub',
  'application/ePub+zip',
  'application/x-epub+zip',
]);

const DRM_TYPES = new Set([
  'application/vnd.adobe.adept+xml',
  'application/vnd.readium.lcp.license.v1.0+json',
  'application/vnd.readium.lcp.status.v1.0+json',
]);

const NAVIGATION_RELS = new Set([
  'subsection',
  'http://opds-spec.org/subsection',
  'http://opds-spec.org/catalog',
]);

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function stripTags(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '');
}

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match = regex.exec(attrString);
  while (match) {
    attrs[match[1]] = decodeXmlEntities(match[2] ?? match[3] ?? '');
    match = regex.exec(attrString);
  }
  return attrs;
}

function extractTagBlocks(xml: string, tagName: string): string[] {
  const blocks: string[] = [];
  const regex = new RegExp(`<${tagName}(\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  let match = regex.exec(xml);
  while (match) {
    blocks.push(match[0]);
    match = regex.exec(xml);
  }
  return blocks;
}

function readText(block: string, tagNames: string[]): string | undefined {
  for (const tag of tagNames) {
    const localName = tag.includes(':') ? tag.split(':').pop()! : tag;
    const regex = new RegExp(
      `<(?:[\\w.-]+:)?${localName}[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${localName}>`,
      'i',
    );
    const match = block.match(regex);
    if (match) {
      const text = stripTags(match[1]).trim();
      if (text) {
        return decodeXmlEntities(text);
      }
    }
  }
  return undefined;
}

function extractLinks(block: string): OpdsLink[] {
  const links: OpdsLink[] = [];
  const regex = /<link\s+([^>]+?)\s*\/?>/gi;
  let match = regex.exec(block);
  while (match) {
    const attrs = parseAttributes(match[1]);
    if (attrs.href) {
      links.push({
        href: attrs.href,
        rel: attrs.rel ?? '',
        type: attrs.type,
        title: attrs.title,
      });
    }
    match = regex.exec(block);
  }
  return links;
}

function readAuthor(block: string): string | undefined {
  const authorBlocks = extractTagBlocks(block, 'author');
  for (const authorBlock of authorBlocks) {
    const name = readText(authorBlock, ['name']);
    if (name) {
      return name;
    }
  }
  return readText(block, ['dc:creator', 'creator']);
}

function parseEntry(block: string): OpdsEntry | null {
  const title = readText(block, ['title']);
  if (!title) {
    return null;
  }

  const id = readText(block, ['id', 'dc:identifier']) ?? title;
  const links = extractLinks(block);

  return {
    id,
    title,
    author: readAuthor(block),
    summary: readText(block, ['summary', 'content', 'dc:description']),
    links,
  };
}

export function parseOpdsFeed(xml: string): OpdsFeed {
  const feedBlock = xml.match(/<feed[^>]*>([\s\S]*)<\/feed>/i)?.[0] ?? xml;
  const title = readText(feedBlock, ['title']) ?? 'Catalog';
  const feedLinks = extractLinks(feedBlock);
  const entries = extractTagBlocks(feedBlock, 'entry')
    .map(parseEntry)
    .filter((entry): entry is OpdsEntry => entry != null);

  const nextUrl = feedLinks.find(link => link.rel === 'next')?.href;
  const searchDescriptionUrl = feedLinks.find(
    link =>
      link.rel === 'search' &&
      (!link.type || link.type.toLowerCase().includes('opensearch')),
  )?.href;

  return {
    title,
    entries,
    feedLinks,
    nextUrl,
    searchDescriptionUrl,
  };
}

export function parseOpenSearchDescription(xml: string): OpdsSearchTemplate | null {
  const urlBlocks = extractTagBlocks(xml, 'Url');
  for (const block of urlBlocks) {
    const openTag = block.match(/<Url\s+([^>]+)>/i)?.[1];
    if (!openTag) {
      continue;
    }
    const attrs = parseAttributes(openTag);
    if (
      attrs.template &&
      (attrs.type?.includes('atom') || attrs.type?.includes('opds'))
    ) {
      return { type: attrs.type, template: attrs.template };
    }
  }
  return null;
}

export function isNavigationLink(link: OpdsLink): boolean {
  const rel = link.rel.toLowerCase();
  if (NAVIGATION_RELS.has(rel)) {
    return true;
  }
  return rel.endsWith('/subsection') || rel === 'subsection';
}

function humanizePathSegment(segment: string): string {
  return segment
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function titleFromHref(href: string): string {
  const path = href.split('?')[0]?.replace(/\/$/, '') ?? '';
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) {
    return 'Browse';
  }

  const last = segments[segments.length - 1] ?? 'Browse';
  if (/^[a-f0-9-]{8,}$/i.test(last) && segments.length > 1) {
    const parent = segments[segments.length - 2] ?? 'Browse';
    return humanizePathSegment(parent);
  }

  return humanizePathSegment(last);
}

function resolveNavigationTitle(link: OpdsLink, entry?: OpdsEntry): string {
  const fromLink = link.title?.trim();
  if (fromLink) {
    return fromLink;
  }
  const fromEntry = entry?.title?.trim() || entry?.summary?.trim();
  if (fromEntry) {
    return fromEntry;
  }
  return titleFromHref(link.href);
}

export function isEpubAcquisitionLink(link: OpdsLink): boolean {
  const rel = link.rel.toLowerCase();
  const type = link.type?.toLowerCase() ?? '';
  const href = link.href.toLowerCase();
  if (DRM_TYPES.has(type)) {
    return false;
  }
  if (!rel.includes('acquisition')) {
    return false;
  }
  if (EPUB_TYPES.has(type) || type.includes('epub')) {
    return true;
  }
  return href.includes('.epub') || /\/file\/[^/]+\.epub(?:\?|$)/i.test(href);
}

export function isDrmAcquisitionLink(link: OpdsLink): boolean {
  const type = link.type?.toLowerCase() ?? '';
  return DRM_TYPES.has(type) || link.rel.toLowerCase().includes('license');
}

export function getThumbnailUrl(links: OpdsLink[]): string | undefined {
  const thumb = links.find(link => {
    const rel = link.rel.toLowerCase();
    return rel === 'thumbnail' || rel === 'http://opds-spec.org/image/thumbnail';
  });
  if (thumb) {
    return thumb.href;
  }
  const image = links.find(link => {
    const rel = link.rel.toLowerCase();
    return rel === 'image' || rel.includes('image');
  });
  return image?.href;
}

export function getAcquisitionLinks(entry: OpdsEntry): OpdsLink[] {
  return entry.links.filter(isEpubAcquisitionLink);
}

export function getNavigationLinks(feed: OpdsFeed): OpdsLink[] {
  const seen = new Set<string>();
  const links: OpdsLink[] = [];

  const add = (link: OpdsLink) => {
    if (seen.has(link.href)) {
      return;
    }
    seen.add(link.href);
    links.push(link);
  };

  for (const entry of feed.entries) {
    if (getAcquisitionLinks(entry).length > 0) {
      continue;
    }

    for (const link of entry.links) {
      if (!isNavigationLink(link)) {
        continue;
      }
      add({
        ...link,
        title: resolveNavigationTitle(link, entry),
      });
    }
  }

  for (const link of feed.feedLinks) {
    if (!isNavigationLink(link)) {
      continue;
    }
    add({
      ...link,
      title: resolveNavigationTitle(link),
    });
  }

  return links;
}

export function getPublicationEntries(feed: OpdsFeed): OpdsEntry[] {
  return feed.entries.filter(entry => getAcquisitionLinks(entry).length > 0);
}

export function buildSearchUrl(template: string, query: string): string {
  return template.replace(/\{searchTerms\}/gi, encodeURIComponent(query));
}
