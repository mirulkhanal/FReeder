export type OpdsCatalog = {
  id: string;
  title: string;
  url: string;
  opdsVersion?: 'auto' | '1' | '2';
  username?: string;
  password?: string;
};

export type OpdsLink = {
  href: string;
  rel: string;
  type?: string;
  title?: string;
};

export type OpdsEntry = {
  id: string;
  title: string;
  author?: string;
  summary?: string;
  links: OpdsLink[];
};

export type OpdsFeed = {
  title: string;
  entries: OpdsEntry[];
  feedLinks: OpdsLink[];
  nextUrl?: string;
  searchDescriptionUrl?: string;
};

export type OpdsSearchTemplate = {
  type: string;
  template: string;
};
