import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { testZabbixConnection, getZabbixHosts, getZabbixConfig } from "@/lib/zabbix";

// GET - test connection and get hosts
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const config = getZabbixConfig();

    if (!config) {
      return NextResponse.json({
        configured: false,
        message: "Zabbix not configured. Set ZABBIX_URL and ZABBIX_API_TOKEN environment variables.",
      });
    }

    // Test connection
    const connectionTest = await testZabbixConnection(config);

    if (!connectionTest.success) {
      return NextResponse.json({
        configured: true,
        connected: false,
        message: connectionTest.message,
      });
    }

    // Get hosts
    try {
      const hosts = await getZabbixHosts(config);
      return NextResponse.json({
        configured: true,
        connected: true,
        version: connectionTest.version,
        hosts: hosts.map((h) => ({
          id: h.hostid,
          name: h.name,
          host: h.host,
          enabled: h.status === "0",
        })),
      });
    } catch (error) {
      return NextResponse.json({
        configured: true,
        connected: true,
        version: connectionTest.version,
        hosts: [],
        hostsError: error instanceof Error ? error.message : "Error fetching hosts",
      });
    }
  } catch (error) {
    console.error("Error checking Zabbix:", error);
    return NextResponse.json(
      { message: "Error checking Zabbix configuration" },
      { status: 500 }
    );
  }
}


