import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
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
  Divider,
  ExpandableSection,
  PageSection,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { linkLabelForResource as linkLabel } from '@app/research/aggregateStoryResources';
import { fetchEpicDetail } from '@app/research/fetchEpicDetail';
import { ResearchResourcesPanel } from '@app/research/ResearchResourcesPanel';
import { IssueStatusLabel, buildStatusColorMap } from '@app/research/statusColors';
import type { EpicDetailResponse, ResearchIssue } from '@app/research/types';
import { useDocumentTitle } from '@app/utils/useDocumentTitle';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

/** Jira status category `done` (e.g. Closed, Done). */
function isDoneStatusCategory(issue: ResearchIssue): boolean {
  return (issue.statusCategoryKey || '').toLowerCase() === 'done';
}

function statusesForColorMap(
  epic: ResearchIssue | null,
  root: ResearchIssue | null,
  stories: ResearchIssue[] | undefined,
): string[] {
  const list = Array.isArray(stories) ? stories : [];
  const names: string[] = [];
  const add = (i: ResearchIssue | null) => {
    if (i?.status) names.push(i.status);
  };
  add(epic);
  add(root);
  for (const s of list) add(s);
  return names;
}

const IssueDetailCard: React.FunctionComponent<{
  issue: ResearchIssue;
  browseBase: string;
  statusColorMap: ReturnType<typeof buildStatusColorMap>;
  headingPrefix?: string;
  /** When set, shows how many child issues are loaded for this epic (or focal issue). */
  childIssueCount?: number;
  /** Child issue list cards: omit issue type; omit due date when status is in the Done category. */
  childIssueCard?: boolean;
}> = ({ issue, browseBase, statusColorMap, headingPrefix, childIssueCount, childIssueCard }) => {
  const jiraUrl = `${browseBase}/${issue.key}`;
  const links = Array.isArray(issue.links) ? issue.links : [];
  const commentLinks = Array.isArray(issue.commentLinks) ? issue.commentLinks : [];
  const attachments = Array.isArray(issue.attachments) ? issue.attachments : [];

  return (
    <Card isFullHeight style={{ marginBottom: 'var(--pf-t--global--spacer--lg)' }}>
      <CardHeader>
        <CardTitle>
          <Title headingLevel="h3" size="lg" style={{ margin: 0 }}>
            {headingPrefix ? `${headingPrefix}: ` : null}
            <Button variant="link" component="a" href={jiraUrl} target="_blank" rel="noopener noreferrer" isInline>
              {issue.key}
            </Button>
            <span style={{ fontWeight: 600 }}>{issue.title ? ` — ${issue.title}` : ''}</span>
          </Title>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <DescriptionList isCompact columnModifier={{ default: '2Col' }}>
          {typeof childIssueCount === 'number' ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Issues</DescriptionListTerm>
              <DescriptionListDescription>{childIssueCount}</DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
          <DescriptionListGroup>
            <DescriptionListTerm>Status</DescriptionListTerm>
            <DescriptionListDescription>
              <IssueStatusLabel status={issue.status} colorMap={statusColorMap} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          {!childIssueCard ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Type</DescriptionListTerm>
              <DescriptionListDescription>{issue.issueType}</DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
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
          {issue.dueDate && !(childIssueCard && isDoneStatusCategory(issue)) ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Due</DescriptionListTerm>
              <DescriptionListDescription>{formatDate(issue.dueDate)}</DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
        </DescriptionList>

        {issue.summary ? (
          <Content style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
            <Title headingLevel="h4" size="md">
              Description
            </Title>
            <p style={{ whiteSpace: 'pre-wrap' }}>{issue.summary}</p>
          </Content>
        ) : null}

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
              Links in description
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

        {commentLinks.length > 0 ? (
          <Content style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
            <Title headingLevel="h4" size="md">
              Links in comments
            </Title>
            <ul style={{ margin: 0, paddingLeft: 'var(--pf-t--global--spacer--lg)' }}>
              {commentLinks.map(href => (
                <li key={href} style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
                  <Button variant="link" component="a" href={href} target="_blank" rel="noopener noreferrer" isInline>
                    {linkLabel(href)}
                  </Button>
                </li>
              ))}
            </ul>
          </Content>
        ) : null}

        {attachments.length > 0 ? (
          <Content style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
            <Title headingLevel="h4" size="md">
              Attachments
            </Title>
            <ul style={{ margin: 0, paddingLeft: 'var(--pf-t--global--spacer--lg)' }}>
              {attachments.map(att => (
                <li key={String(att.id)} style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
                  <Button
                    variant="link"
                    component="a"
                    href={att.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    isInline
                  >
                    {att.filename}
                    {att.size != null ? ` (${Math.round(att.size / 1024)} KB)` : ''}
                  </Button>
                </li>
              ))}
            </ul>
          </Content>
        ) : null}
      </CardBody>
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
    </Card>
  );
};

const EpicDetailPage: React.FunctionComponent = () => {
  const { epicKey: epicKeyParam } = useParams<{ epicKey: string }>();
  const epicKey = epicKeyParam?.trim() || '';

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<EpicDetailResponse | null>(null);

  useDocumentTitle(epicKey ? `${epicKey} | ConsolePuffs` : 'Epic | ConsolePuffs');

  React.useEffect(() => {
    if (!epicKey) {
      setLoading(false);
      setError('Missing issue key in URL.');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    fetchEpicDetail(epicKey)
      .then(res => {
        if (!cancelled) setDetail(res);
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load epic from Jira');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [epicKey]);

  const statusColorMap = React.useMemo(() => {
    if (!detail) return new Map();
    return buildStatusColorMap(
      statusesForColorMap(detail.epic, detail.rootIssue, detail.stories),
    );
  }, [detail]);

  const stories = detail?.stories ?? [];
  const childCount = stories.length;

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <div style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
          <Link to="/" style={{ fontWeight: 'var(--pf-t--global--FontWeight--normal)' }}>
            ← Back to research board
          </Link>
        </div>
        <Title headingLevel="h1" size="2xl">
          {detail?.epic
            ? `Epic ${detail.epic.key}`
            : detail?.rootIssue
              ? `Issue ${detail.rootIssue.key}`
              : epicKey
                ? `Epic ${epicKey}`
                : 'Epic detail'}
        </Title>
        {detail?.epic?.title || detail?.rootIssue?.title ? (
          <Content style={{ marginTop: 'var(--pf-t--global--spacer--sm)' }}>
            <p style={{ fontSize: 'var(--pf-t--global--FontSize--lg)' }}>
              {detail.epic?.title || detail.rootIssue?.title}
            </p>
          </Content>
        ) : null}
      </PageSection>

      <PageSection>
        {loading ? (
          <Spinner aria-label="Loading epic from Jira" />
        ) : error ? (
          <Alert variant="danger" title="Could not load epic">
            <p>{error}</p>
          </Alert>
        ) : detail ? (
          <>
            {detail.jql ? (
              <ExpandableSection toggleText="JQL used to load this epic">
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{detail.jql}</pre>
              </ExpandableSection>
            ) : null}

            {detail.epic ? (
              <IssueDetailCard
                issue={detail.epic}
                browseBase={detail.jiraBrowseBase}
                statusColorMap={statusColorMap}
                headingPrefix="Epic"
                childIssueCount={childCount}
              />
            ) : detail.rootIssue ? (
              <IssueDetailCard
                issue={detail.rootIssue}
                browseBase={detail.jiraBrowseBase}
                statusColorMap={statusColorMap}
                childIssueCount={childCount}
              />
            ) : (
              <Alert variant="warning" title="Epic not found in Jira">
                <p>
                  No issue with key <strong>{detail.epicKey}</strong> was returned. Child issues may still appear
                  below if they reference this parent.
                </p>
                {childCount > 0 ? (
                  <p style={{ marginTop: 'var(--pf-t--global--spacer--sm)' }}>
                    <strong>Issues:</strong> {childCount} loaded for this key.
                  </p>
                ) : null}
              </Alert>
            )}

            {stories.length > 0 ? (
              <ResearchResourcesPanel
                stories={stories}
                intro="Links and attachments gathered from descriptions and comments on the child issues below."
              />
            ) : null}

            {stories.length > 0 ? (
              <>
                <Divider style={{ marginTop: 'var(--pf-t--global--spacer--xl)' }} />
                <Title headingLevel="h2" size="xl" style={{ marginTop: 'var(--pf-t--global--spacer--lg)' }}>
                  Issues under this epic ({stories.length})
                </Title>
                <Content style={{ marginTop: 'var(--pf-t--global--spacer--sm)' }}>
                  <p>Full detail for each child issue, including links parsed from descriptions and comments.</p>
                </Content>
                {stories.map(story => (
                  <IssueDetailCard
                    key={story.key}
                    issue={story}
                    browseBase={detail.jiraBrowseBase}
                    statusColorMap={statusColorMap}
                    headingPrefix="Child issue"
                    childIssueCard
                  />
                ))}
              </>
            ) : null}
          </>
        ) : null}
      </PageSection>
    </>
  );
};

export { EpicDetailPage };
