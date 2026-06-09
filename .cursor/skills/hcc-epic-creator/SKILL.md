---
name: hcc-epic-creator
description: Create standardized UXD Epic tickets in Atlassian Jira for the HCC sprints board (CPUX project). Generates epics with problem statements, definition of done, suggested stories, labels, and components. When the epic summary includes the word research, automatically creates the nine standard HCC research child stories under that epic. Use when the user asks to create a Jira epic, write an epic ticket, plan sprint work, or break down UX work into stories for HCC.
---

# HCC Epic Creator

Create standardized UXD Epic tickets in Jira for the HCC team on the CPUX board. This skill handles the full workflow: gathering context, writing the problem statement, drafting the Definition of Done, and generating child stories. If the epic name includes **research** (case-insensitive), it also triggers the nine standard research stories under that epic via [jira-research-story-templates](../jira-research-story-templates/SKILL.md).

## Prerequisites

- Atlassian MCP must be connected
- Cloud ID: `redhat.atlassian.net`
- Project key: `CPUX`

## Jira Field Reference

### Components
| Name | ID |
|------|-----|
| HCC | `68524` |
| Subscriptions | `68527` |

### Custom Fields
| Field | Key | Type | Notes |
|-------|-----|------|-------|
| Activity Type | `customfield_10464` | Select option | See option IDs below |
| Story Points | `customfield_10028` | Number | 1, 2, 3, 5, 8, 13 |
| Sprint | `customfield_10020` | Number (sprint ID) | Use plain integer, not object |
| Parent Link | `customfield_10018` | String (issue key) | For epics under Features |
| Contributors | `customfield_10466` | Multi-user picker | Array of account IDs |

### Activity Type Option IDs
| Value | Option ID |
|-------|-----------|
| Enable | `10315` |
| Consult | `10316` |
| Orient | `10317` |
| Explore | `10318` |
| Make | `10319` |
| Monitor | `10320` |

### Issue Link Types
| Name | ID | Use |
|------|----|-----|
| Related | `10077` | General relationship |
| Blocks | `10000` | Dependency |
| Depend | `10076` | Dependency |
| Triggers | `10082` | Causal relationship |

### HCC Board
- Board ID: `6195`
- Sprint naming pattern: `HCC Sprint N YYYY`
- To find the active sprint, search: `project = CPUX AND sprint in openSprints() AND component = HCC`

## Workflow

```
Epic Creation Progress:
- [ ] Step 1: Gather epic details from user
- [ ] Step 2: Check for parent / linked tickets
- [ ] Step 3: Determine problem statement label
- [ ] Step 4: Write epic description (What + Problem Statement + Definition of Done)
- [ ] Step 5: Determine components, activity type, and story points
- [ ] Step 6: Create the epic in Jira
- [ ] Step 7: Generate and create child stories with sprint assignment — OR, if research epic (see Step 7a), auto-create the nine research stories via jira-research-story-templates
```

### Step 1: Gather Epic Details

Ask the user for:

1. **Epic name** — a short, descriptive name for the epic
2. **What is this epic about?** — the objective and expected deliverables
3. **Who is the target user?** — the user persona affected
4. **What is the problem?** — the specific issue or opportunity
5. **Do you have supporting data or evidence?** — analytics, research, user feedback, support tickets, competitive analysis, etc. If yes, collect source and metrics. If no, ask what the assumption is based on.
6. **What is the desired outcome / goal?** — what success looks like
7. **Who is the assignee?** — default to reporter/creator. Ask if there are additional contributors.

### Step 2: Check for Parent / Linked Tickets

Ask the user:
- **"Is there a parent Feature ticket (or another epic/story) on the PM side that this epic should be linked to?"**

If **yes — it's a Feature ticket**: set it as the epic's parent using the `parent` field during creation. Feature tickets sit above epics in the Jira hierarchy.

If **yes — it's another epic or story** (not a Feature): use `createIssueLink` after epic creation to link them. Use "Related" (`10077`) as the default link type, or "Depend" (`10076`) if there's a dependency.

If **no**: proceed without parent or links.

