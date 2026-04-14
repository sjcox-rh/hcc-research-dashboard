import * as React from 'react';
import { Link } from 'react-router-dom';
import { Content, PageSection, Title } from '@patternfly/react-core';
import { useDocumentTitle } from '@app/utils/useDocumentTitle';

const tableShellStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 'var(--pf-t--global--FontSize--sm)',
  marginTop: 'var(--pf-t--global--spacer--md)',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  verticalAlign: 'top',
  padding: 'var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)',
  borderBottom: '1px solid var(--pf-t--global--border--color--200)',
  fontWeight: 'var(--pf-t--global--FontWeight--bold)',
  backgroundColor: 'var(--pf-t--global--background--color--secondary--default)',
  width: '28%',
};

const tdStyle: React.CSSProperties = {
  textAlign: 'left',
  verticalAlign: 'top',
  padding: 'var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md)',
  borderBottom: '1px solid var(--pf-t--global--border--color--200)',
};

const sectionGap: React.CSSProperties = {
  marginTop: 'var(--pf-t--global--spacer--2xl)',
};

const phaseTitleStyle: React.CSSProperties = {
  marginTop: 'var(--pf-t--global--spacer--lg)',
  marginBottom: 'var(--pf-t--global--spacer--sm)',
};

const ResearchProcess: React.FunctionComponent = () => {
  useDocumentTitle('Research Process | ConsolePuffs');

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <div style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
          <Link to="/" style={{ fontWeight: 'var(--pf-t--global--FontWeight--normal)' }}>
            ← Back to research board
          </Link>
        </div>
        <Title headingLevel="h1" size="2xl">
          Research process
        </Title>
        <Title headingLevel="h2" size="xl" style={{ ...sectionGap, marginTop: 'var(--pf-t--global--spacer--lg)' }}>
          The research workflow &amp; Jira integration
        </Title>
        <Content style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
          <p>
            To maintain transparency and track velocity, every research initiative follows a standardized lifecycle.
            Each stage corresponds to a milestone in our project tracking so no step—from budgeting to participant
            payment—is overlooked.
          </p>
        </Content>

        <Title headingLevel="h3" size="lg" style={phaseTitleStyle}>
          Phase 1: Definition &amp; alignment
        </Title>
        <ul style={{ margin: 0, paddingLeft: 'var(--pf-t--global--spacer--lg)' }}>
          <li style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
            <strong>Create research proposal:</strong> Define the &quot;why&quot;—goals, problem statement, and impact.
          </li>
          <li style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
            <strong>Stakeholder approval:</strong> Review the proposal with the product team so scope meets business
            needs.
          </li>
          <li style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
            <strong>Budget approval:</strong> Secure funding for participant incentives or specialized tools before
            moving to execution.
          </li>
        </ul>

        <Title headingLevel="h3" size="lg" style={phaseTitleStyle}>
          Phase 2: Preparation
        </Title>
        <ul style={{ margin: 0, paddingLeft: 'var(--pf-t--global--spacer--lg)' }}>
          <li style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
            <strong>Research plan:</strong> A detailed document covering methodology (e.g. usability testing,
            discovery interviews), target personas, and timeline.
          </li>
          <li style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
            <strong>Artifact development:</strong> Creating the tools of the trade, including:
            <ul style={{ marginTop: 'var(--pf-t--global--spacer--xs)' }}>
              <li>High-fidelity mocks or prototypes (Figma / PatternFly).</li>
              <li>Interview scripts and discussion guides.</li>
              <li>Surveys or unmoderated task lists.</li>
            </ul>
          </li>
        </ul>

        <Title headingLevel="h3" size="lg" style={phaseTitleStyle}>
          Phase 3: Execution
        </Title>
        <ul style={{ margin: 0, paddingLeft: 'var(--pf-t--global--spacer--lg)' }}>
          <li style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
            <strong>Recruitment:</strong> Sourcing participants that match Red Hat user personas.
          </li>
          <li style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
            <strong>Scheduling:</strong> Coordinating calendars between researchers, users, and optional stakeholder
            observers.
          </li>
          <li style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
            <strong>Fieldwork:</strong> Conducting interviews, focus groups, or contextual inquiries.
          </li>
        </ul>

        <Title headingLevel="h3" size="lg" style={phaseTitleStyle}>
          Phase 4: Synthesis &amp; closing
        </Title>
        <ul style={{ margin: 0, paddingLeft: 'var(--pf-t--global--spacer--lg)' }}>
          <li style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
            <strong>Analysis &amp; reporting:</strong> Synthesizing raw data into a summary report with actionable next
            steps.
          </li>
          <li style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
            <strong>Incentive processing:</strong> Paying participants promptly (closing the loop on budget).
          </li>
          <li style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
            <strong>Insight share-out:</strong> The final roadshow—presenting findings to the Console.dot team and
            broader stakeholders to drive design iterations.
          </li>
        </ul>

        <Title headingLevel="h2" size="xl" style={sectionGap}>
          Jira ticket requirements
        </Title>
        <Content style={{ marginTop: 'var(--pf-t--global--spacer--sm)' }}>
          <p>
            When creating a research issue in Jira, complete the following fields so the team can track progress:
          </p>
        </Content>
        <table style={tableShellStyle}>
          <thead>
            <tr>
              <th scope="col" style={thStyle}>
                Field
              </th>
              <th scope="col" style={{ ...thStyle, width: 'auto' }}>
                Requirement
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>
                <strong>Epic link</strong>
              </td>
              <td style={tdStyle}>Related product feature or initiative</td>
            </tr>
            <tr>
              <td style={tdStyle}>
                <strong>Research type</strong>
              </td>
              <td style={tdStyle}>Generative, formative, or evaluative</td>
            </tr>
            <tr>
              <td style={tdStyle}>
                <strong>Status</strong>
              </td>
              <td style={tdStyle}>Current phase (e.g. recruiting, analyzing)</td>
            </tr>
            <tr>
              <td style={tdStyle}>
                <strong>Artifact link</strong>
              </td>
              <td style={tdStyle}>Link to the research folder, Mural, Figma, etc.</td>
            </tr>
            <tr>
              <td style={tdStyle}>
                <strong>Stakeholders</strong>
              </td>
              <td style={tdStyle}>Tagged designers and PMs</td>
            </tr>
          </tbody>
        </table>

        

        
      </PageSection>
    </>
  );
};

export { ResearchProcess };
