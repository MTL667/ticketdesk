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

// Make Zabbix API request
async function zabbixRequest(
  config: ZabbixConfig,
  method: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Zabbix API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

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
    const result = await zabbixRequest(cfg, "apiinfo.version", {});
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

