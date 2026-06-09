# Problem Statement Reference

## Framework

A complete problem statement should include:

1. **Title / Problem Summary** — Concise and descriptive
2. **Context / Background** — The situation or environment where the problem occurs
3. **Problem Description** — Clear articulation of the issue
4. **Impact** — Negative effects on users and/or business
5. **Evidence** — Supporting data, user feedback, or observations
6. **Goal / Objective** — What success looks like once resolved

## Templates

### Data-Driven Problem Statement

Use when you have measurable data from analytics, usability tests, surveys, or support tickets.

> [Target User] struggles with [specific issue]. Data from [source, e.g., analytics, research] shows [specific metrics]. This impacts [user goal/business goal].

**Example:**

> Operations/admin users struggle with finding the most important and critical information in one place. Data from competitive analyses shows that our competitors have much more robust dashboard features with customization and visualizations controlled by the user's needs. This impacts user efficiency when using the Hybrid Cloud Console.

**Example:**

> Cloud subscription users struggle with integrating their subscription successfully with Red Hat HCC. Data from subscription back-end and cost management back-end, plus anecdotes collected from RH1, shows around 28% of account mis-configuration and 80% of integration failure through cost management. This impacts our revenue collection, customer subscription usage tracking, and end-user experience.

### Assumption-Based Problem Statement

Use when data is limited or unavailable. Useful in early-stage exploration, hypothesis-driven design, or new product areas.

> We assume that [target user] experiences [specific issue] due to [reason]. This assumption is based on [source, e.g., limited feedback, prior knowledge].

**Example:**

> We assume that HCC users experience frustration due to the complexity and lack of consistency across the Hybrid Cloud Console information architecture. This assumption is based on user interviews and analytics data.

**Example:**

> We assume that Subscription Usage users experience a hard time finding out their usage is over the threshold due to the fact that we do not provide any alert or notification when they cross the threshold. This assumption is based on user engagements and support tickets from overused customer cases.

## Labels

| Label | When to apply |
|-------|---------------|
| `problem-statement-uxd-data-driven` | Based on UXDR/PWDR research |
| `problem-statement-data-driven` | Based on research from outside UX (BU, Marketing, Engineering, support tickets, competitive analysis) |
| `problem-statement-assumption` | Based on assumptions rather than validated research |
| `problem-statement-undefined` | No problem statement defined (edge cases only — e.g., tracking implementation review) |

## Quality Checklist

A good problem statement should be:

- [ ] Concise yet comprehensive
- [ ] Informed by data OR explicitly stating assumptions
- [ ] Actionable and measurable
- [ ] Aligned with user needs and business goals
- [ ] Specific (not vague like "users don't like the dashboard")
- [ ] Connected to user research or feedback when available
