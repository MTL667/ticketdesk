import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getHostStatus, getZabbixConfig } from "@/lib/zabbix";

export interface SystemStatusItem {
  id: string;
  name: string;
  status: "ok" | "warning" | "critical" | "down" | "unknown";
  message?: string;
  problemCount?: number;
  isManual: boolean;
}

// GET - fetch system status for all monitored services
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get all active monitored services
    const services = await prisma.monitoredService.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    if (services.length === 0) {
      return NextResponse.json({ services: [], configured: false });
    }

    const zabbixConfig = getZabbixConfig();
    const statusItems: SystemStatusItem[] = [];

    for (const service of services) {
      // Check for manual override first
      if (service.manualStatus) {
        statusItems.push({
          id: service.id,
          name: service.name,
          status: service.manualStatus as SystemStatusItem["status"],
          message: service.manualMessage || undefined,
          isManual: true,
        });
        continue;
      }

      // If no Zabbix host ID or Zabbix not configured, show as unknown
      if (!service.zabbixHostId || !zabbixConfig) {
        statusItems.push({
          id: service.id,
          name: service.name,
          status: "unknown",
          message: !zabbixConfig ? "Monitoring not configured" : "No host linked",
          isManual: false,
        });
        continue;
      }

      // Fetch from Zabbix
      try {
        const hostStatus = await getHostStatus(service.zabbixHostId);
        statusItems.push({
          id: service.id,
          name: service.name,
          status: hostStatus.status,
          message: hostStatus.message,
          problemCount: hostStatus.problemCount,
          isManual: false,
        });
      } catch (error) {
        console.error(`Error fetching status for ${service.name}:`, error);
        statusItems.push({
          id: service.id,
          name: service.name,
          status: "unknown",
          message: "Error fetching status",
          isManual: false,
        });
      }
    }

    return NextResponse.json({
      services: statusItems,
      configured: true,
      zabbixConfigured: !!zabbixConfig,
    });
  } catch (error) {
    console.error("Error fetching system status:", error);
    return NextResponse.json(
      { message: "Error fetching system status" },
      { status: 500 }
    );
  }
}

