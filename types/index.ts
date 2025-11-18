export interface Ticket {
  id: string;
  ticketId?: string; // Custom field: Ticket ID
  name: string;
  description: string;
  status: string;
  priority?: string;
  dateCreated: string;
  dateUpdated: string;
  attachments?: Array<{
    id: string;
    url: string;
    title: string;
  }>;
}


