# HCC Research Dashboard

A PatternFly-based web app for the Hybrid Cloud Console (HCC) UX team. Built on [patternfly-react-seed](https://github.com/patternfly/patternfly-react-seed).

## Quick-start

```bash
git clone https://github.com/sjcox-rh/hcc-research-dashboard.git
cd hcc-research-dashboard
npm install && npm run start:dev
```

## Development scripts

```sh
npm install            # Install dependencies
npm run start:dev      # Start the development server
npm run build          # Production build (outputs to "dist")
npm run test           # Run the test suite
npm run test:coverage  # Run tests with coverage
npm run lint           # Run the linter
npm run format         # Run the code formatter
npm run start          # Start the express server (run build first)
```

---

## Cursor Skills

This repo includes Cursor AI skills in `.cursor/skills/` that automate common HCC team workflows. Anyone who clones this repo gets them automatically.

### Jira Research Story Creator

**Location:** `.cursor/skills/jira-research-story-templates/`

Automates creating the nine standard UX research stories in Jira (CPUX project) for the HCC team. Instead of manually creating each ticket, just tell Cursor to create them and the skill handles the rest.

#### What it does

When you ask Cursor to create research stories, it will:

1. Create all **nine canonical research stories** in the correct order under a parent epic:

   | # | Story | Default Points |
   |---|-------|----------------|
   | 1 | Create a research proposal and get approved | 3 |
   | 2 | Create a research plan | 5 |
   | 3 | Create research artifacts (prototype, mocks, script, etc.) | 5 |
   | 4 | Get budget approved | 1 |
   | 5 | Recruit users | 3 |
   | 6 | Run research interviews | 2 |
   | 7 | Analyze data and create summary report | 5 |
   | 8 | Pay users | 1 |
   | 9 | Share out research findings with stakeholders | 2 |

2. Automatically set on each story:
   - **HCC label** and **HCC component**
   - **Story points** and **Activity Type** per the table above
   - **Description** with What + Problem Statement sections
   - **Acceptance Criteria** in the dedicated Jira field (`customfield_10718`)
   - **Refinement** status
   - Stories go to the **backlog** by default (no sprint assignment)

#### How to use it

**Standalone** — create research stories under an existing epic:
> "Create the nine research stories under CPUX-1234"

**Bundled with epic creation** — create a research epic and stories together (uses the [hcc-epic-creator](.cursor/skills/hcc-epic-creator/) skill):
> "Create a research epic for dashboard usability testing"

The skill detects the word "research" in the epic name and automatically creates all nine child stories after the epic is created.

#### Prerequisites

- **Atlassian MCP** must be connected in Cursor (Settings → Tools & MCP)
- The MCP connects to `redhat.atlassian.net`, project `CPUX`

### HCC Epic Creator

**Location:** `.cursor/skills/hcc-epic-creator/`

Creates standardized UXD Epic tickets with problem statements, Definition of Done, suggested stories, labels, and components. When the epic summary includes "research," it automatically chains into the research story creator above.

#### How to use it

> "Create a Jira epic for [topic]"

The skill walks through gathering details, writing the problem statement, selecting the appropriate label, and creating the epic with all required fields.

### Archie — UX Research Knowledge Retrieval

**Location:** `.cursor/skills/archie/`

Retrieves data from past UX research reports stored on Google Drive. Ask questions about what the team knows from prior research studies and Archie pulls findings directly from the source artifacts.

#### How to use it

> "What do we know about onboarding friction from our UX research?"

> "Pull findings about enterprise admins from last year's research"

#### Prerequisites

- **Google Workspace MCP** must be configured (see [taylorwilsdon/google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp))
- **Dataverse MCP** (optional) for live UXR team roster queries

---

## Adding a skill to your Cursor

If someone shares a skill file with you:

1. Save the `SKILL.md` (and any companion files) into a named folder under `~/.cursor/skills/` for user-level access, or `<project>/.cursor/skills/` for project-level access.
2. Cursor auto-discovers skills in those directories — no restart needed.

Example:
```
~/.cursor/skills/jira-research-story-templates/SKILL.md
```

---

## Configurations

* [TypeScript Config](./tsconfig.json)
* [Webpack Config](./webpack.common.js)
* [Jest Config](./jest.config.js)
* [Editor Config](./.editorconfig)
