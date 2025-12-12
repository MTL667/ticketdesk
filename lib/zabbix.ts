// Zabbix API integration

interface ZabbixConfig {
  url: string;
  token: string;
}

interface ZabbixHost {
  hostid: string;
  host: string;
  name: string;
  status: string;
}

interface ZabbixProblem {
  eventid: string;
  objectid: string;
  name: string;
  severity: string; // 0-5: Not classified, Information, Warning, Average, High, Disaster
  clock: string;
  acknowledged: string;
  hosts?: { hostid: string; name: string }[];
}

interface ZabbixTrigger {
  triggerid: string;
  description: string;
  priority: string;
  value: string; // 0 = OK, 1 = PROBLEM
  lastchange: string;
  hosts?: { hostid: string; name: string }[];
}

interface ZabbixHttpTest {
  httptestid: string;
  name: string;
  hostid: string;
  status: string; // 0 = enabled, 1 = disabled
  nextcheck?: string;
}

interface ZabbixHttpTestStatus {
  httptestid: string;
  name: string;
  lastfailedstep: string; // 0 = OK, >0 = step number that failed
  lastcheck: string;
  lastvalue?: string;
}

export interface ServiceStatus {
  hostId: string;
  hostName: string;
  status: "ok" | "warning" | "critical" | "down" | "unknown";
  message?: string;
  problemCount: number;
  highestSeverity: number;
  problems: {
    name: string;
    severity: number;
    since: Date;
  }[];
}

// Get Zabbix config from environment or database
export function getZabbixConfig(): ZabbixConfig | null {
  const url = process.env.ZABBIX_URL;
  const token = process.env.ZABBIX_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  // Clean up URL - ensure it ends with api_jsonrpc.php
  let apiUrl = url.trim();
  if (apiUrl.endsWith("/")) {
    apiUrl = apiUrl.slice(0, -1);
  }
  if (!apiUrl.endsWith("api_jsonrpc.php")) {
    apiUrl = `${apiUrl}/api_jsonrpc.php`;
  }

  return { url: apiUrl, token };
}

