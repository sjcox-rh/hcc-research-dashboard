---
name: jira-research-story-templates
description: Drafts Jira Story tickets for UX research workflows and creates them in Atlassian Jira via MCP when connected. Applies the HCC Jira label, HCC component, default story points, and Refinement status (overridable). When a new CPUX epic whose summary includes research is created via hcc-epic-creator, creates all nine standard research stories under that epic automatically. Use when creating research stories, breaking down a research epic, planning recruitment or interviews, or when the user mentions research proposals, research plans, artifacts, budget, participant payment, sharing findings in Jira, or asks to file/create tickets in Jira.
---

# Jira research story templates

Use these templates when the user wants **research-process stories** in Jira (as children of a research epic or standalone). Adapt wording to their project, audience, and compliance rules.

## When to use

- User asks for research story breakdown, backlog items, copy-paste Jira text, or **to create the stories in Jira**
- Pair with [hcc-epic-creator](../hcc-epic-creator/SKILL.md) for CPUX epics: these are the **child story patterns** for the research track
- **Chained from epic creation:** [hcc-epic-creator](../hcc-epic-creator/SKILL.md) Step 7a — right after a **research** epic exists, create all nine stories under it (no separate ask)

## Bundled with new research epic (hcc-epic-creator)

When [hcc-epic-creator](../hcc-epic-creator/SKILL.md) just created an epic and Step **7a** applies (epic **summary** matches `/research/i`):

1. **Parent** is the **new epic issue key**; do not ask for a different parent unless the user corrects you.
2. **No second approval** for the nine stories: the epic draft already listed titles, points, and auto-create intent. Proceed to `createJiraIssue` for all nine in canonical order (unless the user opted out of child stories before epic create).
3. **Assignee:** use the **epic assignee** for each story when set; otherwise omit `assignee_account_id`.
4. Still apply: HCC label, default SP column, per-story activity type from the canonical table, component HCC (and Subscriptions if the epic used it), **no sprint** (backlog by default), **Refinement** status, full descriptions from the per-story templates below.

## Creating stories in Jira (Atlassian MCP)

When the user wants tickets **created in Jira** (not only drafted), use the **Atlassian MCP** tools (e.g. `createJiraIssue`, `searchJiraIssuesUsingJql`, `lookupJiraAccountId`). If MCP is not available, say so and fall back to copy-paste output only.

### Prerequisites

- **Cloud ID:** `redhat.atlassian.net`
- **Project key:** `CPUX`
- **Issue type:** `Story`
- **Parent epic:** Ask for the **epic issue key** (e.g. `CPUX-12345`) to set `parent`, **unless** you are in the **bundled research epic** flow — then use the key returned from epic creation. If the user has no epic yet, offer to create one via [hcc-epic-creator](../hcc-epic-creator/SKILL.md) first, or create stories without `parent` only if they explicitly want unparented stories.

### Field reference (align with HCC)

Use the same IDs as [hcc-epic-creator](../hcc-epic-creator/SKILL.md):

| Field | Key / notes |
|-------|-------------|
| Label **HCC** | `labels`: `["HCC"]` — **always** set on create for these research stories (Jira label, separate from the HCC component) |
| Component HCC | `components`: `[{"id": "68524"}]` |
| Component Subscriptions | Add `{"id": "68527"}` when the epic skill’s Subscriptions rules apply |
| Activity Type | `customfield_10464`: `{"id": "<option-id>"}` — use the **per-story activity type** from the canonical story table below; override only if the user or epic dictates otherwise |
| Story Points | `customfield_10028`: use **default points from the canonical story table** below; override only if the user asks before or after creation (edits in Jira are fine) |
| Acceptance Criteria | `customfield_10718`: Textarea (markdown) — checklist from per-story "Definition of Done" templates; set via `additional_fields` |
| Sprint | Do **not** set `customfield_10020` — research stories go to the **backlog** by default (no sprint assignment). Only assign a sprint if the user explicitly requests it. |

### Status: Refinement

