import type { ResearchIssue } from '@app/research/types';

export function linkLabelForResource(href: string): string {
  try {
    const u = new URL(href);
    const path = u.pathname.length > 40 ? `${u.pathname.slice(0, 37)}…` : u.pathname;
    return `${u.hostname}${path || ''}`;
  } catch {
    return href.slice(0, 60);
  }
}

export type AggregatedWebLink = {
  url: string;
  label: string;
  sourceKeys: string[];
  fromDescription: boolean;
  fromComments: boolean;
};

export type AggregatedAttachment = {
  url: string;
  filename: string;
  sourceKeys: string[];
};

export function buildAggregatedStoryResources(stories: ResearchIssue[]): {
  webLinks: AggregatedWebLink[];
  attachments: AggregatedAttachment[];
} {
  const webMap = new Map<string, AggregatedWebLink>();
  const attMap = new Map<string, AggregatedAttachment>();

  const addKey = (keys: string[], k: string) => {
    if (!keys.includes(k)) keys.push(k);
  };

  for (const st of stories) {
    const k = st.key;
    for (const href of st.links || []) {
      const u = (href || '').trim();
      if (!u) continue;
      let row = webMap.get(u);
      if (!row) {
        row = { url: u, label: linkLabelForResource(u), sourceKeys: [], fromDescription: false, fromComments: false };
        webMap.set(u, row);
      }
      addKey(row.sourceKeys, k);
      row.fromDescription = true;
    }
    for (const href of st.commentLinks || []) {
      const u = (href || '').trim();
      if (!u) continue;
      let row = webMap.get(u);
      if (!row) {
        row = { url: u, label: linkLabelForResource(u), sourceKeys: [], fromDescription: false, fromComments: false };
        webMap.set(u, row);
      }
      addKey(row.sourceKeys, k);
      row.fromComments = true;
    }
    for (const att of st.attachments || []) {
      const u = (att.contentUrl || '').trim();
      if (!u) continue;
      let row = attMap.get(u);
      if (!row) {
        row = { url: u, filename: att.filename || 'attachment', sourceKeys: [] };
        attMap.set(u, row);
      }
      addKey(row.sourceKeys, k);
    }
  }

  const webLinks = Array.from(webMap.values()).sort((a, b) => a.url.localeCompare(b.url));
  const attachments = Array.from(attMap.values()).sort((a, b) => a.filename.localeCompare(b.filename));
  return { webLinks, attachments };
}

export function webLinkSourceNote(row: AggregatedWebLink): string {
  if (row.fromDescription && row.fromComments) return 'Description & comments';
  if (row.fromDescription) return 'Description';
  return 'Comments';
}
