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

export interface CreateTaskData {
  name: string;
  description: string;
  priority?: number;
  assignees?: string[];
  status?: string;
  custom_fields?: Array<{
    id: string;
    value: string | number | boolean;
  }>;
}

export async function createTask(data: CreateTaskData): Promise<ClickUpTask> {
  const response = await fetch(`${CLICKUP_API_BASE}/list/${CLICKUP_LIST_ID}/task`, {
    method: "POST",
    headers: {
      "Authorization": CLICKUP_API_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ClickUp API error: ${response.status} - ${error}`);
  }

  return response.json();
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

export async function uploadAttachment(
  taskId: string,
  file: File | Blob
): Promise<void> {
  const formData = new FormData();
  formData.append("attachment", file, (file as File).name || "attachment");

  const response = await fetch(
    `${CLICKUP_API_BASE}/task/${taskId}/attachment`,
    {
      method: "POST",
      headers: {
        "Authorization": CLICKUP_API_TOKEN!,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ClickUp API error: ${response.status} - ${error}`);
  }
}

export function filterTasksByEmail(tasks: ClickUpTask[], email: string): ClickUpTask[] {
  return tasks.filter((task) => {
    // First priority: Check for "Email" or "Requester Email" custom field
    if (task.custom_fields) {
      for (const field of task.custom_fields) {
        // Look for email-related field names (case insensitive)
        const fieldName = field.name?.toLowerCase() || "";
        if (fieldName.includes("email") || fieldName.includes("e-mail")) {
          if (
            typeof field.value === "string" &&
            field.value.toLowerCase() === email.toLowerCase()
          ) {
            return true;
          }
        }
      }
    }
    
    // Fallback: Check if email is in description
    if (task.description?.toLowerCase().includes(email.toLowerCase())) {
      return true;
    }
    
    return false;
  });
}