After each story is created (and **after** sprint or other fields are applied, if those steps change status), it must be in the **Refinement** workflow status (match the **exact** status name shown in CPUX if it differs slightly, e.g. capitalization).

1. If the create/update response or a quick fetch shows status **Refinement**, stop.
2. If not, use **Atlassian MCP** to list available transitions for that issue and **transition** it to **Refinement** (or the project’s equivalent status the team treats as “needs refinement”).

Do not leave new research stories in In Progress, Done, or other columns unless the user explicitly asks.

### Description shape in Jira

Use `contentFormat: "markdown"`. For each story, set `description` to **only** the What and Problem Statement sections:

```markdown
### What

[What section from the per-story template.]

### Problem Statement

[Problem Statement section from the per-story template.]
```

Set the **Acceptance Criteria** field (`customfield_10718`) to the checklist items from the per-story template (markdown format, no heading needed — the field label serves as the heading). Example:

    - [ ] First acceptance criterion
    - [ ] Second acceptance criterion

Optionally add a **Dependencies** line under What in the description (e.g. “Blocked by: CPUX-nnn”) if the user wants linked work; use `createIssueLink` with types from hcc-epic-creator when they ask for explicit links.

### Workflow

**Standalone** (user asked for research stories only, or epic already existed):

```
Jira creation progress:
- [ ] Confirm Atlassian MCP is usable
- [ ] Collect parent epic key (or confirm unparented)
- [ ] Collect assignee (lookup account id if needed) or leave unset per user
- [ ] Draft all stories (summary + full markdown description + **default story points** + activity type + **HCC** label + **no sprint / backlog**)
- [ ] User approves the draft list
- [ ] createJiraIssue for each story in canonical order
- [ ] For each new issue, confirm status is **Refinement**; transition via MCP if needed
```

**Bundled** (hcc-epic-creator Step 7a — research epic just created):

```
Jira creation progress:
- [ ] Confirm Atlassian MCP is usable
- [ ] Parent = new epic key; assignee = epic assignee when set
- [ ] Build full descriptions for all nine stories from per-story templates (no separate story-list approval; no sprint — backlog by default)
- [ ] createJiraIssue for each story in canonical order
- [ ] For each new issue, confirm status is **Refinement**; transition via MCP if needed
```

### createJiraIssue payload (per story)

Mirror [hcc-epic-creator](../hcc-epic-creator/SKILL.md) Step 7. Always include **`labels`: `["HCC"]`**, **`customfield_10028`** from the **Default SP** column, and **`customfield_10464`** from the **Activity Type** column of the canonical table. Example shape:

```json
{
  "cloudId": "redhat.atlassian.net",
  "projectKey": "CPUX",
  "issueTypeName": "Story",
  "summary": "<title from canonical story set>",
  "description": "<markdown from Description shape above>",
  "parent": "<EPIC-KEY>",
  "assignee_account_id": "<optional>",
  "contentFormat": "markdown",
  "additional_fields": {
    "labels": ["HCC"],
    "components": [{"id": "68524"}],
    "customfield_10464": {"id": "<activity-type-option-id from canonical table>"},
    "customfield_10028": 3,
    "customfield_10718": "<acceptance criteria markdown from per-story template>"
  }
}
```

Omit `parent` if creating unparented stories. Omit `assignee_account_id` if unknown and user did not specify. Do **not** include `customfield_10020` (sprint) — stories go to the backlog by default. Only add a sprint if the user explicitly requests it.

If merging with other labels (e.g. problem-statement labels from an epic), **keep** `HCC` in the array and add the rest: `["HCC", "other-label"]`.

After creation, reply with the list of new **issue keys**, links, and confirm each is in **Refinement** (or note if transition failed and why).

## Canonical story set (user’s process)

Keep this **order** as the default backbone; split or merge stories if the team’s workflow differs.

**On Jira create:** every row uses **label** `HCC`, **default story points** in `customfield_10028`, and the **activity type** in `customfield_10464` (team may change values in Jira anytime).

