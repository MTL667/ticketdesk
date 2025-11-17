const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;
const CLICKUP_LIST_ID = process.env.CLICKUP_LIST_ID;
const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

export interface ClickUpFieldOption {
  id: string;
  name: string;
  value?: string;
  orderindex: number;
  color?: string;
}

export interface ClickUpField {
  id: string;
  name: string;
  type: string;
  type_config?: {
    options?: ClickUpFieldOption[];
    default?: number;
  };
  date_created: string;
  hide_from_guests: boolean;
  required?: boolean;
}

export interface ClickUpFieldsResponse {
  fields: ClickUpField[];
}

/**
 * Get all custom fields from the ClickUp list
 */
export async function getCustomFields(): Promise<ClickUpField[]> {
  const response = await fetch(
    `${CLICKUP_API_BASE}/list/${CLICKUP_LIST_ID}/field`,
    {
      headers: {
        Authorization: CLICKUP_API_TOKEN!,
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ClickUp API error: ${response.status} - ${error}`);
  }

  const data: ClickUpFieldsResponse = await response.json();
  return data.fields || [];
}

/**
 * Get a specific custom field by name
 */
export async function getCustomFieldByName(
  fieldName: string
): Promise<ClickUpField | null> {
  const fields = await getCustomFields();
  return fields.find((field) => field.name === fieldName) || null;
}

/**
 * Get custom field options for dropdown fields
 */
export async function getFieldOptions(
  fieldName: string
): Promise<ClickUpFieldOption[]> {
  const field = await getCustomFieldByName(fieldName);
  
  if (!field || field.type !== "drop_down") {
    return [];
  }

  return field.type_config?.options || [];
}

/**
 * Get all dropdown fields that we use for the ticket form
 */
export async function getTicketFormFields() {
  const fields = await getCustomFields();
  
  const typeVraagField = fields.find((f) => f.name === "Type vraag");
  const gebouwField = fields.find((f) => f.name === "Gebouw");
  const toepassingsgebiedField = fields.find((f) => f.name === "Toepassingsgebied");
  const requesterEmailField = fields.find((f) => f.name === "Requester Email");

  return {
    typeVraag: {
      field: typeVraagField,
      options: typeVraagField?.type_config?.options || [],
    },
    gebouw: {
      field: gebouwField,
      options: gebouwField?.type_config?.options || [],
    },
    toepassingsgebied: {
      field: toepassingsgebiedField,
      options: toepassingsgebiedField?.type_config?.options || [],
    },
    requesterEmail: {
      field: requesterEmailField,
    },
  };
}

