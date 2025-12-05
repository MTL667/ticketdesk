import prisma from "./prisma";

const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;
const CLICKUP_LIST_IDS = process.env.CLICKUP_LIST_IDS;
const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

// Custom field IDs
const TICKET_ID_FIELD_ID = "faadba80-e7bc-474e-b01c-1a1c965c9a76";
const EMAIL_FIELD_ID = "e041d530-cb4e-4fd1-9759-9cb3f9a9cbe4";
const RELEASE_NOTES_FIELD_ID = "060ed832-9a39-4143-8c9b-571b346eba15";

// Helper to safely convert any value to string or null
function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value || null;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return null;
}

// Helper to extract custom field value by name
function getCustomFieldByName(fields: any[] | undefined, name: string): string | null {
  if (!fields) return null;
  const field = fields.find(f => f.name?.toLowerCase().includes(name.toLowerCase()));
  if (!field) return null;
  
  if (field.type === "drop_down" && field.type_config?.options && typeof field.value === "number") {
    const option = field.type_config.options[field.value];
    return option?.name || toStringOrNull(field.value);
  }
  
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
  
  if (field.type === "drop_down" && field.type_config?.options && typeof field.value === "number") {
    const option = field.type_config.options[field.value];
    return option?.name || toStringOrNull(field.value);
  }
  
  return toStringOrNull(field.value);
}

// Extract email from task
function extractEmail(task: any): string | null {
  const emailFromField = getCustomFieldById(task.custom_fields, EMAIL_FIELD_ID);
  if (emailFromField && emailFromField.includes("@")) return emailFromField.toLowerCase();

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

  if (task.description) {
    const emailMatch = task.description.match(/[\w.-]+@[\w.-]+\.\w+/i);
    if (emailMatch) return emailMatch[0].toLowerCase();
  }

  return null;
}

// Helper to get boolean custom field by ID (checkbox type)
function getBooleanCustomFieldById(fields: any[] | undefined, fieldId: string): boolean {
  if (!fields) return false;
  const field = fields.find(f => f.id === fieldId);
  if (!field) return false;
  
  // Checkbox fields have value = true/false
  if (typeof field.value === "boolean") return field.value;
  // Sometimes it's a string "true"/"false"
  if (typeof field.value === "string") return field.value.toLowerCase() === "true";
  // Or it could be 1/0
  if (typeof field.value === "number") return field.value === 1;
  
  return false;
}

// Convert task to database format
function taskToTicket(task: any) {
  const email = extractEmail(task);
  
  // Parse due date if present
  let dueDate: Date | null = null;
  if (task.due_date) {
    try {
      dueDate = new Date(parseInt(task.due_date));
    } catch {
      dueDate = null;
    }
  }
  
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
    releaseNotes: getBooleanCustomFieldById(task.custom_fields, RELEASE_NOTES_FIELD_ID),
    dueDate: dueDate,
    clickupCreatedAt: new Date(parseInt(task.date_created)),
    clickupUpdatedAt: new Date(parseInt(task.date_updated)),
  };
}

// Fetch a single page of tasks from ClickUp
async function fetchTasksPage(listId: string, page: number): Promise<{ tasks: any[], hasMore: boolean }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
  
  try {
    const response = await fetch(
      `${CLICKUP_API_BASE}/list/${listId}/task?archived=false&page=${page}&subtasks=false&include_closed=true`,
      {
        headers: { "Authorization": CLICKUP_API_TOKEN! },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error fetching page ${page} from list ${listId}:`, error);
      return { tasks: [], hasMore: false };
    }
    
    const data = await response.json();
    const tasks = data.tasks || [];
    
    return {
      tasks,
      hasMore: tasks.length >= 100, // ClickUp returns max 100 per page
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Exception fetching page ${page} from list ${listId}:`, error);
    return { tasks: [], hasMore: false };
  }
}

