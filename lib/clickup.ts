const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;
const CLICKUP_LIST_IDS = process.env.CLICKUP_LIST_IDS; // Comma-separated list IDs
const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

export interface ClickUpTask {
  id: string;
  name: string;
  description: string;
  status: {
    status: string;
    color: string;
  };
  date_created: string;
  date_updated: string;
  assignees: any[];
  priority?: {
    priority: string;
    color: string;
  };
  custom_fields?: Array<{
    id: string;
    name: string;
    value: string | number | boolean;
  }>;
  attachments?: Array<{
    id: string;
    url: string;
    title: string;
    date_added: string;
  }>;
}

export interface ClickUpComment {
  id: string;
  comment_text: string;
  date: number;
  user?: {
    id?: number;
    username?: string;
    email?: string;
    color?: string;
    profilePicture?: string;
  };
}

// Helper function to fetch with retry and timeout
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 5): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      // 2 minute timeout - ClickUp can be very slow for large lists
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      console.log(`Fetching (attempt ${attempt}/${maxRetries}): ${url.split('?')[0]}...`);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      // If rate limited (429), wait and retry
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '10');
        console.log(`Rate limited, waiting ${retryAfter}s before retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      // For server errors (5xx), retry with backoff
      if (response.status >= 500) {
        const waitTime = Math.min(Math.pow(2, attempt) * 2000, 30000); // Max 30s wait
        console.log(`Server error ${response.status}, waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // For other errors, return the response
      return response;
    } catch (error) {
      lastError = error as Error;
      if ((error as Error).name === 'AbortError') {
        console.log(`Request timeout after 2min, attempt ${attempt}/${maxRetries}`);
      } else {
        console.log(`Fetch error: ${(error as Error).message}, attempt ${attempt}/${maxRetries}`);
      }
      
      if (attempt < maxRetries) {
        // Longer wait between retries for timeouts
        const waitTime = Math.min(Math.pow(2, attempt) * 3000, 30000);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('Failed after max retries');
}

async function fetchAllTasksFromList(listId: string): Promise<ClickUpTask[]> {
  const allTasks: ClickUpTask[] = [];
  let page = 0;
  let hasMore = true;

  console.log(`Starting to fetch tasks from list ${listId}...`);

  while (hasMore) {
    try {
      const response = await fetchWithRetry(
        `${CLICKUP_API_BASE}/list/${listId}/task?archived=false&page=${page}&subtasks=false&include_closed=true`,
        {
          headers: {
            "Authorization": CLICKUP_API_TOKEN!,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`Error fetching tasks from list ${listId} (page ${page}):`, error);
        // Continue with what we have
        break;
      }

      const data = await response.json();
      const tasks = data.tasks || [];
      
      if (tasks.length === 0) {
        hasMore = false;
      } else {
        allTasks.push(...tasks);
        console.log(`List ${listId}: fetched page ${page}, got ${tasks.length} tasks (total: ${allTasks.length})`);
        page++;
        
        // ClickUp returns up to 100 tasks per page
        if (tasks.length < 100) {
          hasMore = false;
        }
        
        // Delay between pages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Exception fetching tasks from list ${listId} (page ${page}):`, error);
      // Continue with what we have instead of failing completely
      console.log(`Continuing with ${allTasks.length} tasks fetched so far from list ${listId}`);
      break;
    }
  }

  console.log(`✓ Fetched ${allTasks.length} tasks from list ${listId} across ${page} pages`);
  return allTasks;
}

export async function getTasks(): Promise<ClickUpTask[]> {
  if (!CLICKUP_LIST_IDS) {
    throw new Error("CLICKUP_LIST_IDS environment variable is not set");
  }

  // Split the comma-separated list IDs and trim whitespace
  const listIds = CLICKUP_LIST_IDS.split(',').map(id => id.trim()).filter(id => id.length > 0);
  
  if (listIds.length === 0) {
    throw new Error("No valid list IDs found in CLICKUP_LIST_IDS");
  }

  console.log(`Fetching tasks from ${listIds.length} list(s) sequentially...`);

  // Fetch lists sequentially to avoid overloading ClickUp API
  const allTasks: ClickUpTask[] = [];
  for (const listId of listIds) {
    try {
      const tasks = await fetchAllTasksFromList(listId);
      allTasks.push(...tasks);
      console.log(`Running total: ${allTasks.length} tasks`);
      
      // Small delay between lists
      if (listIds.indexOf(listId) < listIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Failed to fetch list ${listId}:`, error);
      // Continue with other lists
    }
  }
  
  console.log(`✓ Total tasks fetched: ${allTasks.length}`);
  
  // Sort by date_created descending (newest first)
  allTasks.sort((a, b) => {
    const dateA = new Date(a.date_created).getTime();
    const dateB = new Date(b.date_created).getTime();
    return dateB - dateA;
  });

  return allTasks;
}

export async function getTask(taskId: string): Promise<ClickUpTask> {
  const response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}`, {
    headers: {
      "Authorization": CLICKUP_API_TOKEN!,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ClickUp API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export function filterTasksByEmail(tasks: ClickUpTask[], email: string): ClickUpTask[] {
  // Known email custom field ID from ClickUp
  const EMAIL_FIELD_ID = "e041d530-cb4e-4fd1-9759-9cb3f9a9cbe4";
  
  return tasks.filter((task) => {
    // First priority: Check for the specific email custom field ID
    if (task.custom_fields) {
      for (const field of task.custom_fields) {
        // Check by field ID (most reliable)
        if (field.id === EMAIL_FIELD_ID) {
          if (
            typeof field.value === "string" &&
            field.value.toLowerCase() === email.toLowerCase()
          ) {
            return true;
          }
        }
        
        // Fallback: Check by field name (for flexibility)
        const fieldName = field.name?.toLowerCase() || "";
        if (fieldName.includes("email") || fieldName.includes("e-mail") || fieldName.includes("contact")) {
          if (
            typeof field.value === "string" &&
            field.value.toLowerCase() === email.toLowerCase()
          ) {
            return true;
          }
        }
      }
    }
    
    // Last resort: Check if email is in description
    if (task.description?.toLowerCase().includes(email.toLowerCase())) {
      return true;
    }
    
    return false;
  });
}

// Get comments for a task
export async function getTaskComments(taskId: string): Promise<ClickUpComment[]> {
  const response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}/comment`, {
    headers: {
      "Authorization": CLICKUP_API_TOKEN!,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ClickUp API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.comments || [];
}

// Post a new comment to a task
export async function postTaskComment(taskId: string, commentText: string): Promise<ClickUpComment> {
  const response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}/comment`, {
    method: "POST",
    headers: {
      "Authorization": CLICKUP_API_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      comment_text: commentText,
      notify_all: true, // Notify all task members
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ClickUp API error: ${response.status} - ${error}`);
  }

  return response.json();
}

