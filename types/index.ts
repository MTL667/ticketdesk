export interface Ticket {
  id: string;
  name: string;
  description: string;
  status: string;
  priority?: string;
  typeVraag?: string;
  gebouw?: string;
  toepassingsgebied?: string;
  dateCreated: string;
  dateUpdated: string;
  attachments?: Array<{
    id: string;
    url: string;
    title: string;
  }>;
}


