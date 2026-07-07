import type {
  OpdsEntry,
  OpdsFeed,
  OpdsLink,
  OpdsSearchTemplate,
} from '../types/opds';

type Opds2Link = {
  rel?: string | string[];
  href?: string;
  type?: string;
  title?: string;
};

type Opds2Publication = {
  metadata?: {
    title?: string | { name?: string };
    author?: { name?: string } | Array<{ name?: string }>;
    description?: string;
  };
  links?: Opds2Link[];
  images?: Array<{ href?: string; type?: string }>;
};

type Opds2Feed = {
  metadata?: { title?: string };
  links?: Opds2Link[];
  publications?: Opds2Publication[];
  navigation?: Opds2Publication[];
};

function relList(rel?: string | string[]): string[] {
  if (!rel) {
    return [];
  }
  return Array.isArray(rel) ? rel : [rel];
}

function toOpdsLink(link: Opds2Link): OpdsLink | null {
  if (!link.href) {
    return null;
  }
  const rels = relList(link.rel);
  return {
    href: link.href,
    rel: rels[0] ?? '',
    type: link.type,
    title: link.title,
  };
}

function publicationTitle(pub: Opds2Publication): string {
  const title = pub.metadata?.title;
  if (typeof title === 'string') {
    return title;
  }
  return title?.name ?? 'Untitled';
}

function publicationAuthor(pub: Opds2Publication): string | undefined {
  const author = pub.metadata?.author;
  if (!author) {
    return undefined;
  }
  if (Array.isArray(author)) {
    return (
      author
        .map(entry => entry.name)
        .filter(Boolean)
        .join(', ') || undefined
    );
  }
  return author.name;
}

function publicationToEntry(pub: Opds2Publication, index: number): OpdsEntry {
  const links: OpdsLink[] = [];
  for (const link of pub.links ?? []) {
    const mapped = toOpdsLink(link);
    if (mapped) {
      links.push(mapped);
    }
  }
  for (const image of pub.images ?? []) {
    if (image.href) {
      links.push({
        href: image.href,
        rel: 'http://opds-spec.org/image/thumbnail',
        type: image.type,
      });
    }
  }

  return {
    id: `opds2-${index}-${publicationTitle(pub)}`,
    title: publicationTitle(pub),
    author: publicationAuthor(pub),
    summary:
      typeof pub.metadata?.description === 'string'
        ? pub.metadata.description
        : undefined,
    links,
  };
}

export function isOpds2Json(body: string): boolean {
  const trimmed = body.trim();
  return trimmed.startsWith('{') && trimmed.includes('"metadata"');
}

export function parseOpds2Feed(json: string): OpdsFeed {
  const parsed = JSON.parse(json) as Opds2Feed;
  const feedLinks = (parsed.links ?? [])
    .map(toOpdsLink)
    .filter((link): link is OpdsLink => link != null);

  const publications = [
    ...(parsed.publications ?? []),
    ...(parsed.navigation ?? []),
  ].map(publicationToEntry);

  const nextUrl = feedLinks.find(link => link.rel === 'next')?.href;
  const searchDescriptionUrl = feedLinks.find(link =>
    relList(link.rel).some(rel => rel.includes('search')),
  )?.href;

  return {
    title: parsed.metadata?.title ?? 'Catalog',
    entries: publications,
    feedLinks,
    nextUrl,
    searchDescriptionUrl,
  };
}

export function parseOpds2SearchTemplate(
  feed: OpdsFeed,
  baseUrl: string,
): OpdsSearchTemplate | null {
  const searchLink = feed.feedLinks.find(link =>
    relList(link.rel).some(rel => rel.includes('search')),
  );
  if (!searchLink?.href) {
    return null;
  }
  const template = searchLink.href.includes('{searchTerms}')
    ? searchLink.href
    : `${searchLink.href}${
        searchLink.href.includes('?') ? '&' : '?'
      }q={searchTerms}`;
  return {
    type: searchLink.type ?? 'application/opds+json',
    template: resolveOpds2Url(baseUrl, template),
  };
}

function resolveOpds2Url(baseUrl: string, href: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  return new URL(href, baseUrl).toString();
}
