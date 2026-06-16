# UX Research Team — Dataverse (live org data)

Use this workflow when the **Dataverse MCP server** is available in the environment. Dataverse pulls live employee data from Red Hat's RoverPeople directory (Snowflake). It is the **preferred source** for UXR team roster questions.

If Dataverse is **not** configured, fall back to [UXR_TEAM.md](UXR_TEAM.md) and warn the user that the roster may be less current than live org data.

---

## Team scope

The UX research team is defined as **Leslie Hinson and everyone in her reporting chain** (direct and indirect reports):

- **Leslie Hinson** — senior UXR leader
- **UXR managers** who report to Leslie (e.g. Melissa Grimes, Zachary Bodnar)
- **UX researchers** who report to Leslie or to her manager-reports

Do **not** include UX researchers outside Leslie's org subtree (e.g. people in other cost centers with "UX Researcher" titles who report to unrelated managers).

---

## Prerequisites

- **Dataverse MCP** enabled in Cursor (server name is usually `dataverse` or `user-dataverse`). Tools: `identify_dataproducts`, `shortlist_tables`, `get_sql`, `execute_sql`.
- **Authentication:** Dataverse uses Snowflake OAuth. The first query may prompt browser sign-in.

**Optional setup (user-level MCP config):**

```json
{
  "mcpServers": {
    "dataverse": {
      "url": "https://mcp.dataverse.redhat.com/mcp/"
    }
  }
}
```

Add this alongside your Google Workspace MCP in Cursor Settings → Tools & MCP, or in `~/.cursor/mcp.json`.

---

## Workflow (always use the full 4-step pipeline)

Dataverse requires the complete pipeline for business/org queries. Do **not** skip to `execute_sql` except for `SHOW` / `DESCRIBE` admin checks.

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `identify_dataproducts` | Route to `roverpeople` (employee directory) |
| 2 | `shortlist_tables` | Select `ROVER_PEOPLE_CURR`, `ROVER_ALIGNMENT_CURR` |
| 3 | `get_sql` | Generate SQL from the natural-language query below |
| 4 | `execute_sql` | Run the validated SQL |

**Data product:** `roverpeople`  
**Schema:** `ROVERPEOPLE_DB.RHAI_MARTS`

---

## Query to use

Pass this (or a close variant) as `user_query` to `shortlist_tables` and `get_sql`:

> Get Leslie Hinson and all employees in her reporting chain — direct and indirect reports. Include name, email, title, manager name, manager email, product alignment, role alignment, geo, and cost center. Scope to the UX research organization under Leslie Hinson only; exclude employees outside her org subtree.

If the generated SQL does not anchor on Leslie Hinson's org subtree, refine the query or re-run `get_sql` with explicit scope: "recursive reporting chain starting from Leslie Hinson."

---

## Presenting results

Relay roster data **as returned by Dataverse** — do not invent names, managers, or assignments.

| Field | Use for |
|-------|---------|
| `NAME` / `MAIL` | Identity and contact |
| `TITLE` | Role level (Principal, Senior, etc.) |
| `MANAGER_NAME` / `MANAGER_EMAIL` | Reporting lines |
| `PRODUCT_ALIGNMENT` | Product/portfolio assignment (HR taxonomy — may differ from UXR portfolio names) |
| `GEO` | Region |

**Product area for research citations:** Dataverse `PRODUCT_ALIGNMENT` uses HR product names (e.g. "Red Hat OpenShift AI"), not always the UXR portfolio labels in [UXR_TEAM.md](UXR_TEAM.md) (e.g. "Hybrid Platforms", "Red Hat AI (RH AI)"). When tagging research findings:

1. Prefer product area stated in the report.
2. Else infer from study topic.
3. Else match author name to [UXR_TEAM.md](UXR_TEAM.md) quick-lookup for UXR portfolio names.
4. Do **not** map Dataverse alignments to UXR portfolios without a clear match.

---

## Fallback to UXR_TEAM.md

Use the markdown roster **only when**:

- Dataverse MCP tools are not in the agent's tool list, or
- Dataverse authentication fails, or
- The query returns no usable results for Leslie Hinson's org

When using the fallback, include this notice in the answer (before or with the roster):

> **Note:** Dataverse MCP is not available or could not be queried. This roster comes from the static file [UXR_TEAM.md](UXR_TEAM.md), which may not reflect the latest hires, departures, or reporting-line changes. For the most current org data, enable the [Dataverse MCP](DATAVERSE_UXR.md) in Cursor.

Also mention in the **Tracing** section which source was used (`Dataverse / RoverPeople` vs `UXR_TEAM.md fallback`).

---

## Slack and contacts (not in Dataverse)

Regardless of roster source, these remain in [UXR_TEAM.md](UXR_TEAM.md):

- [#uxd-research](https://redhat.enterprise.slack.com/archives/C04JV6Y5SCF) — general UX research questions
- `#uxd-research-team` — study planning review
- [User Research and User Engagements spreadsheet](https://docs.google.com/spreadsheets/d/1gdiYnzLB6knn_JS6RFbAgdwJa5r6NL0tH9IhJwcMqPQ/edit?usp=sharing)

---

## Example queries

- "Who is on the UX research team?"
- "Who manages Yahav Manor?"
- "What is Marc Jackson's email?"
- "Who covers Hybrid Platforms?"
- "List everyone under Leslie Hinson in UX research"
