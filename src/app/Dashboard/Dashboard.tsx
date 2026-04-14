import * as React from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  ClipboardCopy,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateBody,
  ExpandableSection,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  PageSection,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { fetchResearchIssues } from '@app/research/fetchResearchIssues';
import { IssueStatusLabel, buildStatusColorMap, type LabelColor } from '@app/research/statusColors';
import type { JiraSearchResponse, ResearchIssue } from '@app/research/types';
import { useDocumentTitle } from '@app/utils/useDocumentTitle';

/** Paste into Cursor Chat / Agent with both skills enabled (this app cannot invoke IDE skills). */
const CREATE_EPIC_CURSOR_PROMPT = `Create a new UXD epic in Jira (CPUX / HCC) using the hcc-epic-creator skill end-to-end: gather any details you need, draft the epic, and create it via Atlassian MCP.

Also apply the jira-research-story-templates skill in the same session: if the epic summary includes "research" (case-insensitive), follow hcc-epic-creator Step 7a and create the nine standard research child stories under the new epic key. If this is not a research epic but I still want research-style stories, use jira-research-story-templates with the epic key I give you after creation.

Start by asking me for epic details per hcc-epic-creator Step 1 if you do not have them yet.`;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function linkLabel(href: string): string {
  try {
    const u = new URL(href);
    const path = u.pathname.length > 40 ? `${u.pathname.slice(0, 37)}…` : u.pathname;
    return `${u.hostname}${path || ''}`;
  } catch {
    return href.slice(0, 60);
  }
}

function isEpicIssue(issue: ResearchIssue): boolean {
  return (issue.issueType || '').trim().toLowerCase() === 'epic';
}

function sortStoriesByUpdatedDesc(a: ResearchIssue, b: ResearchIssue): number {
  return (b.updated || '').localeCompare(a.updated || '');
}

interface EpicCluster {
  epicKey: string;
  epic: ResearchIssue | null;
  children: ResearchIssue[];
}

/** Group issues into epic clusters: epics with their stories, then stories whose epic is elsewhere, then solo issues. */
function buildEpicClusters(issues: ResearchIssue[]): EpicCluster[] {
  const clusters = new Map<string, { epic: ResearchIssue | null; children: ResearchIssue[] }>();

  const ensure = (id: string) => {
    if (!clusters.has(id)) {
      clusters.set(id, { epic: null, children: [] });
    }
    return clusters.get(id)!;
  };

  for (const issue of issues) {
    if (isEpicIssue(issue)) {
      ensure(issue.key).epic = issue;
    } else if (issue.parentKey) {
      ensure(issue.parentKey).children.push(issue);
    } else {
      ensure(`__solo__${issue.key}`).children.push(issue);
    }
  }

  const allKeys = Array.from(clusters.keys());
  const epicKeys = allKeys.filter(k => !k.startsWith('__solo__'));
  const soloKeys = allKeys.filter(k => k.startsWith('__solo__')).sort((a, b) => a.localeCompare(b));

  const withEpicInBucket: EpicCluster[] = [];
  const epicKeySeen = new Set<string>();

  for (const k of epicKeys.sort((a, b) => a.localeCompare(b))) {
    const c = clusters.get(k)!;
    if (c.epic) {
      withEpicInBucket.push({
        epicKey: k,
        epic: c.epic,
        children: [...c.children].sort(sortStoriesByUpdatedDesc),
      });
      epicKeySeen.add(k);
    }
  }

  const childrenOnly: EpicCluster[] = [];
  for (const k of epicKeys.sort((a, b) => a.localeCompare(b))) {
    if (epicKeySeen.has(k)) continue;
    const c = clusters.get(k)!;
    if (c.children.length > 0) {
      childrenOnly.push({
        epicKey: k,
        epic: null,
        children: [...c.children].sort(sortStoriesByUpdatedDesc),
      });
    }
  }

  const solo: EpicCluster[] = soloKeys.map(k => {
    const c = clusters.get(k)!;
    return {
      epicKey: k,
      epic: null,
      children: [...c.children].sort(sortStoriesByUpdatedDesc),
    };
  });

  return [...withEpicInBucket, ...childrenOnly, ...solo];
}

function clusterLatestUpdatedIso(cluster: EpicCluster): string {
  const candidates: string[] = [];
  if (cluster.epic?.updated) candidates.push(cluster.epic.updated);
  for (const ch of cluster.children) {
    if (ch.updated) candidates.push(ch.updated);
  }
  if (candidates.length === 0) return '';
  return candidates.sort((a, b) => b.localeCompare(a))[0];
}