### Step 3: Determine Problem Statement Label

Based on the user's answers in Step 1, select **one** label:

| Label | When to use |
|-------|-------------|
| `problem-statement-uxd-data-driven` | Evidence from UX research: usability testing, surveys, user interviews, PWDR |
| `problem-statement-data-driven` | Evidence from non-UX sources: engineering metrics, PM analytics, support tickets, competitive analysis |
| `problem-statement-assumption` | No validated data; based on anecdotal feedback, team observations, hypotheses |
| `problem-statement-undefined` | No problem statement needed (rare edge case) |

**Present your recommendation with reasoning.** Let the user override if needed.

### Step 4: Write the Epic Description

Use markdown `contentFormat`. Structure:

**If data-driven** (`uxd-data-driven` or `data-driven`):

```
### What

[Describe the objective. What deliverable will be produced?]

### Problem Statement

[Target User] struggles with [specific issue]. Data from [source] shows [specific metrics]. This impacts [user goal/business goal].

### Definition of Done

This Epic should be Closed once the following criteria are met:

- The primary deliverable or artifact is attached or linked to this epic.
- The primary deliverable of this epic has been reviewed by stakeholders.
- All child tasks or stories within this epic have been closed or transferred to a follow-up epic. If a follow-up epic is created, a link to it has been added to this epic.
- If follow-up development work is needed, a link to it has been added to this epic.
- [Include any other criteria specific to this epic]
```

**If assumption-based**:

```
### What

[Describe the objective. What deliverable will be produced?]

### Problem Statement

We assume that [target user] experiences [specific issue] due to [reason]. This assumption is based on [source, e.g., limited feedback, prior knowledge].

### Definition of Done

(same structure as above)
```

For DoD tailoring, reference existing HCC epics: `project = CPUX AND issuetype = Epic AND component = HCC ORDER BY created DESC`

### Step 5: Determine Components, Activity Type, and Story Points

**Components**: Always include HCC (`68524`). Add Subscriptions (`68527`) if the topic matches: subscription, usage, billing, cloud integration, cost management, bundle, entitlement, renewal, committed spend, marketplace, pricing, license, quota, threshold, overage, on-demand.

**Activity Type** (`customfield_10464`):

| Phase | Option ID | Use when... |
|-------|-----------|-------------|
| Orient | `10317` | Early-stage opportunity identification, problem discovery, strategic planning |
| Explore | `10318` | Generating ideas, ideation, journey maps, user research, concept work |
| Make | `10319` | Finalizing design, prototyping, testing, iterating, detailed specs |
| Monitor | `10320` | Measuring outcomes, analytics review, post-launch evaluation |
| Enable | `10315` | Internal UXD team improvements, process changes, documentation |
| Consult | `10316` | Reactive work prompted by an external team, quick reviews |

**Story Points** (`customfield_10028`):

| Points | Definition |
|--------|------------|
| 1 | Extremely straightforward, very low effort, no risk |
| 2 | Straightforward, little risk, little investigation |
| 3 | Can be time consuming but fairly straightforward, some minor risks |
| 5 | Requires investigation, discussions, collaboration. Time consuming or complex |
| 8 | Big task, requires investigation + collaboration. Challenging solution. High risk |
| 13 | Too big — should be split into smaller epics |

### Step 6: Create the Epic in Jira

```json
{
  "cloudId": "redhat.atlassian.net",
  "projectKey": "CPUX",
  "issueTypeName": "Epic",
  "summary": "[UXD EPIC] <Epic Name>",
  "description": "<full markdown description from Step 4>",
  "assignee_account_id": "<looked up via lookupJiraAccountId>",
  "contentFormat": "markdown",
  "additional_fields": {
    "labels": ["<selected-problem-statement-label>"],
    "components": [{"id": "68524"}],
    "customfield_10464": {"id": "<activity-type-option-id>"},
    "customfield_10028": <story-points-number>
  }
}
```

If Subscriptions component is needed, add `{"id": "68527"}` to the components array.

If a **parent Feature** ticket exists, add: `"parent": "<FEATURE-KEY>"` at the top level of the createJiraIssue call.

