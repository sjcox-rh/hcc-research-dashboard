export interface JiraAttachment {
  id: string;
  filename: string;
  contentUrl: string;
  size: number | null;
  mimeType: string | null;
}

export interface ResearchIssue {
  key: string;
  /** Issue summary (Jira title). */
  title: string;
  /** Narrative from description (goal line removed when present). */
  summary: string;
  goal: string | null;
  status: string;
  statusCategoryKey: string;
  issueType: string;
  assignee: string | null;
  created: string | null;
  updated: string | null;
  dueDate: string | null;
  labels: string[];
  /** URLs found in the description (reports, prototypes, plans). Always an array from our proxy; may be missing from older responses. */
  links?: string[];
  parentKey: string | null;
  /** Present on epic-detail responses from the proxy. */
  attachments?: JiraAttachment[];
  /** URLs extracted from issue comments (epic-detail only). */
  commentLinks?: string[];
}

export interface JiraSearchResponse {
  jql: string;
  total: number;
  startAt: number;
  maxResults: number;
  jiraBrowseBase: string;
  jiraProjectUrl: string;
  issues: ResearchIssue[];
}

export interface JiraSearchErrorBody {
  error: string;
  hint?: string;
  details?: Record<string, string>;
}

export interface EpicDetailResponse {
  epicKey: string;
  jql: string;
  jiraBrowseBase: string;
  epic: ResearchIssue | null;
  /** When the URL key is a non-epic issue (e.g. standalone story). */
  rootIssue: ResearchIssue | null;
  stories: ResearchIssue[];
  issues: ResearchIssue[];
}