function sortEpicClustersByRecency(clusters: EpicCluster[]): EpicCluster[] {
  return [...clusters].sort((a, b) => clusterLatestUpdatedIso(b).localeCompare(clusterLatestUpdatedIso(a)));
}

const cardTitleKeySummary: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  columnGap: 'var(--pf-t--global--spacer--sm)',
  rowGap: 'var(--pf-t--global--spacer--xs)',
};

const cardTitleKeyStyle: React.CSSProperties = {
  fontSize: 'var(--pf-t--global--FontSize--sm)',
  fontFamily: 'var(--pf-t--global--FontFamily--mono)',
  color: 'var(--pf-t--global--text--color--subtle)',
  flexShrink: 0,
};

const cardTitleSummaryStyle: React.CSSProperties = {
  margin: 0,
  flex: '1 1 12rem',
  minWidth: 0,
  fontSize: 'var(--pf-t--global--FontSize--sm)',
  fontWeight: 'var(--pf-t--global--FontWeight--normal)',
  lineHeight: 'var(--pf-t--global--LineHeight--md)',
  color: 'var(--pf-t--global--text--color--subtle)',
  whiteSpace: 'pre-wrap',
};

const IssueCardHeaderTitle: React.FunctionComponent<{
  issue: ResearchIssue;
  detailPath: string;
}> = ({ issue, detailPath }) => (
  <CardTitle>
    <div style={cardTitleKeySummary}>
      <Button
        variant="link"
        component="a"
        href={detailPath}
        target="_blank"
        rel="noopener noreferrer"
        isInline
        style={{
          fontSize: 'var(--pf-t--global--FontSize--sm)',
          fontFamily: 'var(--pf-t--global--FontFamily--mono)',
          padding: 0,
          fontWeight: 'var(--pf-t--global--FontWeight--normal)',
          flexShrink: 0,
          textDecoration: 'none',
        }}
      >
        {issue.key}
      </Button>
      {issue.title || issue.summary ? (
        <p style={cardTitleSummaryStyle}>{issue.title || issue.summary}</p>
      ) : null}
    </div>
  </CardTitle>
);

const IssueMetadataList: React.FunctionComponent<{
  issue: ResearchIssue;
  statusColorMap: Map<string, LabelColor>;
}> = ({ issue, statusColorMap }) => (
  <DescriptionList isCompact columnModifier={{ default: '2Col' }}>
    <DescriptionListGroup>
      <DescriptionListTerm>Status</DescriptionListTerm>
      <DescriptionListDescription>
        <IssueStatusLabel status={issue.status} colorMap={statusColorMap} />
      </DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Lead</DescriptionListTerm>
      <DescriptionListDescription>{issue.assignee || '—'}</DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Created</DescriptionListTerm>
      <DescriptionListDescription>{formatDate(issue.created)}</DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Updated</DescriptionListTerm>
      <DescriptionListDescription>{formatDate(issue.updated)}</DescriptionListDescription>
    </DescriptionListGroup>
    {issue.dueDate ? (
      <DescriptionListGroup>
        <DescriptionListTerm>Due</DescriptionListTerm>
        <DescriptionListDescription>{formatDate(issue.dueDate)}</DescriptionListDescription>
      </DescriptionListGroup>
    ) : null}
  </DescriptionList>
);

const IssueGoalAndLinks: React.FunctionComponent<{ issue: ResearchIssue }> = ({ issue }) => {
  const links = Array.isArray(issue.links) ? issue.links : [];
  return (
    <>
      {issue.goal ? (
        <Content style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
          <Title headingLevel="h4" size="md">
            Goal
          </Title>
          <p>{issue.goal}</p>
        </Content>
      ) : null}
      {links.length > 0 ? (
        <Content style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
          <Title headingLevel="h4" size="md">
            Reports &amp; artifacts
          </Title>
          <ul style={{ margin: 0, paddingLeft: 'var(--pf-t--global--spacer--lg)' }}>
            {links.map(href => (
              <li key={href} style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
                <Button variant="link" component="a" href={href} target="_blank" rel="noopener noreferrer" isInline>
                  {linkLabel(href)}
                </Button>
              </li>
            ))}
          </ul>
        </Content>
      ) : null}
    </>
  );
};

