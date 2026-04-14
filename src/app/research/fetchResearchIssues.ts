import type { JiraSearchErrorBody, JiraSearchResponse } from '@app/research/types';

const SEARCH_PATH = '/api/jira/search';

export async function fetchResearchIssues(params?: {
  startAt?: number;
  maxResults?: number;
}): Promise<JiraSearchResponse> {
  const q = new URLSearchParams();
  if (params?.startAt != null) q.set('startAt', String(params.startAt));
  if (params?.maxResults != null) q.set('maxResults', String(params.maxResults));
  const url = q.toString() ? `${SEARCH_PATH}?${q}` : SEARCH_PATH;

  const res = await fetch(url);
  const proxyMarker = res.headers.get('x-hcc-jira-proxy');
  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data as JiraSearchErrorBody;
    const msg = err.error || `Request failed (${res.status})`;
    const looksLike2046 =
      /has been removed|migrate to.*\/search\/jql|CHANGE-2046/i.test(msg) ||
      /\/rest\/api\/3\/search\b/i.test(msg);
    if (looksLike2046 && !proxyMarker) {
      throw new Error(
        `${msg} This response is missing the X-Hcc-Jira-Proxy header — the dev server may not be reaching this repo's Jira proxy. Run npm run jira-proxy:free-port, set JIRA_PROXY_PORT in .env (default 3848), then npm run start:dev:research.`,
      );
    }
    throw new Error(msg);
  }

  return data as JiraSearchResponse;
}
