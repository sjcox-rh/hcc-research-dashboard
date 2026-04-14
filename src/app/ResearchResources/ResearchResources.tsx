import * as React from 'react';
import { Link } from 'react-router-dom';
import { Alert, Content, PageSection, Spinner, Title } from '@patternfly/react-core';
import { fetchEpicDetail } from '@app/research/fetchEpicDetail';
import { fetchResearchIssues } from '@app/research/fetchResearchIssues';
import { ResearchResourcesPanel } from '@app/research/ResearchResourcesPanel';
import type { EpicDetailResponse, ResearchIssue } from '@app/research/types';
import { useDocumentTitle } from '@app/utils/useDocumentTitle';

function isEpicIssue(issue: ResearchIssue): boolean {
  return (issue.issueType || '').trim().toLowerCase() === 'epic';
}

/** Epic keys and solo issue keys to load full detail (comments, attachments) for resource aggregation. */
function detailKeysFromBoardIssues(issues: ResearchIssue[]): string[] {
  const set = new Set<string>();
  for (const i of issues) {
    if (isEpicIssue(i)) set.add(i.key);
    if (i.parentKey) set.add(i.parentKey);
    if (!isEpicIssue(i) && !i.parentKey) set.add(i.key);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Same scope as epic detail "Resources": child issues under an epic. For solo issues (no parent), use the
 * root issue from detail when there are no child rows (matches per-issue detail behavior).
 */
function storiesForResourceMerge(detail: EpicDetailResponse): ResearchIssue[] {
  const stories = detail.stories ?? [];
  if (stories.length > 0) return stories;
  if (detail.rootIssue && !detail.epic) return [detail.rootIssue];
  return [];
}

function dedupeStoriesByKey(stories: ResearchIssue[]): ResearchIssue[] {
  const map = new Map<string, ResearchIssue>();
  for (const s of stories) {
    if (!map.has(s.key)) map.set(s.key, s);
  }
  return Array.from(map.values());
}

const ResearchResources: React.FunctionComponent = () => {
  useDocumentTitle('Research Resources | ConsolePuffs');

  const [phase, setPhase] = React.useState<'idle' | 'board' | 'epics' | 'done'>('idle');
  const [error, setError] = React.useState<string | null>(null);
  const [mergedStories, setMergedStories] = React.useState<ResearchIssue[]>([]);
  const [epicCount, setEpicCount] = React.useState(0);
  const [keysLoaded, setKeysLoaded] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setPhase('board');
    setError(null);
    setMergedStories([]);
    setEpicCount(0);
    setKeysLoaded(0);

    fetchResearchIssues()
      .then(async board => {
        if (cancelled) return;
        const issues = Array.isArray(board.issues) ? board.issues : [];
        const keys = detailKeysFromBoardIssues(issues);
        setEpicCount(keys.length);
        if (keys.length === 0) {
          setPhase('done');
          return;
        }
        setPhase('epics');
        const collected: ResearchIssue[] = [];
        for (let i = 0; i < keys.length; i += 1) {
          if (cancelled) return;
          const key = keys[i];
          try {
            const detail = await fetchEpicDetail(key);
            collected.push(...storiesForResourceMerge(detail));
          } catch {
            /* skip keys that fail (permissions, deleted, etc.) */
          }
          setKeysLoaded(i + 1);
        }
        if (cancelled) return;
        setMergedStories(dedupeStoriesByKey(collected));
        setPhase('done');
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load research data');
          setPhase('done');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loading = phase === 'board' || phase === 'epics';
  const loadingDetail = phase === 'epics';

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <div style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
          <Link to="/" style={{ fontWeight: 'var(--pf-t--global--FontWeight--normal)' }}>
            ← Back to research board
          </Link>
        </div>
        <Title headingLevel="h1" size="2xl">
          Research Resources
        </Title>
        <Content style={{ marginTop: 'var(--pf-t--global--spacer--sm)' }}>
          <p>
            Aggregated links and attachments from issue descriptions and comments — the same data shown under
            Resources on each epic detail page, combined across the research board.
          </p>
        </Content>
      </PageSection>

      <PageSection>
        {error ? (
          <Alert variant="danger" title="Could not load resources">
            <p>{error}</p>
          </Alert>
        ) : null}

        {loading ? (
          <div style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
            <Spinner
              aria-label={
                loadingDetail
                  ? `Loading epic details (${keysLoaded} of ${epicCount})`
                  : 'Loading research board from Jira'
              }
            />
            {loadingDetail && epicCount > 0 ? (
              <Content style={{ marginTop: 'var(--pf-t--global--spacer--sm)' }}>
                <p>
                  Loading issues for resource links… {keysLoaded} / {epicCount} epic
                  {epicCount === 1 ? '' : 's'} / keys
                </p>
              </Content>
            ) : null}
          </div>
        ) : null}

        {!loading && !error && mergedStories.length === 0 ? (
          <Content style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
            <p>No links or attachments were found on child issues for the current board.</p>
          </Content>
        ) : null}

        {!loading && !error && mergedStories.length > 0 ? (
          <ResearchResourcesPanel
            stories={mergedStories}
            title="Resources"
            intro="Links and attachments from descriptions and comments on issues under the research board (same aggregation as epic detail pages)."
          />
        ) : null}
      </PageSection>
    </>
  );
};

export { ResearchResources };
