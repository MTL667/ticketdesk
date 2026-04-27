const JIRA_FIELDS = "status,assignee,priority,updated";

export interface JiraIssueData {
  key: string;
  statusName: string;
  statusCategory: string;
  assigneeDisplayName: string | null;
  priorityName: string | null;
  updated: string;
}

export class JiraError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "JiraError";
  }
}

export function isJiraConfigured(): boolean {
  return !!(
    process.env.JIRA_BASE_URL &&
    process.env.JIRA_EMAIL &&
    process.env.JIRA_API_TOKEN
  );
}

function getJiraAuth(): { baseUrl: string; authHeader: string } {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !token) {
    throw new JiraError("Jira is not configured (missing JIRA_BASE_URL, JIRA_EMAIL, or JIRA_API_TOKEN)");
  }

  const cleaned = baseUrl.replace(/\/+$/, "");
  const credentials = Buffer.from(`${email}:${token}`).toString("base64");

  return {
    baseUrl: cleaned,
    authHeader: `Basic ${credentials}`,
  };
}

async function jiraFetch(url: string, init: RequestInit = {}, maxRetries = 3): Promise<Response> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("retry-after") || "0", 10);
        const wait = retryAfter > 0 ? retryAfter * 1000 : Math.min(attempt * 2000, 10000);
        if (attempt < maxRetries) {
          console.log(`[jira] 429 rate limit, waiting ${wait}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        return response;
      }

      if (response.status >= 500) {
        if (attempt < maxRetries) {
          const wait = Math.min(Math.pow(2, attempt) * 500, 5000);
          console.log(`[jira] ${response.status} transient error, retry ${attempt}/${maxRetries} in ${wait}ms`);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        return response;
      }

      return response;
    } catch (error) {
      lastError = error;
      const isAbort = (error as Error).name === "AbortError";
      if (attempt < maxRetries) {
        const wait = Math.min(Math.pow(2, attempt) * 500, 5000);
        console.log(
          `[jira] ${isAbort ? "timeout" : "network error"}: ${(error as Error).message}, retry ${attempt}/${maxRetries} in ${wait}ms`
        );
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new JiraError("Jira request failed after retries");
}

const JIRA_KEY_REGEX = /\/browse\/([A-Z][A-Z0-9]+-\d+)/;

export function parseJiraKeyFromUrl(url: string): string | null {
  const match = url.match(JIRA_KEY_REGEX);
  if (!match) {
    console.log(`[jira] Could not parse Jira key from URL: ${url}`);
    return null;
  }
  return match[1];
}

async function searchJiraBatch(
  keys: string[],
  baseUrl: string,
  authHeader: string
): Promise<JiraIssueData[]> {
  const jql = `key IN (${keys.join(",")})`;
  const results: JiraIssueData[] = [];
  let startAt = 0;
  const maxResults = 100;

  while (true) {
    const params = new URLSearchParams({
      jql,
      fields: JIRA_FIELDS,
      startAt: String(startAt),
      maxResults: String(maxResults),
    });

    const response = await jiraFetch(`${baseUrl}/rest/api/3/search?${params}`, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new JiraError(`Jira search failed: ${response.status} - ${text}`, response.status);
    }

    const data = await response.json();
    const issues = data.issues || [];

    for (const issue of issues) {
      results.push({
        key: issue.key,
        statusName: issue.fields?.status?.name || "Unknown",
        statusCategory: issue.fields?.status?.statusCategory?.name || "Unknown",
        assigneeDisplayName: issue.fields?.assignee?.displayName || null,
        priorityName: issue.fields?.priority?.name || null,
        updated: issue.fields?.updated || new Date().toISOString(),
      });
    }

    if (startAt + issues.length >= (data.total || 0)) break;
    startAt += issues.length;
  }

  return results;
}

/**
 * Fetch Jira issue data in bulk using JQL search.
 * Keys are batched in groups of 100 with up to 5 concurrent requests.
 */
export async function fetchJiraIssuesBulk(
  keys: string[]
): Promise<Map<string, JiraIssueData>> {
  if (keys.length === 0) return new Map();

  const { baseUrl, authHeader } = getJiraAuth();
  const result = new Map<string, JiraIssueData>();

  const BATCH_SIZE = 100;
  const MAX_CONCURRENCY = 5;

  const batches: string[][] = [];
  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    batches.push(keys.slice(i, i + BATCH_SIZE));
  }

  let fetched = 0;
  let failed = 0;

  for (let i = 0; i < batches.length; i += MAX_CONCURRENCY) {
    const chunk = batches.slice(i, i + MAX_CONCURRENCY);

    const results = await Promise.allSettled(
      chunk.map((batch) => searchJiraBatch(batch, baseUrl, authHeader))
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        for (const issue of r.value) {
          result.set(issue.key, issue);
          fetched++;
        }
      } else {
        failed++;
        console.warn(`[jira] Batch failed: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
      }
    }
  }

  console.log(`[jira] Fetched ${fetched} issues from ${batches.length} batches (${failed} batches failed)`);

  return result;
}