const IssueDetailFields: React.FunctionComponent<{
  issue: ResearchIssue;
  statusColorMap: Map<string, LabelColor>;
}> = ({ issue, statusColorMap }) => (
  <>
    <IssueMetadataList issue={issue} statusColorMap={statusColorMap} />
    <IssueGoalAndLinks issue={issue} />
  </>
);

const IssueCardFooter: React.FunctionComponent<{ issue: ResearchIssue; browseBase: string }> = ({
  issue,
  browseBase,
}) => {
  const jiraUrl = `${browseBase}/${issue.key}`;
  return (
    <CardFooter>
      <Button variant="link" component="a" href={jiraUrl} target="_blank" rel="noopener noreferrer" isInline>
        Open in Jira
      </Button>
      <span style={{ marginLeft: 'var(--pf-t--global--spacer--md)' }}>
        <ClipboardCopy hoverTip="Copy link to share" clickTip="Copied" variant="inline-compact">
          {jiraUrl}
        </ClipboardCopy>
      </span>
    </CardFooter>
  );
};

const tableShellStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 'var(--pf-t--global--FontSize--sm)',
};

const tableCellStyle: React.CSSProperties = {
  textAlign: 'left',
  verticalAlign: 'top',
  padding: 'var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)',
  borderBottom: '1px solid var(--pf-t--global--border--color--200)',
};

const tableHeadCellStyle: React.CSSProperties = {
  ...tableCellStyle,
  fontWeight: 'var(--pf-t--global--FontWeight--bold)',
  backgroundColor: 'var(--pf-t--global--background--color--secondary--default)',
};

