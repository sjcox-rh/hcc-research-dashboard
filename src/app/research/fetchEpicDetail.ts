import type { EpicDetailResponse, JiraSearchErrorBody } from '@app/research/types';

/** Same path as the board search so dev proxy routing always matches. */
const SEARCH_PATH = '/api/jira/search';

export async function fetchEpicDetail(epicKey: string): Promise<EpicDetailResponse> {
  const q = new URLSearchParams();
  q.set('epicKey', epicKey.trim());
  const url = `${SEARCH_PATH}?${q}`;

  const res = await fetch(url);
  const proxyMarker = res.headers.get('x-hcc-jira-proxy');
  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data as JiraSearchErrorBody;
    const msg = err.error || `Request failed (${res.status})`;
    const looksLikeProxy =
      /has been removed|migrate to.*\/search\/jql|CHANGE-2046/i.test(msg) ||
      /\/rest\/api\/3\/search\b/i.test(msg);
    if (looksLikeProxy && !proxyMarker) {
      throw new Error(
        `${msg} This response is missing the X-Hcc-Jira-Proxy header — run npm run start:dev:research with the Jira proxy, or check JIRA_PROXY_PORT.`,
      );
    }
    throw new Error(msg);
  }

  return normalizeEpicDetailPayload(data, epicKey.trim());
}

function normalizeEpicDetailPayload(data: unknown, requestedKey: string): EpicDetailResponse {
  const d = (data && typeof data === 'object' ? data : {}) as Partial<EpicDetailResponse> & {
    total?: number;
    jiraProjectUrl?: string;
  };

  if (d.epicKey == null && typeof d.total === 'number' && d.jiraProjectUrl != null) {
    throw new Error(
      'The proxy returned board search data instead of epic detail. Restart `npm run jira-proxy` (or `npm run start:dev:research`) so `/api/jira/search?epicKey=` is handled.',
    );
  }

  return {
    epicKey: typeof d.epicKey === 'string' ? d.epicKey : requestedKey,
    jql: typeof d.jql === 'string' ? d.jql : '',
    jiraBrowseBase: typeof d.jiraBrowseBase === 'string' ? d.jiraBrowseBase : '',
    epic: d.epic ?? null,
    rootIssue: d.rootIssue ?? null,
    stories: Array.isArray(d.stories) ? d.stories : [],
    issues: Array.isArray(d.issues) ? d.issues : [],
  };
}
