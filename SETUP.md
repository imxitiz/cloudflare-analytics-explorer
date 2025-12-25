# AE Explorer - Setup & User Guide

**AE Explorer** is a dashboard builder for [Cloudflare Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/). Build beautiful, interactive dashboards to visualize your Analytics Engine data.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Getting Your Cloudflare Credentials](#getting-your-cloudflare-credentials)
4. [Configuration](#configuration)
5. [Understanding the Dummy Data](#understanding-the-dummy-data)
6. [Creating Data Sources](#creating-data-sources)
7. [Building Dashboards](#building-dashboards)
8. [Adding Tiles](#adding-tiles)
9. [Configuring Filters](#configuring-filters)
10. [SQL Query Reference](#sql-query-reference)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd visual-ae
pnpm install

# 2. Configure credentials (see "Getting Your Cloudflare Credentials" below)
cp ".dev.vars copy.example" .dev.vars
# Edit .dev.vars with your CF_ACCOUNT_ID and CF_API_TOKEN

# 3. Start development server
pnpm dev

# Open http://localhost:5173
```

---

## Prerequisites

- **Cloudflare Account** with Analytics Engine enabled
- **Analytics Engine Dataset** with some data written to it
- **Node.js 18+** and **pnpm** installed locally

---

## Getting Your Cloudflare Credentials

### 1. Find Your Account ID

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Your **Account ID** is in the URL: `https://dash.cloudflare.com/{account_id}/...`
4. Or find it in the right sidebar under "Account ID"

### 2. Create an API Token

1. Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Select **"Create Custom Token"**
4. Configure:

| Setting | Value |
|---------|-------|
| Token name | `AE Explorer` (or any name) |
| Permissions | Account → Analytics → **Read** |
| | Account → Analytics Engine → **Read** |
| Account Resources | Include → Your Account |

5. Click **"Continue to summary"** → **"Create Token"**
6. **Copy the token immediately** - you won't see it again!

---

## Configuration

### Local Development

Create a `.dev.vars` file in the project root:

```bash
CF_ACCOUNT_ID=your_account_id_here
CF_API_TOKEN=your_api_token_here
```

Then start the development server:

```bash
pnpm dev
```

### Production (Cloudflare Workers)

Set secrets using Wrangler:

```bash
npx wrangler secret put CF_ACCOUNT_ID
# Enter your account ID when prompted

npx wrangler secret put CF_API_TOKEN
# Enter your API token when prompted

# Deploy
pnpm run deploy
```

---

## Understanding the Dummy Data

When you first open AE Explorer, you'll see:

- **[Dummy] Sample Analytics** - A sample data source
- **[Dummy] Sample Dashboard** - A sample dashboard with example tiles

These use **mock data** to demonstrate the app's capabilities when the API isn't configured.

### To Use Real Data

1. Configure your Cloudflare credentials (see above)
2. Delete the dummy items:
   - Click on `[Dummy] Sample Dashboard` → Menu (⋯) → **Delete**
   - Go to Data Sources → Click on `[Dummy] Sample Analytics` → **Delete**
3. Create your own data sources and dashboards!

---

## Creating Data Sources

Data sources connect to your Analytics Engine datasets.

### Steps

1. Click **"+ New Data Source"** in the sidebar
2. **Select Dataset**: Choose from auto-discovered datasets, or enter manually
3. **Display Name**: Give it a friendly name (e.g., "Website Analytics")
4. **Column Mappings**: Map generic columns to meaningful names

### Understanding Analytics Engine Columns

Analytics Engine uses generic column names that you map to friendly names:

| Column Type | Range | Purpose |
|-------------|-------|---------|
| `blob1` - `blob20` | String | Text data (URLs, countries, etc.) |
| `double1` - `double20` | Number | Numeric data (counts, durations, etc.) |
| `index1` | String | High-cardinality grouping key |
| `timestamp` | DateTime | Event timestamp (auto-populated) |

**Example Mapping:**

| Source Column | Friendly Name | Description |
|---------------|---------------|-------------|
| `blob1` | Page URL | The visited page |
| `blob2` | Country | Visitor's country |
| `double1` | Page Views | View count |
| `double2` | Duration (ms) | Time on page |

---

## Building Dashboards

### Create a Dashboard

1. Click **"+ New Dashboard"** in the sidebar
2. Enter a name and optional description
3. Your empty dashboard is ready!

### Dashboard Layout

- **4-column grid** layout
- **Drag tiles** using the grip handle to reposition
- **Resize tiles** by dragging corners
- Changes save automatically

---

## Adding Tiles

Tiles are the visualizations on your dashboard.

### Create a Tile

1. Open your dashboard
2. Click **"+ Add Tile"**
3. Configure:

| Setting | Description |
|---------|-------------|
| **Title** | Display name for the tile |
| **Data Source** | Select your data source |
| **Visual Type** | Area, Bar, Line, Pie, Scatter, Table, or Stat |
| **SQL Query** | Your Analytics Engine SQL query |

### Visual Types

| Type | Best For |
|------|----------|
| **Area** | Time series with filled area |
| **Line** | Time series trends |
| **Bar** | Categorical comparisons |
| **Pie** | Distribution/proportions |
| **Scatter** | Correlation between two metrics |
| **Table** | Raw data display |
| **Stat** | Single KPI/metric display |

### Configuring Visuals

After selecting a visual type, configure:

- **X Axis**: The dimension column (usually date/category)
- **Y Axis**: The metric column(s) to display
- **Legend**: Show/hide legend
- **Grid**: Show/hide grid lines

---

## Configuring Filters

Filters let users dynamically change what data is displayed.

### Adding Filters to a Dashboard

1. Open your dashboard
2. Click the **menu (⋯)** → **"Manage Filters"**
3. Click **"+ Add Filter"**

### Filter Configuration

| Setting | Description |
|---------|-------------|
| **Display Name** | What users see (e.g., "Date Range") |
| **Parameter Name** | Used in queries (e.g., `date_range`) |
| **Type** | Date Range, Dropdown, or Text |
| **Default Value** | Initial filter value |

### Filter Types

**Date Range**
- Two date pickers (start and end)
- Use in queries: `{{param_start}}` and `{{param_end}}`

**Dropdown**
- Select from predefined options
- Configure label/value pairs
- Use in queries: `{{param}}`

**Text**
- Free-form text input with debouncing
- Use in queries: `{{param}}`

### Using Filters in Queries

Add placeholders in your SQL that match filter parameter names:

```sql
SELECT
  toDate(timestamp) as date,
  COUNT() as events
FROM my_dataset
WHERE timestamp BETWEEN {{date_range_start}} AND {{date_range_end}}
  AND blob1 = {{country}}
GROUP BY date
ORDER BY date
```

---

## SQL Query Reference

### Basic Queries

```sql
-- Count all events
SELECT COUNT() as total FROM my_dataset

-- Events by day
SELECT
  toDate(timestamp) as date,
  COUNT() as events
FROM my_dataset
GROUP BY date
ORDER BY date

-- Top 10 pages
SELECT
  blob1 as page,
  COUNT() as views
FROM my_dataset
GROUP BY page
ORDER BY views DESC
LIMIT 10
```

### Time-Based Queries

```sql
-- Last 7 days
WHERE timestamp > now() - INTERVAL 7 DAY

-- Last 24 hours
WHERE timestamp > now() - INTERVAL 24 HOUR

-- Specific date range
WHERE timestamp BETWEEN '2024-01-01' AND '2024-01-31'

-- With filter placeholders
WHERE timestamp BETWEEN {{date_start}} AND {{date_end}}
```

### Aggregations

```sql
-- Sum of a metric
SELECT SUM(double1) as total_views FROM my_dataset

-- Average
SELECT AVG(double2) as avg_duration FROM my_dataset

-- Multiple aggregations
SELECT
  COUNT() as events,
  SUM(double1) as total,
  AVG(double2) as average,
  MAX(double3) as peak
FROM my_dataset
```

### Multi-Series Charts

To create charts with multiple lines (e.g., by category), use a `series` column:

```sql
SELECT
  toDate(timestamp) as time,
  COUNT() as value,
  blob2 as series  -- This becomes separate lines
FROM my_dataset
GROUP BY time, series
ORDER BY time
```

The app automatically pivots this into wide format for charting.

---

## Deployment

### Deploy to Cloudflare Workers

```bash
# Set secrets first
npx wrangler secret put CF_ACCOUNT_ID
npx wrangler secret put CF_API_TOKEN

# Deploy
pnpm run deploy
```

Your app will be available at `https://visual-ae.<your-subdomain>.workers.dev`

---

## Troubleshooting

### "Missing configuration" Error

- Ensure `.dev.vars` exists with both `CF_ACCOUNT_ID` and `CF_API_TOKEN`
- Restart the dev server after adding credentials

### "Query execution failed"

- Check SQL syntax (Analytics Engine SQL, not standard SQL)
- Verify dataset name is correct
- Ensure your API token has Analytics Engine read permissions

### No Datasets Showing

- Verify you've written data to at least one Analytics Engine dataset
- Check API token permissions include Analytics Engine read access
- Try the manual entry option if auto-discovery fails

### Charts Show Nothing

- Verify your query returns data (test in SQL mode first)
- Check X/Y axis column names match your query output
- For numeric columns, ensure values aren't returned as strings

### Filters Not Working

- Ensure parameter names in filters match placeholders in queries
- Use `{{param}}` format (double curly braces)
- For date ranges, use `{{param_start}}` and `{{param_end}}`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/config/status` | Check if credentials configured |
| GET | `/api/datasets` | List all datasets |
| GET | `/api/datasets/:id/schema` | Get dataset columns |
| POST | `/api/query` | Execute SQL query |

---

## Support

For issues and feature requests, please open an issue on the repository.