// Make Zabbix API request - tries Bearer token first, then auth param in body
async function zabbixRequest(
  config: ZabbixConfig,
  method: string,
  params: Record<string, unknown> = {},
  skipAuth = false
): Promise<unknown> {
  // First try with Bearer token (Zabbix 5.4+)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (!skipAuth) {
    headers["Authorization"] = `Bearer ${config.token}`;
  }

  const body: Record<string, unknown> = {
    jsonrpc: "2.0",
    method,
    params,
    id: 1,
  };

  let response = await fetch(config.url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Zabbix API error: ${response.status} ${response.statusText}`);
  }

  let data = await response.json();

  // If Bearer token fails with auth error, try with auth param in body (older Zabbix)
  if (data.error && !skipAuth) {
    const errorMsg = data.error.message || data.error.data || "";
    if (errorMsg.toLowerCase().includes("auth") || 
        errorMsg.toLowerCase().includes("permission") ||
        errorMsg.toLowerCase().includes("invalid params")) {
      
      // Try with auth in body instead
      const bodyWithAuth = {
        jsonrpc: "2.0",
        method,
        params,
        auth: config.token,
        id: 1,
      };

      response = await fetch(config.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyWithAuth),
      });

      if (!response.ok) {
        throw new Error(`Zabbix API error: ${response.status} ${response.statusText}`);
      }

      data = await response.json();
    }
  }

  if (data.error) {
    throw new Error(`Zabbix API error: ${data.error.message || data.error.data || JSON.stringify(data.error)}`);
  }

  return data.result;
}

// Test Zabbix connection
export async function testZabbixConnection(config?: ZabbixConfig): Promise<{
  success: boolean;
  message: string;
  version?: string;
}> {
  const cfg = config || getZabbixConfig();

  if (!cfg) {
    return { success: false, message: "Zabbix not configured" };
  }

  try {
    // apiinfo.version is a public method, no auth needed
    const result = await zabbixRequest(cfg, "apiinfo.version", {}, true);
    return {
      success: true,
      message: "Connection successful",
      version: result as string,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get all hosts from Zabbix
export async function getZabbixHosts(config?: ZabbixConfig): Promise<ZabbixHost[]> {
  const cfg = config || getZabbixConfig();

  if (!cfg) {
    throw new Error("Zabbix not configured");
  }

  const result = await zabbixRequest(cfg, "host.get", {
    output: ["hostid", "host", "name", "status"],
    sortfield: "name",
  });

  return result as ZabbixHost[];
}

// Get web scenarios (httptests) for a specific host
export async function getZabbixWebScenarios(
  hostId: string,
  config?: ZabbixConfig
): Promise<ZabbixHttpTest[]> {
  const cfg = config || getZabbixConfig();

  if (!cfg) {
    throw new Error("Zabbix not configured");
  }

  const result = await zabbixRequest(cfg, "httptest.get", {
    hostids: [hostId],
    output: ["httptestid", "name", "hostid", "status"],
    sortfield: "name",
  });

  return result as ZabbixHttpTest[];
}

// Get all web scenarios from Zabbix (for all hosts)
export async function getAllZabbixWebScenarios(config?: ZabbixConfig): Promise<(ZabbixHttpTest & { hostname?: string })[]> {
  const cfg = config || getZabbixConfig();

  if (!cfg) {
    throw new Error("Zabbix not configured");
  }

  const result = await zabbixRequest(cfg, "httptest.get", {
    output: ["httptestid", "name", "hostid", "status"],
    selectHosts: ["name"],
    sortfield: "name",
  });

  return (result as any[]).map(ws => ({
    ...ws,
    hostname: ws.hosts?.[0]?.name,
  }));
}

// Get web scenario status
export async function getWebScenarioStatus(
  httptestId: string,
  config?: ZabbixConfig
): Promise<ServiceStatus> {
  const cfg = config || getZabbixConfig();

  if (!cfg) {
    return {
      hostId: httptestId,
      hostName: "Unknown",
      status: "unknown",
      message: "Zabbix not configured",
      problemCount: 0,
      highestSeverity: 0,
      problems: [],
    };
  }

  try {
    // Get httptest info with last check data
    const httptests = await zabbixRequest(cfg, "httptest.get", {
      httptestids: [httptestId],
      output: ["httptestid", "name", "hostid", "status"],
      selectHosts: ["name"],
    }) as any[];

    if (httptests.length === 0) {
      return {
        hostId: httptestId,
        hostName: "Unknown",
        status: "unknown",
        message: "Web scenario not found",
        problemCount: 0,
        highestSeverity: 0,
        problems: [],
      };
    }

    const httptest = httptests[0];
    const scenarioName = httptest.name;
    const hostName = httptest.hosts?.[0]?.name || "Unknown Host";
    const hostId = httptest.hostid;

    // Check if scenario is disabled
    if (httptest.status === "1") {
      return {
        hostId: httptestId,
        hostName: scenarioName,
        status: "unknown",
        message: "Monitoring disabled",
        problemCount: 0,
        highestSeverity: 0,
        problems: [],
      };
    }

    // Get problems related to this web scenario by checking triggers
    // Web scenario triggers usually contain the scenario name
    const problems = await zabbixRequest(cfg, "problem.get", {
      hostids: [hostId],
      output: ["eventid", "name", "severity", "clock"],
      search: { name: scenarioName },
      searchWildcardsEnabled: true,
      recent: true,
      sortfield: "eventid",
      sortorder: "DESC",
    }) as ZabbixProblem[];

    if (problems.length === 0) {
      return {
        hostId: httptestId,
        hostName: scenarioName,
        status: "ok",
        message: "Operational",
        problemCount: 0,
        highestSeverity: 0,
        problems: [],
      };
    }

    const highestSeverity = Math.max(...problems.map((p) => parseInt(p.severity)));

    return {
      hostId: httptestId,
      hostName: scenarioName,
      status: severityToStatus(highestSeverity),
      message: problems[0].name,
      problemCount: problems.length,
      highestSeverity,
      problems: problems.map((p) => ({
        name: p.name,
        severity: parseInt(p.severity),
        since: new Date(parseInt(p.clock) * 1000),
      })),
    };
  } catch (error) {
    return {
      hostId: httptestId,
      hostName: "Unknown",
      status: "unknown",
      message: error instanceof Error ? error.message : "Error fetching status",
      problemCount: 0,
      highestSeverity: 0,
      problems: [],
    };
  }
}

// Get problems for specific hosts
export async function getZabbixProblems(
  hostIds: string[],
  config?: ZabbixConfig
): Promise<ZabbixProblem[]> {
  const cfg = config || getZabbixConfig();

  if (!cfg) {
    throw new Error("Zabbix not configured");
  }

  if (hostIds.length === 0) {
    return [];
  }

  const result = await zabbixRequest(cfg, "problem.get", {
    hostids: hostIds,
    output: ["eventid", "objectid", "name", "severity", "clock", "acknowledged"],
    selectHosts: ["hostid", "name"],
    recent: true,
    sortfield: ["eventid"],
    sortorder: "DESC",
  });

  return result as ZabbixProblem[];
}

// Get triggers for specific hosts
export async function getZabbixTriggers(
  hostIds: string[],
  config?: ZabbixConfig
): Promise<ZabbixTrigger[]> {
  const cfg = config || getZabbixConfig();

  if (!cfg) {
    throw new Error("Zabbix not configured");
  }

  if (hostIds.length === 0) {
    return [];
  }

  const result = await zabbixRequest(cfg, "trigger.get", {
    hostids: hostIds,
    output: ["triggerid", "description", "priority", "value", "lastchange"],
    selectHosts: ["hostid", "name"],
    filter: { value: 1 }, // Only active problems
    sortfield: "priority",
    sortorder: "DESC",
  });

  return result as ZabbixTrigger[];
}

// Map Zabbix severity to our status
function severityToStatus(severity: number): "ok" | "warning" | "critical" | "down" {
  // Zabbix severities: 0=Not classified, 1=Information, 2=Warning, 3=Average, 4=High, 5=Disaster
  if (severity >= 5) return "down";
  if (severity >= 4) return "critical";
  if (severity >= 2) return "warning";
  return "ok";
}

// Get status for a specific host
export async function getHostStatus(
  hostId: string,
  config?: ZabbixConfig
): Promise<ServiceStatus> {
  const cfg = config || getZabbixConfig();

  if (!cfg) {
    return {
      hostId,
      hostName: "Unknown",
      status: "unknown",
      message: "Zabbix not configured",
      problemCount: 0,
      highestSeverity: 0,
      problems: [],
    };
  }

  try {
    // Get host info
    const hosts = await zabbixRequest(cfg, "host.get", {
      hostids: [hostId],
      output: ["hostid", "host", "name", "status"],
    }) as ZabbixHost[];

    if (hosts.length === 0) {
      return {
        hostId,
        hostName: "Unknown",
        status: "unknown",
        message: "Host not found",
        problemCount: 0,
        highestSeverity: 0,
        problems: [],
      };
    }

    const host = hosts[0];

    // Check if host is disabled in Zabbix
    if (host.status === "1") {
      return {
        hostId,
        hostName: host.name,
        status: "unknown",
        message: "Monitoring disabled",
        problemCount: 0,
        highestSeverity: 0,
        problems: [],
      };
    }

    // Get active problems
    const problems = await getZabbixProblems([hostId], cfg);

    if (problems.length === 0) {
      return {
        hostId,
        hostName: host.name,
        status: "ok",
        message: "All systems operational",
        problemCount: 0,
        highestSeverity: 0,
        problems: [],
      };
    }

    // Find highest severity
    const highestSeverity = Math.max(...problems.map((p) => parseInt(p.severity)));

    return {
      hostId,
      hostName: host.name,
      status: severityToStatus(highestSeverity),
      message: problems[0].name,
      problemCount: problems.length,
      highestSeverity,
      problems: problems.map((p) => ({
        name: p.name,
        severity: parseInt(p.severity),
        since: new Date(parseInt(p.clock) * 1000),
      })),
    };
  } catch (error) {
    return {
      hostId,
      hostName: "Unknown",
      status: "unknown",
      message: error instanceof Error ? error.message : "Error fetching status",
      problemCount: 0,
      highestSeverity: 0,
      problems: [],
    };
  }
}

// Get status for multiple hosts
export async function getMultipleHostStatus(
  hostIds: string[],
  config?: ZabbixConfig
): Promise<Map<string, ServiceStatus>> {
  const results = new Map<string, ServiceStatus>();

  // Fetch in parallel but with some batching
  const promises = hostIds.map((hostId) => getHostStatus(hostId, config));
  const statuses = await Promise.all(promises);

  statuses.forEach((status, index) => {
    results.set(hostIds[index], status);
  });

  return results;
}

