export type Language = "nl" | "fr" | "en";

export const translations = {
  nl: {
    // Navigation
    servicedesk: "ServiceDesk",
    logout: "Uitloggen",
    back: "Terug",
    
    // Home page
    welcome: "Welkom bij ServiceDesk",
    welcomeDescription: "Maak een nieuw ticket aan of bekijk uw bestaande tickets.",
    newTicket: "Nieuw Ticket Aanmaken",
    newTicketDescription: "Dien een nieuwe aanvraag in via het ClickUp formulier",
    myTickets: "Mijn Tickets",
    myTicketsDescription: "Bekijk al uw bestaande tickets en hun status",
    
    // Sign in page
    signInTitle: "ServiceDesk",
    signInDescription: "Meld u aan met uw Microsoft-account",
    signInButton: "Aanmelden met Microsoft",
    signInFooter: "Door in te loggen gaat u akkoord met het gebruik van uw organisatieaccount",
    
    // Tickets list
    myTicketsTitle: "Mijn Tickets",
    newTicketButton: "+ Nieuw Ticket",
    searchPlaceholder: "Zoek tickets op naam, ID, status of beschrijving...",
    ticketsCount: "van",
    ticketsWord: "tickets",
    noTicketsFound: "Geen tickets gevonden voor",
    clearSearch: "Wis zoekopdracht",
    noTickets: "Er zijn nog geen tickets gevonden.",
    noTicketsHelp: "Controleer of er tickets in de ClickUp list staan en of de CLICKUP_LIST_ID correct is ingesteld.",
    createFirstTicket: "Maak uw eerste ticket aan →",
    
    // Ticket detail
    ticketDetails: "Ticket Details",
    ticketId: "Ticket ID",
    clickupId: "ClickUp ID",
    priority: "Prioriteit",
    status: "Status",
    createdOn: "Aangemaakt op",
    lastUpdated: "Laatst bijgewerkt",
    description: "Omschrijving",
    attachments: "Bijlagen",
    ticketNotFound: "Ticket niet gevonden",
    ticketNotFoundDescription: "Het ticket bestaat niet of u heeft geen toegang.",
    backToTickets: "← Terug naar Mijn Tickets",
    
    // New ticket page
    newTicketTitle: "Nieuw Ticket Aanmaken",
    formNotConfigured: "Het ClickUp formulier is nog niet geconfigureerd.",
    formNotConfiguredHelp: "Neem contact op met de beheerder om NEXT_PUBLIC_CLICKUP_FORM_URL in te stellen.",
    
    // Comments
    messages: "Berichten",
    refresh: "Ververs",
    loadingMessages: "Berichten laden...",
    noMessages: "Nog geen berichten.",
    noMessagesHelp: "Stel een vraag of laat een bericht achter!",
    you: "Jij",
    user: "Gebruiker",
    typeMessage: "Typ een bericht...",
    send: "Verzenden",
    messageNotification: "Je bericht wordt verzonden naar alle betrokkenen bij dit ticket",
    justNow: "Zojuist",
    minutesAgo: "minuten geleden",
    hoursAgo: "uur geleden",
    daysAgo: "dagen geleden",
    
    // Pagination
    previous: "Vorige",
    next: "Volgende",
    page: "Pagina",
    of: "van",
    
    // Loading
    loadingTickets: "Tickets worden geladen...",
    loadingSubtext: "Even geduld, we verzamelen je tickets 📋",
    loadingTicket: "Ticket laden...",
    loadingForm: "Formulier laden...",
    
    // Dates
    created: "Aangemaakt",
    
    // New ticket detail fields
    businessUnit: "Business Unit",
    jiraStatus: "Jira Status",
    jiraAssignee: "Jira Assignee",
    jiraUrl: "Jira Link",
    openInJira: "Open in Jira",
    inDevelopment: "in ontwikkeling",
  },
  fr: {
    // Navigation
    servicedesk: "ServiceDesk",
    logout: "Déconnexion",
    back: "Retour",
    
    // Home page
    welcome: "Bienvenue sur ServiceDesk",
    welcomeDescription: "Créez un nouveau ticket ou consultez vos tickets existants.",
    newTicket: "Créer un Nouveau Ticket",
    newTicketDescription: "Soumettez une nouvelle demande via le formulaire ClickUp",
    myTickets: "Mes Tickets",
    myTicketsDescription: "Consultez tous vos tickets existants et leur statut",
    
    // Sign in page
    signInTitle: "ServiceDesk",
    signInDescription: "Connectez-vous avec votre compte Microsoft",
    signInButton: "Se connecter avec Microsoft",
    signInFooter: "En vous connectant, vous acceptez l'utilisation de votre compte professionnel",
    
    // Tickets list
    myTicketsTitle: "Mes Tickets",
    newTicketButton: "+ Nouveau Ticket",
    searchPlaceholder: "Rechercher des tickets par nom, ID, statut ou description...",
    ticketsCount: "de",
    ticketsWord: "tickets",
    noTicketsFound: "Aucun ticket trouvé pour",
    clearSearch: "Effacer la recherche",
    noTickets: "Aucun ticket trouvé pour le moment.",
    noTicketsHelp: "Vérifiez qu'il y a des tickets dans la liste ClickUp et que CLICKUP_LIST_ID est correctement configuré.",
    createFirstTicket: "Créez votre premier ticket →",
    
    // Ticket detail
    ticketDetails: "Détails du Ticket",
    ticketId: "ID Ticket",
    clickupId: "ID ClickUp",
    priority: "Priorité",
    status: "Statut",
    createdOn: "Créé le",
    lastUpdated: "Dernière mise à jour",
    description: "Description",
    attachments: "Pièces jointes",
    ticketNotFound: "Ticket non trouvé",
    ticketNotFoundDescription: "Le ticket n'existe pas ou vous n'y avez pas accès.",
    backToTickets: "← Retour à Mes Tickets",
    
    // New ticket page
    newTicketTitle: "Créer un Nouveau Ticket",
    formNotConfigured: "Le formulaire ClickUp n'est pas encore configuré.",
    formNotConfiguredHelp: "Contactez l'administrateur pour configurer NEXT_PUBLIC_CLICKUP_FORM_URL.",
    
    // Comments
    messages: "Messages",
    refresh: "Actualiser",
    loadingMessages: "Chargement des messages...",
    noMessages: "Pas encore de messages.",
    noMessagesHelp: "Posez une question ou laissez un message !",
    you: "Vous",
    user: "Utilisateur",
    typeMessage: "Tapez un message...",
    send: "Envoyer",
    messageNotification: "Votre message sera envoyé à tous les participants de ce ticket",
    justNow: "À l'instant",
    minutesAgo: "minutes",
    hoursAgo: "heures",
    daysAgo: "jours",
    
    // Pagination
    previous: "Précédent",
    next: "Suivant",
    page: "Page",
    of: "de",
    
    // Loading
    loadingTickets: "Chargement des tickets...",
    loadingSubtext: "Veuillez patienter, nous récupérons vos tickets 📋",
    loadingTicket: "Chargement du ticket...",
    loadingForm: "Chargement du formulaire...",
    
    // Dates
    created: "Créé",
    
    // New ticket detail fields
    businessUnit: "Business Unit",
    jiraStatus: "Statut Jira",
    jiraAssignee: "Assigné Jira",
    jiraUrl: "Lien Jira",
    openInJira: "Ouvrir dans Jira",
    inDevelopment: "en développement",
  },
  en: {
    // Navigation
    servicedesk: "ServiceDesk",
    logout: "Logout",
    back: "Back",
    
    // Home page
    welcome: "Welcome to ServiceDesk",
    welcomeDescription: "Create a new ticket or view your existing tickets.",
    newTicket: "Create New Ticket",
    newTicketDescription: "Submit a new request via the ClickUp form",
    myTickets: "My Tickets",
    myTicketsDescription: "View all your existing tickets and their status",
    
    // Sign in page
    signInTitle: "ServiceDesk",
    signInDescription: "Sign in with your Microsoft account",
    signInButton: "Sign in with Microsoft",
    signInFooter: "By signing in, you agree to use your organization account",
    
    // Tickets list
    myTicketsTitle: "My Tickets",
    newTicketButton: "+ New Ticket",
    searchPlaceholder: "Search tickets by name, ID, status or description...",
    ticketsCount: "of",
    ticketsWord: "tickets",
    noTicketsFound: "No tickets found for",
    clearSearch: "Clear search",
    noTickets: "No tickets found yet.",
    noTicketsHelp: "Check if there are tickets in the ClickUp list and if CLICKUP_LIST_ID is correctly configured.",
    createFirstTicket: "Create your first ticket →",
    
    // Ticket detail
    ticketDetails: "Ticket Details",
    ticketId: "Ticket ID",
    clickupId: "ClickUp ID",
    priority: "Priority",
    status: "Status",
    createdOn: "Created on",
    lastUpdated: "Last updated",
    description: "Description",
    attachments: "Attachments",
    ticketNotFound: "Ticket not found",
    ticketNotFoundDescription: "The ticket does not exist or you don't have access.",
    backToTickets: "← Back to My Tickets",
    
    // New ticket page
    newTicketTitle: "Create New Ticket",
    formNotConfigured: "The ClickUp form is not yet configured.",
    formNotConfiguredHelp: "Contact the administrator to set up NEXT_PUBLIC_CLICKUP_FORM_URL.",
    
    // Comments
    messages: "Messages",
    refresh: "Refresh",
    loadingMessages: "Loading messages...",
    noMessages: "No messages yet.",
    noMessagesHelp: "Ask a question or leave a message!",
    you: "You",
    user: "User",
    typeMessage: "Type a message...",
    send: "Send",
    messageNotification: "Your message will be sent to all participants of this ticket",
    justNow: "Just now",
    minutesAgo: "minutes ago",
    hoursAgo: "hours ago",
    daysAgo: "days ago",
    
    // Pagination
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    
    // Loading
    loadingTickets: "Loading tickets...",
    loadingSubtext: "Please wait, we're gathering your tickets 📋",
    loadingTicket: "Loading ticket...",
    loadingForm: "Loading form...",
    
    // Dates
    created: "Created",
    
    // New ticket detail fields
    businessUnit: "Business Unit",
    jiraStatus: "Jira Status",
    jiraAssignee: "Jira Assignee",
    jiraUrl: "Jira Link",
    openInJira: "Open in Jira",
    inDevelopment: "in development",
  },
} as const;

export type TranslationKey = keyof typeof translations.nl;

