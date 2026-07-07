import type { Link, Locator } from 'react-native-readium';

export type TocLink = Link & { children?: TocLink[] };

export function locatorForLink(link: Link, positions: Locator[]): Locator | null {
  const href = link.href;
  const exact = positions.find(
    position =>
      position.href === href ||
      position.href.endsWith(`/${href}`) ||
      href.endsWith(position.href),
  );
  if (exact) {
    return exact;
  }

  return {
    href,
    type: 'application/xhtml+xml',
    title: link.title,
    locations: { progression: 0 },
  };
}

export function locatorAtProgress(
  positions: Locator[],
  progress: number,
): Locator | null {
  if (positions.length === 0) {
    return null;
  }

  const target = Math.min(1, Math.max(0, progress));
  let best = positions[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const position of positions) {
    const value =
      position.locations?.totalProgression ??
      position.locations?.progression ??
      0;
    const distance = Math.abs(value - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = position;
    }
  }

  return best;
}

export function flattenTocLinks(links: TocLink[]): Link[] {
  const flat: Link[] = [];
  const walk = (items: TocLink[]) => {
    for (const item of items) {
      flat.push(item);
      if (item.children?.length) {
        walk(item.children);
      }
    }
  };
  walk(links);
  return flat;
}

function normalizeHref(href: string): string {
  try {
    return decodeURIComponent(href).split('#')[0].replace(/^\.\//, '').replace(/^\/+/, '');
  } catch {
    return href.split('#')[0];
  }
}

function hrefMatches(a: string, b: string): boolean {
  const left = normalizeHref(a);
  const right = normalizeHref(b);
  if (left === right) {
    return true;
  }
  if (left.endsWith(`/${right}`) || right.endsWith(`/${left}`)) {
    return true;
  }
  const leftBase = left.split('/').pop() ?? left;
  const rightBase = right.split('/').pop() ?? right;
  return leftBase.length > 0 && leftBase === rightBase;
}

function chapterFromReadingProgress(
  locator: Locator,
  tocLinks: Link[],
  positions: Locator[],
): string | null {
  const current =
    locator.locations?.totalProgression ?? locator.locations?.progression;
  if (current == null || tocLinks.length === 0) {
    return null;
  }

  let bestTitle: string | null = null;
  let bestProgress = -1;

  for (const link of tocLinks) {
    const title = link.title?.trim();
    if (!title) {
      continue;
    }

    const position = positions.find(entry => hrefMatches(entry.href, link.href));
    const progress =
      position?.locations?.totalProgression ?? position?.locations?.progression;
    if (progress == null) {
      continue;
    }

    if (progress <= current + 0.002 && progress >= bestProgress) {
      bestProgress = progress;
      bestTitle = title;
    }
  }

  return bestTitle;
}

export function chapterTitleForLocator(
  locator: Locator,
  tocLinks: Link[],
  positions: Locator[] = [],
): string | null {
  if (locator.title?.trim()) {
    return locator.title.trim();
  }

  for (let i = tocLinks.length - 1; i >= 0; i -= 1) {
    const link = tocLinks[i];
    if (hrefMatches(locator.href, link.href) && link.title?.trim()) {
      return link.title.trim();
    }
  }

  return chapterFromReadingProgress(locator, tocLinks, positions);
}
