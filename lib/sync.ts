import prisma from "./prisma";
import { getTasks, ClickUpTask } from "./clickup";

// Custom field IDs (same as in the API routes)
const TICKET_ID_FIELD_ID = "faadba80-e7bc-474e-b01c-1a1c965c9a76";
const EMAIL_FIELD_ID = "e041d530-cb4e-4fd1-9759-9cb3f9a9cbe4";

// Helper to safely convert any value to string or null
function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value || null;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return null;
}

// Helper to extract custom field value by name (case-insensitive)
// Handles dropdown fields by looking up the option label
function getCustomFieldByName(fields: any[] | undefined, name: string): string | null {
  if (!fields) return null;
  const field = fields.find(f => f.name?.toLowerCase().includes(name.toLowerCase()));
  if (!field) return null;
  
  // Handle dropdown fields - value is the index, need to look up the option
  if (field.type === "drop_down" && field.type_config?.options && typeof field.value === "number") {
    const option = field.type_config.options[field.value];
    return option?.name || toStringOrNull(field.value);
  }
  
  // Handle labels field (array of label objects)
  if (field.type === "labels" && Array.isArray(field.value)) {
    const labels = field.value.map((v: any) => v.label || v.name || String(v)).join(", ");
    return labels || null;
  }
  
  return toStringOrNull(field.value);
}

// Helper to extract custom field value by ID
function getCustomFieldById(fields: any[] | undefined, id: string): string | null {
  if (!fields) return null;
  const field = fields.find(f => f.id === id);
  if (!field) return null;
  
  // Handle dropdown fields
  if (field.type === "drop_down" && field.type_config?.options && typeof field.value === "number") {
    const option = field.type_config.options[field.value];
    return option?.name || toStringOrNull(field.value);
  }
  
  return toStringOrNull(field.value);
}

// Extract email from task (from custom field or description)
function extractEmail(task: ClickUpTask): string | null {
  // First try the email custom field
  const emailFromField = getCustomFieldById(task.custom_fields, EMAIL_FIELD_ID);
  if (emailFromField && emailFromField.includes("@")) return emailFromField.toLowerCase();

  // Try other email-like custom fields
  if (task.custom_fields) {
    for (const field of task.custom_fields) {
      const fieldName = field.name?.toLowerCase() || "";
      if (fieldName.includes("email") || fieldName.includes("e-mail") || fieldName.includes("contact")) {
        const value = toStringOrNull(field.value);
        if (value && value.includes("@")) {
          return value.toLowerCase();
        }
      }
    }
  }

  // Last resort: try to extract from description
  if (task.description) {
    const emailMatch = task.description.match(/[\w.-]+@[\w.-]+\.\w+/i);
    if (emailMatch) return emailMatch[0].toLowerCase();
  }

  return null;
}

// Convert ClickUp task to database ticket format
function taskToTicket(task: ClickUpTask) {
  const email = extractEmail(task);
  
  return {
    id: task.id,
    ticketId: getCustomFieldById(task.custom_fields, TICKET_ID_FIELD_ID),
    name: task.name,
    description: task.description || null,
    status: task.status?.status || "unknown",
    priority: task.priority?.priority || "normal",
    userEmail: email || "unknown@unknown.com",
    businessUnit: getCustomFieldByName(task.custom_fields, "business unit"),
    jiraStatus: getCustomFieldByName(task.custom_fields, "jira status"),
    jiraAssignee: getCustomFieldByName(task.custom_fields, "jira assignee"),
    jiraUrl: getCustomFieldByName(task.custom_fields, "jira url") || 
             getCustomFieldByName(task.custom_fields, "jira link"),
    clickupCreatedAt: new Date(parseInt(task.date_created)),
    clickupUpdatedAt: new Date(parseInt(task.date_updated)),
  };
}

export interface SyncResult {
  success: boolean;
  ticketsSynced: number;
  ticketsTotal: number;
  duration: number;
  error?: string;
}

// Main sync function
export async function syncTicketsFromClickUp(): Promise<SyncResult> {
  const startTime = Date.now();
  
  // Create sync log entry
  const syncLog = await prisma.syncLog.create({
    data: {
      status: "running",
    },
  });

  try {
    console.log("Starting ticket sync from ClickUp...");
    
    // Fetch all tasks from ClickUp
    const tasks = await getTasks();
    console.log(`Fetched ${tasks.length} tasks from ClickUp`);

    let syncedCount = 0;

    // Process in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      
      // Upsert each ticket
      await Promise.all(
        batch.map(async (task) => {
          try {
            const ticketData = taskToTicket(task);
            
            await prisma.ticket.upsert({
              where: { id: task.id },
              update: {
                ...ticketData,
                syncedAt: new Date(),
              },
              create: {
                ...ticketData,
                syncedAt: new Date(),
              },
            });
            syncedCount++;
          } catch (error) {
            console.error(`Error syncing task ${task.id}:`, error);
          }
        })
      );

      console.log(`Synced ${Math.min(i + batchSize, tasks.length)}/${tasks.length} tickets`);
    }

    const duration = Date.now() - startTime;

    // Update sync log
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        ticketsSynced: syncedCount,
        ticketsTotal: tasks.length,
      },
    });

    console.log(`Sync completed: ${syncedCount}/${tasks.length} tickets in ${duration}ms`);

    return {
      success: true,
      ticketsSynced: syncedCount,
      ticketsTotal: tasks.length,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update sync log with error
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage,
      },
    });

    console.error("Sync failed:", errorMessage);

    return {
      success: false,
      ticketsSynced: 0,
      ticketsTotal: 0,
      duration,
      error: errorMessage,
    };
  }
}

// Get last sync status
export async function getLastSyncStatus() {
  return prisma.syncLog.findFirst({
    orderBy: { startedAt: "desc" },
  });
}

// Check if sync is currently running
export async function isSyncRunning(): Promise<boolean> {
  const running = await prisma.syncLog.findFirst({
    where: { status: "running" },
    orderBy: { startedAt: "desc" },
  });
  
  // Consider sync as stuck if running for more than 10 minutes
  if (running && running.startedAt) {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (running.startedAt < tenMinutesAgo) {
      // Mark as failed
      await prisma.syncLog.update({
        where: { id: running.id },
        data: { status: "failed", errorMessage: "Sync timed out" },
      });
      return false;
    }
    return true;
  }
  
  return false;
}
