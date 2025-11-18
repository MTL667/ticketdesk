const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;
const CLICKUP_LIST_ID = process.env.CLICKUP_LIST_ID;
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
  user: {
    id: number;
    username: string;
    email: string;
    color: string;
    profilePicture?: string;
  };
}

export async function getTasks(): Promise<ClickUpTask[]> {
  const response = await fetch(
    `${CLICKUP_API_BASE}/list/${CLICKUP_LIST_ID}/task?archived=false`,
    {
      headers: {
        "Authorization": CLICKUP_API_TOKEN!,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ClickUp API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.tasks || [];
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