If a **related epic/story** needs linking (not a Feature), use `createIssueLink` after creation:
```json
{
  "cloudId": "redhat.atlassian.net",
  "inwardIssue": "<RELATED-TICKET-KEY>",
  "outwardIssue": "<NEW-EPIC-KEY>",
  "type": "Related"
}
```

### Step 7: Generate Child Stories

Before creating stories, **find the active HCC sprint**:
```
searchJiraIssuesUsingJql: project = CPUX AND sprint in openSprints() AND component = HCC
```
Extract the sprint ID from `customfield_10020[0].id` in any result.

#### Step 7a: Research epic — automatic nine-story bundle

A **research epic** is one whose **summary** matches **`/research/i`** (case-insensitive), including the `[UXD EPIC]` prefix and epic name — e.g. `[UXD EPIC] Billing flow research` matches.

1. **Before Step 6** (in the same epic draft you already show for approval): list the **nine canonical research story titles and default story points** from [jira-research-story-templates](../jira-research-story-templates/SKILL.md), and state they will be **created automatically under this epic immediately after the epic exists**. If the user opts out (“no child stories”, “epic only”), skip Step 7a entirely after Step 6.
2. **After Step 6** returns the new epic issue key: do **not** use the generic story list below. Follow **jira-research-story-templates** for **bundled epic creation**: create **all nine** stories with `parent` = that epic key, including HCC label, default points per that skill, sprint, **Refinement** status, and descriptions from that skill. Default **story assignee** to the epic assignee unless the user said otherwise during Step 1.
3. Reply with the epic key plus **all nine child story keys**, confirming they sit under the epic.

#### Step 7b: All other epics — custom child stories

If the epic summary does **not** match `/research/i`, use this path.

For each story, propose:

1. **Summary** — descriptive name
2. **Type** — Story (default), Task, or Spike
3. **Activity Type** — inherit from epic or set per-story if different
4. **Story Points** — using the scale from Step 5
5. **Components** — same as parent epic
6. **Sprint** — assign to the active HCC sprint
7. **Description** — using this format:

```
### What

[Describe what this story covers. Be specific about the deliverable and scope.]

### Definition of Done

This issue should be Closed once the following criteria are met.

- The primary deliverable or artifact is attached or linked to this issue.
- The primary deliverable of this issue has been shared for review with the UXD team members first, followed by the PM and Engineering teams (if appropriate).
- For UI-specific designs (aka things you make in Figma), the primary deliverable has been through a critique review session with at least one other designer.
- Follow-up tasks identified during the review have been created in the parent epic.
- [Include any other criteria specific to this story]
```

**Present the full story list to the user for review before creating.**

When creating stories:

```json
{
  "cloudId": "redhat.atlassian.net",
  "projectKey": "CPUX",
  "issueTypeName": "Story",
  "summary": "<story name>",
  "description": "<story description>",
  "parent": "<EPIC-KEY>",
  "assignee_account_id": "<user account id>",
  "contentFormat": "markdown",
  "additional_fields": {
    "components": [{"id": "68524"}],
    "customfield_10464": {"id": "<activity-type-option-id>"},
    "customfield_10028": <story-points-number>,
    "customfield_10020": <sprint-id-number>
  }
}
```

**Important**: Sprint ID must be a plain integer (e.g., `64782`), not an object.

## Important Notes

- Always present the full epic draft to the user for review before creating in Jira.
- **Research epics** (`/research/i` in summary): include the nine-story bundle in that same draft; after the epic is created, create those stories automatically per [jira-research-story-templates](../jira-research-story-templates/SKILL.md) unless the user opted out.
- Activity Type and Story Points must be set on **both** the epic and every child story.
- Stories should be assigned to the current active HCC sprint by default.
- The summary must always start with `[UXD EPIC]` followed by the epic name.
- For detailed guidance on problem statements, see [problem-statements.md](problem-statements.md).
- For the story point scale reference, see [story-points.md](story-points.md).
- For activity type definitions, see [activity-types.md](activity-types.md).
