import type { PreparedAnswer } from '@/types'

export const mockPreparedAnswers: PreparedAnswer[] = [
  {
    id: 'prep-1',
    questionId: 'q-pitch',
    question: 'Tell me about yourself',
    category: 'Personal Pitch',
    answer: `I'm a third-year Information Systems Engineering student at Ben-Gurion University. Before starting my degree, I served for two years in Unit 9900 — the IDF's geospatial intelligence unit — where I worked on large-scale GIS and data systems under operational conditions. That experience gave me strong analytical foundations and the ability to drive clarity in ambiguous, high-stakes environments.

At BGU, I'm deepening my technical skills in data engineering, systems design, and product development. I've led a cross-disciplinary capstone project and won a hackathon building a data-driven urban mobility app.

I'm now looking for a student role where I can combine my technical depth with product or project management — specifically in tech companies building things that matter at scale.`,
    confidence: 5,
    isReady: true,
    tags: ['intro', 'background', 'opening'],
    lastUpdatedAt: '2026-04-25T14:00:00Z',
    createdAt: '2026-03-01T09:00:00Z',
  },
  {
    id: 'prep-2',
    questionId: 'q-why-amazon',
    question: 'Why Amazon?',
    category: 'HR',
    answer: `Amazon operates at a scale that's genuinely hard to replicate anywhere else — petabyte-scale data problems, global infrastructure, and the discipline of the Leadership Principles creating a consistent engineering culture.

Specifically for the Data Engineer role: I want to work on real production data pipelines, not toy datasets. The AWS ecosystem (Redshift, Glue, Spark on EMR) is the industry standard for what I want to do long-term, and getting hands-on experience here would compress years of learning into months.

The Leadership Principles also resonate with me personally. "Dive Deep" and "Are Right A Lot" describe how I operated in Unit 9900 — where precision mattered and assumptions could be costly.`,
    confidence: 4,
    isReady: true,
    tags: ['motivation', 'amazon', 'company-specific'],
    applicationIds: ['app-amazon'],
    lastUpdatedAt: '2026-04-28T11:00:00Z',
    createdAt: '2026-03-20T09:00:00Z',
  },
  {
    id: 'prep-3',
    questionId: 'q-why-wix',
    question: 'Why Wix? Why Product Management?',
    category: 'HR',
    answer: `Why Wix: I've been a Wix user — I actually built a portfolio site for a side project on Wix. What impressed me wasn't just the tool but the product decisions behind it: how they balance simplicity for non-technical users with power for developers. That's a genuinely hard product problem, and I want to work on it from the inside.

Why PM: I keep gravitating toward the "why" questions — why are we building this, who is it for, how do we know it worked? In Unit 9900, even as a technical contributor, I ended up driving decisions about what data to collect and why. At BGU, I led a team in our capstone project and found that the coordination and prioritization challenges were more interesting to me than pure implementation. PM is the natural fit.`,
    confidence: 4,
    isReady: true,
    tags: ['motivation', 'wix', 'pm', 'company-specific'],
    applicationIds: ['app-wix'],
    lastUpdatedAt: '2026-04-20T14:00:00Z',
    createdAt: '2026-03-22T09:00:00Z',
  },
  {
    id: 'prep-4',
    questionId: 'q-unit-9900',
    question: 'Tell me about your military service in Unit 9900',
    category: 'Behavioral',
    answer: `Unit 9900 is the IDF's visual intelligence and geospatial analysis unit. My role involved working with large-scale GIS data — satellite imagery, sensor data, spatial databases — to extract actionable intelligence under tight timelines.

The technical side: I worked with PostGIS, Python scripting, and QGIS on datasets of thousands of records per day. I also contributed to automating parts of a manual analysis pipeline, which cut processing time by roughly 40%.

The professional side: I learned to communicate under uncertainty, prioritize ruthlessly, and work across unit boundaries with people who had very different specializations. Those skills translate directly to product and data roles where cross-functional collaboration is everything.

I can't share specifics about projects or tools for security reasons, but the core takeaway is: high-stakes, ambiguous environments where precision and speed both matter.`,
    confidence: 5,
    isReady: true,
    tags: ['military', 'unit-9900', 'background', 'gis'],
    lastUpdatedAt: '2026-04-22T10:00:00Z',
    createdAt: '2026-03-01T09:00:00Z',
  },
  {
    id: 'prep-5',
    questionId: 'q-data-problem',
    question: 'Tell me about a time you used data to solve a problem',
    category: 'STAR',
    answer: `**Situation:** During my service in Unit 9900, our team was spending 4+ hours per day manually reviewing and classifying satellite imagery records in a spreadsheet-based workflow. The process was error-prone and created bottlenecks.

**Task:** I was asked (informally at first) to look into why the process was slow and whether anything could be automated.

**Action:** I mapped the existing workflow end-to-end, identified that ~60% of records had clear classification patterns that didn't require manual judgment. I wrote a Python script using GeoPandas and some spatial heuristics to pre-classify records based on feature geometry. I presented the approach to my supervisor, got sign-off, and worked with the team to test and refine it over two weeks.

**Result:** The automated pre-classification handled about 60% of daily volume, reducing manual review time from 4 hours to under 90 minutes. Error rate also dropped because analysts could focus attention on truly ambiguous cases.`,
    confidence: 5,
    isReady: true,
    tags: ['star', 'data', 'automation', 'unit-9900', 'python'],
    lastUpdatedAt: '2026-04-25T14:00:00Z',
    createdAt: '2026-03-10T09:00:00Z',
  },
  {
    id: 'prep-6',
    questionId: 'q-project-cv',
    question: 'Walk me through a project from your CV',
    category: 'Behavioral',
    answer: `I'll walk through the BGU Geospatial Analytics project — a semester-long capstone where I led a team of 4.

We were tasked with building a system to analyze urban accessibility for people with mobility impairments using open-source map data (OpenStreetMap) and accessibility data from the municipality.

I designed the data pipeline: Python (GeoPandas + NetworkX) to process the road graph, PostgreSQL + PostGIS for spatial storage, and a simple Leaflet.js frontend to visualize accessibility scores by neighborhood.

The biggest challenge was data quality — municipal data was incomplete and inconsistently formatted. I implemented a cleaning layer that standardized formats and flagged records needing manual review.

Final output: an interactive map showing accessibility scores with the ability to filter by disability type. The municipality expressed interest in the methodology.

Key takeaway for my career: I enjoyed every part — the data modeling, the pipeline design, the product thinking about what "accessibility" means to end users — more than any single specialization.`,
    confidence: 4,
    isReady: true,
    tags: ['project', 'gis', 'python', 'product', 'leadership'],
    lastUpdatedAt: '2026-04-18T11:00:00Z',
    createdAt: '2026-03-05T09:00:00Z',
  },
  {
    id: 'prep-7',
    questionId: 'q-sql-window',
    question: 'Explain window functions in SQL and give an example',
    category: 'SQL',
    answer: `Window functions perform calculations across a set of rows related to the current row, without collapsing the result set the way GROUP BY does. They're applied after WHERE and GROUP BY but before the final ORDER BY.

Common functions: ROW_NUMBER(), RANK(), DENSE_RANK(), LAG(), LEAD(), SUM() OVER, AVG() OVER, FIRST_VALUE(), LAST_VALUE().

**Example:** Find each employee's salary relative to their department average:
\`\`\`sql
SELECT
  employee_id,
  name,
  department,
  salary,
  AVG(salary) OVER (PARTITION BY department) AS dept_avg,
  salary - AVG(salary) OVER (PARTITION BY department) AS diff_from_avg,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank
FROM employees;
\`\`\`

Key clauses: PARTITION BY (defines the window group), ORDER BY (ordering within the window), ROWS/RANGE BETWEEN (frame specification).

Common interview trap: understanding that window functions run after WHERE filtering — so you can't filter on a window function result in the same query without a subquery or CTE.`,
    confidence: 5,
    isReady: true,
    tags: ['sql', 'window-functions', 'technical'],
    lastUpdatedAt: '2026-04-30T10:00:00Z',
    createdAt: '2026-04-01T09:00:00Z',
  },
  {
    id: 'prep-8',
    questionId: 'q-sql-optimization',
    question: 'How would you optimize a slow SQL query?',
    category: 'SQL',
    answer: `My process:

1. **Understand the query plan first** — use EXPLAIN ANALYZE (PostgreSQL) or EXPLAIN (MySQL/Redshift). Look for sequential scans on large tables, high estimated rows, expensive sorts.

2. **Check indexes** — is the filter column indexed? Is the join column indexed? Composite indexes for multi-column filters? Avoid non-sargable predicates (functions on columns in WHERE clauses break index usage).

3. **Rewrite the query** — can an IN subquery become a JOIN? Can correlated subqueries be replaced with window functions or CTEs? Avoid SELECT * — only pull columns you need.

4. **Data model** — if it's a recurring performance issue, the query might be revealing a modeling problem. Consider pre-aggregation, materialized views, or partitioning.

5. **Statistics** — make sure table stats are fresh (ANALYZE in Postgres). The optimizer makes bad plans with stale statistics.

**Example I've done:** In a geospatial analysis, a query joining two PostGIS tables on a spatial relationship was doing a full sequential scan. Adding a spatial index (GiST on the geometry column) and rewriting the ST_Contains check dropped runtime from 45 seconds to under 2 seconds.`,
    confidence: 4,
    isReady: true,
    tags: ['sql', 'optimization', 'performance', 'technical'],
    lastUpdatedAt: '2026-04-30T10:00:00Z',
    createdAt: '2026-04-01T09:00:00Z',
  },
  {
    id: 'prep-9',
    questionId: 'q-python-pandas',
    question: 'How do you handle missing data in a Pandas DataFrame?',
    category: 'Python',
    answer: `**Detection:** df.isnull().sum() per column, df.info() for non-null counts, df.describe() to catch anomalies.

**Strategy depends on the data and use case:**

1. **Drop rows/columns:** df.dropna(subset=['critical_column']) — only if missingness is MCAR (missing completely at random) and volume is small.

2. **Impute with stats:** df['col'].fillna(df['col'].median()) — for numeric columns where median/mean is appropriate. Prefer median for skewed distributions.

3. **Forward/backward fill:** df.fillna(method='ffill') — for time series where the last known value is a reasonable estimate.

4. **Group-based imputation:** df.groupby('category')['value'].transform('median') — fill with the group's statistic, not the global one.

5. **Flag missingness:** Add an is_missing indicator column before imputing — the missingness pattern itself can be a signal.

6. **Leave as NaN:** Many ML models handle NaN natively (XGBoost, LightGBM). Don't impute just for the sake of it.

I always document the imputation strategy and its assumptions, especially in production pipelines where data quality changes over time.`,
    confidence: 4,
    isReady: true,
    tags: ['python', 'pandas', 'data-engineering', 'technical'],
    lastUpdatedAt: '2026-04-28T14:00:00Z',
    createdAt: '2026-04-05T09:00:00Z',
  },
  {
    id: 'prep-10',
    questionId: 'q-product-improve',
    question: 'How would you improve a product you use daily?',
    category: 'Product / PM',
    answer: `I'll use Wix as an example since it's relevant here.

**The problem I'd focus on:** Small business owners abandoning site edits midway. Wix has great creation tools, but I observe (from research and my own usage) that updating existing content post-launch feels fragile — users worry about "breaking" things.

**User insight:** The mental model of "edit the site" feels higher-stakes than it should be. Unlike Google Docs, there's no visible revision history, and the undo/redo behavior is unclear.

**My proposal:** A "Site History" panel — lightweight version control for content edits. Not full code-diff; just a daily snapshot with a one-click "restore to yesterday" option.

**Why this over other features:** Low implementation cost relative to impact. Reduces the anxiety that's probably the #1 reason small business owners don't update their sites regularly, which drives churn.

**Metrics I'd track:** Site edit frequency per user, time-in-editor per session, churn rate for users who haven't edited in 30 days.

**Tradeoff:** Storage cost for snapshots. Acceptable if we store diffs rather than full snapshots and cap history depth.`,
    confidence: 4,
    isReady: true,
    tags: ['product', 'pm', 'wix', 'improvement'],
    applicationIds: ['app-wix'],
    lastUpdatedAt: '2026-04-22T10:00:00Z',
    createdAt: '2026-04-15T09:00:00Z',
  },
  {
    id: 'prep-11',
    questionId: 'q-conflict',
    question: 'Tell me about a time you had a conflict with a teammate',
    category: 'STAR',
    answer: `**Situation:** During my BGU capstone project, I was leading a team of 4. One team member wanted to use a NoSQL database for our geospatial data; I thought PostGIS was the right choice given our spatial query requirements.

**Task:** We needed to make a technical decision quickly (deadline approaching) while preserving team cohesion.

**Action:** Instead of overruling, I proposed a one-day spike: we'd each implement a proof-of-concept query against sample data in both systems and compare results. I made the evaluation criteria explicit upfront: query flexibility, performance on spatial operations, ease of deployment.

The POC took 6 hours total. PostGIS clearly handled the spatial joins and radius queries better. My teammate agreed with the results — importantly, they'd arrived at the same conclusion themselves through the experiment.

**Result:** We moved forward with PostGIS with full team buy-in. More importantly, the process built trust — later decisions went smoother because we had an established template for technical disagreements.

**Takeaway:** Data over debate when possible. Give people a path to reach their own conclusions.`,
    confidence: 4,
    isReady: true,
    tags: ['star', 'conflict', 'teamwork', 'leadership'],
    lastUpdatedAt: '2026-04-20T14:00:00Z',
    createdAt: '2026-03-15T09:00:00Z',
  },
  {
    id: 'prep-12',
    questionId: 'q-why-data-roles',
    question: 'Why data/product/project roles?',
    category: 'Personal Pitch',
    answer: `The honest answer is that I'm drawn to the intersection of technical depth and decision-making.

Pure engineering is interesting, but I find myself most energized when I can ask "what should we build and why" alongside "how do we build it." That's the PM axis.

On the data side specifically: I've seen firsthand (in Unit 9900) how the quality and structure of data directly determines the quality of decisions made downstream. Bad data architecture isn't just a technical debt problem — it's a decision-quality problem. Building systems that produce reliable, well-structured data feels like leverage.

Project management appeals to the part of me that likes orchestrating parallel workstreams and removing blockers — skills I built under time pressure in the military.

So: data + product + project management aren't three different careers to me. They're three views of the same problem: how do you build things that work, for the right people, with the right information?`,
    confidence: 5,
    isReady: true,
    tags: ['motivation', 'career', 'opening'],
    lastUpdatedAt: '2026-04-25T14:00:00Z',
    createdAt: '2026-03-01T09:00:00Z',
  },
  {
    id: 'prep-13',
    questionId: 'q-etl-design',
    question: 'How would you design an ETL pipeline for a new data source?',
    category: 'Data Engineering',
    answer: `**My approach:**

1. **Understand the source** — is it a database (CDC vs batch?), an API (pagination, rate limits?), a file drop (schema consistency?)? What's the volume, velocity, and variability?

2. **Define the target** — what schema does downstream need? Star schema for analytics? Raw landing zone + transformed layer (medallion architecture: Bronze → Silver → Gold)?

3. **Extract** — for databases: prefer CDC (Debezium, AWS DMS) over full dumps for large tables. For APIs: implement retry logic, exponential backoff, handle pagination. For files: validate schema on arrival.

4. **Transform** — apply business rules. Handle nulls, type coercions, deduplication. Use dbt or PySpark for transformations — avoid transformations in the load step (ELT > ETL for modern warehouses).

5. **Load** — upsert vs append vs replace? Use staging tables to avoid partial writes. Test idempotency: re-running the pipeline should produce the same result.

6. **Observability** — row count checks, null rate monitoring, SLA alerts on lag. Log the run metadata (source rows, loaded rows, errors, duration).

7. **Failure modes** — what happens if the source goes down? If a schema changes? Design for graceful degradation.

**For Amazon specifically:** I'd want to understand which AWS services are already in the stack — using Glue + S3 + Redshift natively vs. building custom Spark jobs on EMR.`,
    confidence: 4,
    isReady: true,
    tags: ['data-engineering', 'etl', 'pipeline', 'technical'],
    applicationIds: ['app-amazon'],
    lastUpdatedAt: '2026-04-30T10:00:00Z',
    createdAt: '2026-04-10T09:00:00Z',
  },
  {
    id: 'prep-14',
    questionId: 'q-is-systems',
    question: 'How does your Information Systems Engineering background help you in this role?',
    category: 'Information Systems',
    answer: `Information Systems Engineering sits at the intersection of CS and business — it's not pure CS, which means we're trained to think about systems from both the technical architecture and the user/business requirements side simultaneously.

Concretely: I've done coursework in databases, systems analysis, software engineering, operations research, organizational behavior, and project management — as well as CS fundamentals (algorithms, data structures, OS).

For a data role: I have the depth to understand query optimization, database design, and pipeline architecture, but also the breadth to understand why a business stakeholder cares about a particular metric. That combination is actually rare — most people go deep in one direction.

For a PM/project role: I understand enough about engineering to have credible conversations with developers, estimate technical complexity, and catch when something is being over- or under-engineered. I'm not faking technical literacy — I can read code, write scripts, and understand system constraints.`,
    confidence: 4,
    isReady: true,
    tags: ['background', 'university', 'information-systems'],
    lastUpdatedAt: '2026-04-18T11:00:00Z',
    createdAt: '2026-03-20T09:00:00Z',
  },
  {
    id: 'prep-15',
    questionId: 'q-prioritization',
    question: 'How do you prioritize when you have multiple urgent tasks?',
    category: 'Behavioral',
    answer: `**My framework:**

First, I separate "urgent" from "important." A lot of things feel urgent but aren't important in the larger scheme. I try to quickly map tasks on an impact/urgency grid.

Second, I look for dependencies — which tasks are blocking others? Those move to the top regardless of my preference.

Third, I communicate. If I have 5 urgent things and I can only deliver 3 today, I'd rather tell stakeholders early that something will be delayed than miss everything without warning.

**In practice (Unit 9900 example):** There were days with multiple simultaneous analytical requests, each marked "priority." My approach was to spend 10 minutes at the start of each day mapping the requests, identifying which required input from me before others could proceed, and sequencing accordingly. I'd communicate expected completion times so people could adjust their plans.

**At university:** During finals season with concurrent project deadlines, I use time-blocking aggressively. I don't multitask — I context-switch in blocks of 90+ minutes and protect deep work time.`,
    confidence: 5,
    isReady: true,
    tags: ['behavioral', 'prioritization', 'time-management'],
    lastUpdatedAt: '2026-04-22T10:00:00Z',
    createdAt: '2026-03-10T09:00:00Z',
  },
]
