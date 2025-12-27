import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Context } from "hono";

// Environment bindings (optional - credentials can come from headers instead)
interface AppEnv {
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
}

const app = new Hono<{ Bindings: AppEnv }>();

// Enable CORS for local development
app.use("/api/*", cors());

// Helper to get credentials from headers or fallback to environment
function getCredentials(c: Context<{ Bindings: AppEnv }>): { accountId: string | null; apiToken: string | null; source: 'headers' | 'env' | 'none' } {
  // First, check for credentials in headers (from browser localStorage)
  const headerAccountId = c.req.header("X-CF-Account-ID");
  const headerApiToken = c.req.header("X-CF-API-Token");

  if (headerAccountId && headerApiToken) {
    return { accountId: headerAccountId, apiToken: headerApiToken, source: 'headers' };
  }

  // Fall back to environment variables
  const envAccountId = c.env.CF_ACCOUNT_ID;
  const envApiToken = c.env.CF_API_TOKEN;

  if (envAccountId && envApiToken) {
    return { accountId: envAccountId, apiToken: envApiToken, source: 'env' };
  }

  return { accountId: null, apiToken: null, source: 'none' };
}

// Health check
app.get("/api/health", (c) => {
  const { source } = getCredentials(c);
  return c.json({
    status: "ok",
    credentialsSource: source,
    hasCredentials: source !== 'none'
  });
});

// List available datasets from Analytics Engine
app.get("/api/datasets", async (c) => {
  const { accountId, apiToken } = getCredentials(c);

  if (!accountId || !apiToken) {
    return c.json({
      error: "Missing configuration",
      message: "No API credentials found. Please configure your Cloudflare API credentials in Settings, or set CF_ACCOUNT_ID and CF_API_TOKEN environment variables.",
      datasets: []
    }, 400);
  }

  try {
    // Use SQL SHOW TABLES to list datasets
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "text/plain",
        },
        body: "SHOW TABLES",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to list datasets:", errorText);
      return c.json({
        error: "Could not fetch datasets",
        details: errorText,
        datasets: []
      }, 200); // Return 200 so UI shows manual entry
    }

    const result = await response.json() as {
      data: Array<{ name: string }>;
      meta: Array<{ name: string; type: string }>;
    };

    // Transform to dataset format - the column might be 'name' or the first column
    const datasets = (result.data || []).map((row) => {
      const name = row.name || Object.values(row)[0] as string;
      return { id: name, name };
    });

    return c.json({ datasets });
  } catch (error) {
    return c.json({
      error: "Failed to fetch datasets",
      message: error instanceof Error ? error.message : "Unknown error",
      datasets: []
    }, 500);
  }
});

// Get dataset schema (columns) by running a sample query
app.get("/api/datasets/:datasetId/schema", async (c) => {
  const { accountId, apiToken } = getCredentials(c);
  const datasetId = c.req.param("datasetId");

  if (!accountId || !apiToken) {
    return c.json({
      error: "Missing configuration",
      message: "No API credentials found. Please configure your Cloudflare API credentials in Settings.",
      columns: []
    }, 400);
  }

  try {
    // Run a sample query to get column information from meta
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "text/plain",
        },
        body: `SELECT * FROM ${datasetId} LIMIT 1`,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({
        error: "Failed to fetch schema",
        details: errorText,
        columns: []
      }, 502);
    }

    const result = await response.json() as {
      data: Array<Record<string, unknown>>;
      meta: Array<{ name: string; type: string }>;
    };

    // Return column info from meta
    const columns = (result.meta || []).map((col) => ({
      name: col.name,
      type: col.type,
    }));

    return c.json({
      datasetId,
      columns
    });
  } catch (error) {
    return c.json({
      error: "Failed to fetch schema",
      message: error instanceof Error ? error.message : "Unknown error",
      columns: []
    }, 500);
  }
});

// Execute SQL query against Analytics Engine
app.post("/api/query", async (c) => {
  const { accountId, apiToken } = getCredentials(c);

  if (!accountId || !apiToken) {
    return c.json({
      error: "Missing configuration",
      message: "No API credentials found. Please configure your Cloudflare API credentials in Settings, or set CF_ACCOUNT_ID and CF_API_TOKEN environment variables.",
      data: [],
      meta: null
    }, 400);
  }

  try {
    const body = await c.req.json<{
      query: string;
      params?: Record<string, string | number>;
    }>();

    let { query } = body;
    const { params } = body;

    // Simple parameter substitution (for filters)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        let escapedValue: string;

        if (typeof value === "string") {
          // Check if this is an INTERVAL value (e.g., "'15' MINUTE", "'7' DAY")
          // These already have proper formatting and shouldn't be wrapped in quotes
          const isIntervalValue = /^'\d+'\s+(SECOND|MINUTE|HOUR|DAY|WEEK|MONTH|YEAR)$/i.test(value);

          if (isIntervalValue) {
            // Use as-is for INTERVAL syntax
            escapedValue = value;
          } else {
            // Wrap regular strings in quotes and escape internal quotes
            escapedValue = `'${value.replace(/'/g, "''")}'`;
          }
        } else {
          escapedValue = String(value);
        }

        query = query.replace(new RegExp(placeholder, "g"), escapedValue);
      });
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "text/plain",
        },
        body: query,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({
        error: "Query execution failed",
        message: errorText,
        query,
        data: [],
        meta: null
      }, 502);
    }

    const result = await response.json() as {
      data: Array<Record<string, unknown>>;
      meta: Array<{ name: string; type: string }>;
      rows: number;
      rows_before_limit_at_least: number;
    };

    return c.json({
      data: result.data || [],
      meta: result.meta || [],
      rowCount: result.rows || 0,
      totalRows: result.rows_before_limit_at_least || result.rows || 0,
    });
  } catch (error) {
    return c.json({
      error: "Query execution failed",
      message: error instanceof Error ? error.message : "Unknown error",
      data: [],
      meta: null
    }, 500);
  }
});

export default app;
