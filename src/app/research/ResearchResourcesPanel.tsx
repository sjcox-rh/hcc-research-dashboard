import * as React from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle, Content, Title } from '@patternfly/react-core';
import type { ResearchIssue } from '@app/research/types';
import {
  buildAggregatedStoryResources,
  webLinkSourceNote,
  type AggregatedAttachment,
  type AggregatedWebLink,
} from '@app/research/aggregateStoryResources';

export type ResearchResourcesPanelProps = {
  stories: ResearchIssue[];
  /** Card heading (default: Resources). */
  title?: string;
  intro: string;
};

const listItemMetaStyle: React.CSSProperties = {
  fontSize: 'var(--pf-t--global--FontSize--sm)',
  color: 'var(--pf-t--global--text--color--subtle)',
  marginTop: 2,
};

function LinksSection({ rows }: { rows: AggregatedWebLink[] }) {
  if (rows.length === 0) return null;
  return (
    <Content style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
      <Title headingLevel="h4" size="md">
        Links
      </Title>
      <ul style={{ margin: 'var(--pf-t--global--spacer--sm) 0 0', paddingLeft: 'var(--pf-t--global--spacer--lg)' }}>
        {rows.map(row => (
          <li key={row.url} style={{ marginBottom: 'var(--pf-t--global--spacer--sm)' }}>
            <Button variant="link" component="a" href={row.url} target="_blank" rel="noopener noreferrer" isInline>
              {row.label}
            </Button>
            <div style={listItemMetaStyle}>
              {webLinkSourceNote(row)}
              {row.sourceKeys.length > 0 ? ` · ${row.sourceKeys.join(', ')}` : null}
            </div>
          </li>
        ))}
      </ul>
    </Content>
  );
}

function AttachmentsSection({ rows }: { rows: AggregatedAttachment[] }) {
  if (rows.length === 0) return null;
  return (
    <Content style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
      <Title headingLevel="h4" size="md">
        Attachments
      </Title>
      <ul style={{ margin: 'var(--pf-t--global--spacer--sm) 0 0', paddingLeft: 'var(--pf-t--global--spacer--lg)' }}>
        {rows.map(row => (
          <li key={row.url} style={{ marginBottom: 'var(--pf-t--global--spacer--sm)' }}>
            <Button variant="link" component="a" href={row.url} target="_blank" rel="noopener noreferrer" isInline>
              {row.filename}
            </Button>
            {row.sourceKeys.length > 0 ? <div style={listItemMetaStyle}>{row.sourceKeys.join(', ')}</div> : null}
          </li>
        ))}
      </ul>
    </Content>
  );
}

export const ResearchResourcesPanel: React.FunctionComponent<ResearchResourcesPanelProps> = ({
  stories,
  title = 'Resources',
  intro,
}) => {
  const { webLinks, attachments } = React.useMemo(() => buildAggregatedStoryResources(stories), [stories]);
  if (webLinks.length === 0 && attachments.length === 0) return null;

  return (
    <Card isFullHeight style={{ marginBottom: 'var(--pf-t--global--spacer--lg)' }}>
      <CardHeader>
        <CardTitle>
          <Title headingLevel="h3" size="lg" style={{ margin: 0 }}>
            {title}
          </Title>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <Content style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
          <p style={{ margin: 0 }}>{intro}</p>
        </Content>
        <LinksSection rows={webLinks} />
        <AttachmentsSection rows={attachments} />
      </CardBody>
    </Card>
  );
};