// Save tasks to database
async function saveTasks(tasks: any[]): Promise<number> {
  let saved = 0;
  
  for (const task of tasks) {
    try {
      const ticketData = taskToTicket(task);
      
      await prisma.ticket.upsert({
        where: { id: task.id },
        update: { ...ticketData, syncedAt: new Date() },
        create: { ...ticketData, syncedAt: new Date() },
      });
      saved++;
    } catch (error) {
      console.error(`Error saving task ${task.id}:`, error);
    }
  }
  
  return saved;
}

export interface SyncResult {
  success: boolean;
  ticketsSynced: number;
  ticketsTotal: number;
  duration: number;
  error?: string;
}

// Main sync function - fetches and saves in batches
export async function syncTicketsFromClickUp(): Promise<SyncResult> {
  const startTime = Date.now();
  
  if (!CLICKUP_LIST_IDS) {
    return { success: false, ticketsSynced: 0, ticketsTotal: 0, duration: 0, error: "CLICKUP_LIST_IDS not set" };
  }
  
  const listIds = CLICKUP_LIST_IDS.split(',').map(id => id.trim()).filter(id => id.length > 0);
  
  // Create sync log
  const syncLog = await prisma.syncLog.create({
    data: { status: "running" },
  });
  
  console.log(`=== Starting sync (ID: ${syncLog.id}) ===`);
  console.log(`Lists to sync: ${listIds.join(', ')}`);
  
  let totalSynced = 0;
  let totalFetched = 0;
  
  try {
    for (const listId of listIds) {
      console.log(`\n--- Syncing list ${listId} ---`);
      
      let page = 0;
      let hasMore = true;
      let listTotal = 0;
      
      while (hasMore) {
        console.log(`Fetching page ${page}...`);
        
        const { tasks, hasMore: more } = await fetchTasksPage(listId, page);
        hasMore = more;
        
        if (tasks.length > 0) {
          console.log(`Got ${tasks.length} tasks, saving to database...`);
          const saved = await saveTasks(tasks);
          totalSynced += saved;
          totalFetched += tasks.length;
          listTotal += tasks.length;
          
          console.log(`✓ Page ${page}: saved ${saved}/${tasks.length} tasks (list total: ${listTotal})`);
          
          // Update sync log with progress
          await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: { 
              ticketsSynced: totalSynced,
              ticketsTotal: totalFetched,
            },
          });
        }
        
        page++;
        
        // Small delay between pages
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`✓ List ${listId} complete: ${listTotal} tasks`);
      
      // Delay between lists
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const duration = Date.now() - startTime;
    
    // Mark as completed
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        ticketsSynced: totalSynced,
        ticketsTotal: totalFetched,
      },
    });
    
    console.log(`\n=== Sync completed ===`);
    console.log(`Total: ${totalSynced}/${totalFetched} tasks in ${Math.round(duration / 1000)}s`);
    
    return {
      success: true,
      ticketsSynced: totalSynced,
      ticketsTotal: totalFetched,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage,
        ticketsSynced: totalSynced,
        ticketsTotal: totalFetched,
      },
    });
    
    console.error(`Sync failed: ${errorMessage}`);
    
    return {
      success: false,
      ticketsSynced: totalSynced,
      ticketsTotal: totalFetched,
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
  
  if (!running) {
    return false;
  }
  
  // Consider stuck if running for more than 20 minutes
  if (running.startedAt) {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
    if (running.startedAt < twentyMinutesAgo) {
      console.log(`Marking stuck sync ${running.id} as failed`);
      await prisma.syncLog.update({
        where: { id: running.id },
        data: { status: "failed", errorMessage: "Sync timed out after 20 minutes" },
      });
      return false;
    }
  }
  
  return true;
}

// Reset all stuck syncs
export async function resetStuckSyncs(): Promise<number> {
  const result = await prisma.syncLog.updateMany({
    where: { status: "running" },
    data: { 
      status: "failed", 
      errorMessage: "Manually reset",
      completedAt: new Date(),
    },
  });
  
  console.log(`Reset ${result.count} stuck syncs`);
  return result.count;
}