const StoriesTable: React.FunctionComponent<{
  issues: ResearchIssue[];
  browseBase: string;
  statusColorMap: Map<string, LabelColor>;
  /** When set, issue keys link to in-app epic/issue detail instead of Jira only. */
  internalDetailPathPrefix?: string;
}> = ({ issues, browseBase, statusColorMap, internalDetailPathPrefix }) => {
  if (issues.length === 0) return null;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableShellStyle}>
        <thead>
          <tr>
            <th scope="col" style={tableHeadCellStyle}>
              Key
            </th>
            <th scope="col" style={tableHeadCellStyle}>
              Summary
            </th>
            <th scope="col" style={tableHeadCellStyle}>
              Status
            </th>
            <th scope="col" style={tableHeadCellStyle}>
              Lead
            </th>
            <th scope="col" style={tableHeadCellStyle}>
              Created
            </th>
            <th scope="col" style={tableHeadCellStyle}>
              Updated
            </th>
            <th scope="col" style={tableHeadCellStyle}>
              Due
            </th>
          </tr>
        </thead>
        <tbody>
          {issues.map(issue => (
            <tr key={issue.key}>
              <td style={tableCellStyle}>
                {internalDetailPathPrefix ? (
                  <Button
                    variant="link"
                    component="a"
                    href={`${internalDetailPathPrefix}/${issue.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    isInline
                  >
                    {issue.key}
                  </Button>
                ) : (
                  <Button
                    variant="link"
                    component="a"
                    href={`${browseBase}/${issue.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    isInline
                  >
                    {issue.key}
                  </Button>
                )}
              </td>
              <td style={tableCellStyle}>{issue.title || '—'}</td>
              <td style={tableCellStyle}>
                <IssueStatusLabel status={issue.status} colorMap={statusColorMap} />
              </td>
              <td style={tableCellStyle}>{issue.assignee || '—'}</td>
              <td style={tableCellStyle}>{formatDate(issue.created)}</td>
              <td style={tableCellStyle}>{formatDate(issue.updated)}</td>
              <td style={tableCellStyle}>{formatDate(issue.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const EpicClusterBlock: React.FunctionComponent<{
  cluster: EpicCluster;
  browseBase: string;
  statusColorMap: Map<string, LabelColor>;
}> = ({ cluster, browseBase, statusColorMap }) => {
  const isSolo = cluster.epicKey.startsWith('__solo__');
  const childrenOnly = !cluster.epic && !isSolo;

  if (cluster.epic) {
    return (
      <Card isFullHeight style={{ marginBottom: 'var(--pf-t--global--spacer--xl)' }}>
        <CardHeader>
          <IssueCardHeaderTitle issue={cluster.epic} detailPath={`/research/epic/${cluster.epic.key}`} />
        </CardHeader>
        <CardBody>
          <IssueDetailFields issue={cluster.epic} statusColorMap={statusColorMap} />
          {cluster.children.length > 0 ? (
            <div style={{ marginTop: 'var(--pf-t--global--spacer--lg)' }}>
              <Title headingLevel="h4" size="md">
                Stories
              </Title>
              <div style={{ marginTop: 'var(--pf-t--global--spacer--sm)' }}>
                <StoriesTable
                  issues={cluster.children}
                  browseBase={browseBase}
                  statusColorMap={statusColorMap}
                  internalDetailPathPrefix="/research/epic"
                />
              </div>
            </div>
          ) : null}
        </CardBody>
        <IssueCardFooter issue={cluster.epic} browseBase={browseBase} />
      </Card>
    );
  }

  if (childrenOnly) {
    return (
      <Card isFullHeight style={{ marginBottom: 'var(--pf-t--global--spacer--xl)' }}>
        <CardHeader>
          <CardTitle>
            <Title headingLevel="h3" size="md" style={{ margin: 0 }}>
              Stories under epic{' '}
              <Button
                variant="link"
                component="a"
                href={`/research/epic/${cluster.epicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                isInline
              >
                {cluster.epicKey}
              </Button>
              <span style={{ fontWeight: 'normal', fontSize: 'var(--pf-t--global--FontSize--sm)' }}>
                {' '}
                (epic not in this result set)
              </span>
            </Title>
          </CardTitle>
        </CardHeader>
        <CardBody>
          <Title headingLevel="h4" size="md" style={{ margin: 0 }}>
            Stories
          </Title>
          <div style={{ marginTop: 'var(--pf-t--global--spacer--sm)' }}>
            <StoriesTable
              issues={cluster.children}
              browseBase={browseBase}
              statusColorMap={statusColorMap}
              internalDetailPathPrefix="/research/epic"
            />
          </div>
        </CardBody>
      </Card>
    );
  }

  const soloIssue = cluster.children[0];
  if (!soloIssue) return null;

  return (
    <Card isFullHeight style={{ marginBottom: 'var(--pf-t--global--spacer--xl)' }}>
      <CardHeader>
        <IssueCardHeaderTitle issue={soloIssue} detailPath={`/research/epic/${soloIssue.key}`} />
      </CardHeader>
      <CardBody>
        <StoriesTable
          issues={cluster.children}
          browseBase={browseBase}
          statusColorMap={statusColorMap}
          internalDetailPathPrefix="/research/epic"
        />
        <IssueGoalAndLinks issue={soloIssue} />
      </CardBody>
      <IssueCardFooter issue={soloIssue} browseBase={browseBase} />
    </Card>
  );
};

const Dashboard: React.FunctionComponent = () => {
  useDocumentTitle('HCC Research | ConsolePuffs');

  const [createEpicModalOpen, setCreateEpicModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<JiraSearchResponse | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchResearchIssues({ maxResults: 100 })
      .then(res => {
        if (!cancelled) setData(res);
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load research from Jira');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const issueList = data && Array.isArray(data.issues) ? data.issues : [];

  const statusColorMap = React.useMemo(() => {
    const names: string[] = [];
    for (const issue of issueList) {
      if (issue.status) names.push(issue.status);
    }
    return buildStatusColorMap(names);
  }, [issueList]);

  const epicClusters = React.useMemo(
    () => sortEpicClustersByRecency(buildEpicClusters(issueList)),
    [issueList],
  );

  return (
    <>
      <Modal
        variant={ModalVariant.medium}
        isOpen={createEpicModalOpen}
        onClose={() => setCreateEpicModalOpen(false)}
        aria-labelledby="create-epic-modal-title"
        aria-describedby="create-epic-modal-desc"
      >
        <ModalHeader
          title="Create new epic in Jira"
          labelId="create-epic-modal-title"
          descriptorId="create-epic-modal-desc"
          description={
            <span id="create-epic-modal-desc">
              This dashboard runs in the browser and cannot run Cursor skills directly. Use Cursor in this repository
              with the <strong>hcc-epic-creator</strong> and <strong>jira-research-story-templates</strong> skills.
            </span>
          }
        />
        <ModalBody>
          <Content>
            <ol style={{ margin: 0, paddingLeft: 'var(--pf-t--global--spacer--lg)' }}>
              <li style={{ marginBottom: 'var(--pf-t--global--spacer--sm)' }}>
                Open <strong>Cursor Chat</strong> or <strong>Agent</strong> in the <strong>hcc-research-dashboard</strong>{' '}
                workspace (same folder as this app).
              </li>
              <li style={{ marginBottom: 'var(--pf-t--global--spacer--sm)' }}>
                Attach or enable both skills (e.g. type <code>@</code> and choose <strong>HCC Epic Creator</strong> and{' '}
                <strong>Jira research story templates</strong>, or ensure both are allowed for the agent).
              </li>
              <li style={{ marginBottom: 'var(--pf-t--global--spacer--sm)' }}>
                Paste the prompt below (or ask in your own words). Research epics: include <strong>research</strong> in
                the epic summary so the epic creator skill can chain to the nine standard research stories (Step 7a).
              </li>
            </ol>
            <Title headingLevel="h4" size="md" style={{ marginTop: 'var(--pf-t--global--spacer--lg)' }}>
              Prompt to copy
            </Title>
            <div style={{ marginTop: 'var(--pf-t--global--spacer--sm)' }}>
              <ClipboardCopy hoverTip="Copy" clickTip="Copied" variant="inline-compact">
                {CREATE_EPIC_CURSOR_PROMPT}
              </ClipboardCopy>
            </div>
            <pre
              style={{
                marginTop: 'var(--pf-t--global--spacer--sm)',
                padding: 'var(--pf-t--global--spacer--md)',
                whiteSpace: 'pre-wrap',
                fontSize: 'var(--pf-t--global--FontSize--sm)',
                backgroundColor: 'var(--pf-t--global--background--color--secondary--default)',
                borderRadius: 'var(--pf-t--global--border--radius--small)',
                maxHeight: '14rem',
                overflow: 'auto',
              }}
            >
              {CREATE_EPIC_CURSOR_PROMPT}
            </pre>
          </Content>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={() => setCreateEpicModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <PageSection hasBodyWrapper={false}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--pf-t--global--spacer--md)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 18rem', minWidth: 0 }}>
            <Title headingLevel="h1" size="2xl">
              The Console dot Research Hub
            </Title>
            <Title
              headingLevel="h2"
              size="lg"
              style={{
                marginTop: 'var(--pf-t--global--spacer--xs)',
                fontWeight: 'var(--pf-t--global--FontWeight--normal)',
              }}
            >
              Empowering Data-Driven Design through Transparency.
            </Title>
          </div>
          <div style={{ flexShrink: 0 }}>
            <Button variant="primary" onClick={() => setCreateEpicModalOpen(true)}>
              Create new research epic
            </Button>
          </div>
        </div>
        <Content style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
          <p>
            Welcome to the central nervous system for UX Research within the Console dot team. This dashboard serves as
            our open repository for user insights, connecting stakeholders and designers to the voice of our users. By
            centralizing our findings, we ensure that every design decision is backed by evidence and every product update
            aligns with real-world user needs.
          </p>
        </Content>
      </PageSection>

      <PageSection>
        {loading ? (
          <Spinner aria-label="Loading research from Jira" />
        ) : error ? (
          <Alert variant="danger" title="Could not load Jira issues">
            <p>{error}</p>
          </Alert>
        ) : data ? (
          <>
            <Content style={{ marginBottom: 'var(--pf-t--global--spacer--lg)' }}>
              <p>
                <strong>{data.total}</strong> matching issue{data.total === 1 ? '' : 's'} (showing {issueList.length}{' '}
                on this page).{' '}
                <Button
                  variant="link"
                  component="a"
                  href={data.jiraProjectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  isInline
                >
                  Open CPUX in Jira
                </Button>
              </p>
            </Content>
            {issueList.length === 0 ? (
              <EmptyState titleText="No items" headingLevel="h4">
                <EmptyStateBody>No issues matched this board&apos;s JQL in the current result set.</EmptyStateBody>
              </EmptyState>
            ) : (
              epicClusters.map(cluster => (
                <EpicClusterBlock
                  key={cluster.epicKey}
                  cluster={cluster}
                  browseBase={data.jiraBrowseBase}
                  statusColorMap={statusColorMap}
                />
              ))
            )}
            {data.jql ? (
              <ExpandableSection
                toggleText="JQL used for this board"
                style={{ marginTop: 'var(--pf-t--global--spacer--2xl)' }}
              >
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{data.jql}</pre>
              </ExpandableSection>
            ) : null}
          </>
        ) : null}
      </PageSection>
    </>
  );
};

export { Dashboard };
