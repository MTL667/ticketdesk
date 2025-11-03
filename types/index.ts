export interface TicketFormData {
  typeVraag: string;
  typeVraagOther?: string;
  gebouw: string;
  gebouwOther?: string;
  toepassingsgebied: string;
  toepassingsgebiedOther?: string;
  korteOmschrijving: string;
  volledigeOmschrijving: string;
  prioriteit: "urgent" | "high" | "normal" | "low";
  attachments?: File[];
}

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