| # | Story title (Summary field) | Default SP | Activity Type (option ID) |
|---|----------------------------|------------|--------------------------|
| 1 | Create a research proposal and get approved | 3 | Make (`10319`) |
| 2 | Create a research plan | 5 | Make (`10319`) |
| 3 | Create research artifacts (prototype, mocks, script, etc.) | 5 | Make (`10319`) |
| 4 | Get budget approved | 1 | Enable (`10315`) |
| 5 | Recruit users | 3 | Enable (`10315`) |
| 6 | Run research interviews | 5 | Monitor (`10320`) |
| 7 | Analyze data and create summary report | 5 | Make (`10319`) |
| 8 | Pay users | 1 | Enable (`10315`) |
| 9 | Share out research findings with stakeholders | 2 | Enable (`10315`) |

**Dependencies (typical):** 1 → 2 → 3; 4 often follows 1 or runs in parallel with 2–3; 5 after plan/artifacts are ready; 6 after 5; 7 after 6; 8 after 6 (or per policy); 9 after 7 (and often after 8 if payment is a gate).

## Per-story template

For each story, output (or create in Jira) with:

- **Summary**: exact title from the table (adjust only if the user’s naming convention requires it)
- **Labels**: `HCC` on create (always); add others only if the user requests
- **Story points**: default from the **Default SP** column; use user-provided values if they override when approving the draft
- **Description** (`description` field): `### What` + `### Problem Statement` only — context, scope, links to docs/Figma/prototype, **owner**, **reviewers/approvers** if known
- **Acceptance Criteria** (`customfield_10718` field): checklist items from the template below — testable, past tense where helpful; no heading needed in the field value

### 1. Create a research proposal and get approved

**Description** (`description` field):

### What
Draft a formal research proposal outlining the core goals, methodology, and target audience for this study, and secure alignment from product and design leadership.

### Problem Statement
Without a clear, approved research proposal, the team risks executing a study that lacks strategic alignment, potentially wasting time and resources on answering the wrong user experience questions.

**Acceptance Criteria** (`customfield_10718`):

- [ ] Research goals, questions, and hypotheses are clearly defined.
- [ ] Methodology (e.g., qualitative interviews, usability testing) is selected and justified.
- [ ] Target user personas/demographics are specified.
- [ ] Proposal is reviewed and formally approved by stakeholders/leadership.

### 2. Create a research plan

**Description** (`description` field):

### What
Develop a detailed research plan that operationalizes the approved proposal, mapping out the logistics, timelines, and specific step-by-step approach.

### Problem Statement
Without a granular research plan, the execution of the study could become disorganized, leading to missed deadlines, inconsistent data collection, and logistical bottlenecks.

**Acceptance Criteria** (`customfield_10718`):

- [ ] Timeline with specific milestones (recruitment, sessions, analysis) is finalized.
- [ ] Logistics (tools needed, team roles, scheduling links) are set up.
- [ ] Stakeholders have reviewed and agreed to the timeline and resource allocation.

### 3. Create research artifacts (prototype, mocks, script, etc.)

**Description** (`description` field):

### What
Build and prepare all necessary materials required to facilitate the research sessions, including interview guides, interactive prototypes, or UI mocks.

### Problem Statement
If research artifacts are poorly prepared or lack realism, users may struggle to provide authentic feedback, compromising the validity of the research insights.

**Acceptance Criteria** (`customfield_10718`):

- [ ] Interview script/discussion guide is drafted, reviewed, and finalized.
- [ ] Prototypes or design mocks are built and verified to be fully functional for the test scenarios.
- [ ] A dry-run/pilot session is conducted to test the artifacts and timing.

### 4. Get budget approved

**Description** (`description` field):

### What
Calculate the total estimated cost for user incentives and recruiting tools, and secure financial approval from the budget owner.

### Problem Statement
Without early and explicit budget approval, the team cannot legally or ethically recruit external participants, completely halting the research momentum.

**Acceptance Criteria** (`customfield_10718`):

