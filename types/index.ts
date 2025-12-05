export interface Ticket {
  id: string;
  ticketId?: string; // Custom field: Ticket ID
  name: string;
  description: string;
  status: string;
  priority?: string;
  dateCreated: string;
  dateUpdated: string;
  // New fields
  businessUnit?: string;
  jiraStatus?: string;
  jiraAssignee?: string;
  jiraUrl?: string;
  attachments?: Array<{
    id: string;
    url: string;
    title: string;
  }>;
}