- [ ] Total cost for incentives and recruitment platform fees is calculated.
- [ ] Expense request is submitted through the proper internal channels.
- [ ] Formal financial sign-off is received from the budget owner or finance team.

### 5. Recruit users

**Description** (`description` field):

### What
Source, screen, and schedule qualified participants who match the target criteria defined in the research proposal.

### Problem Statement
If the recruitment process is rushed or untargeted, we risk interviewing the wrong users, leading to data that does not accurately reflect our actual user base or problem space.

**Acceptance Criteria** (`customfield_10718`):

- [ ] Participant screener survey is created and distributed.
- [ ] Responses are vetted to match target user criteria.
- [ ] Right number of participants (plus backables) are formally scheduled and confirmed.

### 6. Run research interviews

**Description** (`description` field):

### What
Execute the research sessions with the scheduled participants, capturing raw qualitative and quantitative data using the finalized artifacts.

### Problem Statement
If interviews are not conducted neutrally or recorded properly, critical user pain points might be missed or misinterpreted, leading to skewed conclusions.

**Acceptance Criteria** (`customfield_10718`):

- [ ] All scheduled interview sessions are completed.
- [ ] Sessions are recorded (video/audio) with participant consent.
- [ ] High-level notes/transcripts are captured for each session.

### 7. Analyze data and create summary report

**Description** (`description` field):

### What
Synthesize the raw qualitative data from the interviews (using affinity mapping, coding, etc.) into actionable themes, insights, and a comprehensive summary report.

### Problem Statement
Raw data is overwhelming and un-actionable; without deep synthesis, product teams cannot easily digest the findings or transform them into concrete UX improvements.

**Acceptance Criteria** (`customfield_10718`):

- [ ] Raw interview data is synthesized (e.g., via affinity mapping or thematic analysis).
- [ ] Core insights, user pain points, and design recommendations are defined.
- [ ] A shareable summary report or presentation deck is finalized.

### 8. Pay users

**Description** (`description` field):

### What
Distribute the agreed-upon incentives/stipends to all participants who successfully completed the research sessions.

### Problem Statement
Delayed or failed incentive payments damage our brand’s reputation, violate participant trust, and make it difficult to recruit users for future research initiatives.

**Acceptance Criteria** (`customfield_10718`):

- [ ] Attendance is verified against the interview schedule.
- [ ] Incentives (e.g., gift cards, cash transfers) are issued to all valid participants.
- [ ] Delivery and receipt of payments are tracked and documented for accounting.

### 9. Share out research findings with stakeholders

**Description** (`description` field):

### What
Present the final research insights and report to product, engineering, and design stakeholders to drive evidence-based product decisions.

### Problem Statement
If research findings are not actively socialized and discussed, the insights will sit idle, and the product team may continue to build features based on assumptions rather than user data.

**Acceptance Criteria** (`customfield_10718`):

- [ ] A share-out meeting/presentation is scheduled and attended by key stakeholders.
- [ ] Findings and actionable next steps are presented and discussed.
- [ ] Artifacts (deck, recording, report link) are archived in a central, accessible repository (e.g., Confluence, Notion).

## Output format for the user

When asked for “the stories,” reply with a compact list first (titles only), then offer to expand any story into full Description + Acceptance criteria using the templates above.

If the user asked to **create in Jira** in a **standalone** flow, do not call `createJiraIssue` until they **approve** the full draft (summaries, descriptions, points, parent epic). Then create issues in canonical order and report keys.

If stories are created in the **bundled research epic** flow, the epic approval already covered the bundle — create all nine immediately after the epic exists and report epic key + all child keys.

## Optional: Jira copy-paste block

```markdown
h2. Context
[1–2 sentences]

h2. Scope
- 

h2. Links
- 

h2. Acceptance criteria
* [ ] 
* [ ] 
```

Use `h2.` / `*` only if the team uses Jira wiki markup; otherwise use plain markdown in the description field.

## Additional resources

- For HCC epic creation, research epic detection (`/research/i`), and Step 7a chaining, see [hcc-epic-creator](../hcc-epic-creator/SKILL.md).
