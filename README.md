# ServiceDesk

A production-ready Next.js 15.4 application for managing internal support tickets, integrated with ClickUp and authenticated via Microsoft Entra ID (Azure AD).

## Features

- **Azure AD Multi-Tenant Authentication**: Secure authentication with Microsoft Entra ID, supporting multiple tenants with tenant validation
- **ClickUp Integration**: All ticket data is stored and managed through ClickUp API (no database required)
- **ClickUp Form Integration**: Create tickets via ClickUp forms with automatic email pre-filling
- **Pagination & Search**: Browse tickets 10 at a time with instant search functionality
- **Automatic Email Tracking**: User email is automatically pre-filled in ClickUp forms for filtering
- **Ticket Viewing**: Users can view their own tickets with status, attachments, and full details
- **Bilingual Support**: Dutch/French interface
- **Docker Support**: Ready for containerized deployment

## Tech Stack

- Next.js 15.4 (App Router)
- TypeScript
- Tailwind CSS
- NextAuth.js v5 (Azure AD provider)
- ClickUp API

## Prerequisites

- Node.js 20+
- ClickUp account with API token
- Azure AD application registered in Microsoft Entra ID
- Docker (for containerized deployment)

## Setup

### 1. Clone and Install

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in all required values:

```bash
cp .env.example .env
```

Required environment variables:

- `CLICKUP_API_TOKEN`: Your ClickUp API token
- `CLICKUP_LIST_ID`: The ClickUp List ID where tickets will be created
- `AZURE_AD_CLIENT_ID`: Azure AD application client ID
- `AZURE_AD_CLIENT_SECRET`: Azure AD application client secret
- `AZURE_AD_TENANT_ID`: Set to `"common"` or `"organizations"` for multi-tenant
- `ALLOWED_TENANTS`: Comma-separated list of allowed tenant IDs (GUIDs)
- `NEXTAUTH_SECRET`: Random secret for NextAuth (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your application URL (e.g., `http://localhost:3000` for development)
- `NEXT_PUBLIC_BASE_URL`: Public base URL of the application
- `NEXT_PUBLIC_CLICKUP_FORM_URL`: URL to your ClickUp form (e.g., `https://forms.clickup.com/xxxxx/f/xxxxx/xxxxxx`)

### 3. Azure AD Configuration

1. Register an application in Azure AD (Microsoft Entra ID)
2. Configure redirect URI: `{NEXTAUTH_URL}/api/auth/callback/azure-ad`
3. Enable multi-tenant support if needed
4. Add required API permissions (Microsoft Graph - User.Read)
5. Set `ALLOWED_TENANTS` to restrict access to specific tenant IDs

### 4. ClickUp Configuration

1. Create a List in ClickUp where tickets will be stored
2. Get the List ID from the ClickUp URL (format: `/v/li/{LIST_ID}`)
3. Generate an API token in ClickUp Settings > Apps > API
4. Add the token and List ID to your `.env` file
5. Create a custom field for email tracking:
   - Go to your ClickUp List settings
   - Add a custom field with type "Email" or "Text" 
   - Name it "Contact Email" (or similar)
   - Note the field ID (default: `e041d530-cb4e-4fd1-9759-9cb3f9a9cbe4`)
   - If you use a different field ID, update `EMAIL_FIELD_ID` in `lib/clickup.ts`
6. Create a ClickUp Form:
   - Go to your ClickUp List
   - Click on "Forms" in the menu
   - Create a new form with the necessary fields (including "Contact Email")
   - Publish the form and copy the public URL
   - Add this URL to `NEXT_PUBLIC_CLICKUP_FORM_URL` in your environment variables

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
npm start
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t ticketdesk .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e CLICKUP_API_TOKEN=your_token \
  -e CLICKUP_LIST_ID=your_list_id \
  -e AZURE_AD_CLIENT_ID=your_client_id \
  -e AZURE_AD_CLIENT_SECRET=your_client_secret \
  -e AZURE_AD_TENANT_ID=common \
  -e ALLOWED_TENANTS=tenant-id-1,tenant-id-2 \
  -e NEXTAUTH_SECRET=your_secret \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXT_PUBLIC_BASE_URL=http://localhost:3000 \
  ticketdesk
```

Or use a `.env` file:

```bash
docker run -p 3000:3000 --env-file .env ticketdesk
```

## Project Structure

```
/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/             # NextAuth routes
│   │   └── tickets/          # Ticket API endpoints
│   ├── tickets/              # Ticket pages
│   │   ├── new/              # Create new ticket
│   │   └── [id]/             # Ticket detail page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/               # React components
│   └── TicketForm.tsx        # Ticket creation form
├── lib/                      # Utility functions
│   └── clickup.ts            # ClickUp API integration
├── types/                    # TypeScript type definitions
├── middleware.ts             # Route protection middleware
├── Dockerfile                # Multi-stage Docker build
└── next.config.mjs           # Next.js configuration
```

## Usage

1. **Sign In**: Users from allowed Azure AD tenants can sign in with their Microsoft account
2. **Create Ticket**: Click "Nieuw Ticket Aanmaken" to open the ClickUp form
   - Your email address is **automatically pre-filled** in the form
   - Complete the form in ClickUp and submit
3. **View Tickets**: Access "Mijn Tickets" to see all tickets associated with your email
   - Use the search bar to find specific tickets
   - Navigate through pages (10 tickets per page)
4. **Ticket Details**: Click on any ticket to view full details, status, and attachments

## Ticket Filtering Configuration

⚠️ **Email filtering is ACTIVE** - users only see tickets associated with their email address.

### How It Works:

When a user creates a ticket via the ClickUp form, their email is **automatically pre-filled** using URL parameters. The ClickUp form must save this email to the custom field with ID `e041d530-cb4e-4fd1-9759-9cb3f9a9cbe4`.

When viewing tickets, the app filters by searching for the user's email in:
1. **Specific custom field** with ID `e041d530-cb4e-4fd1-9759-9cb3f9a9cbe4` (highest priority)
2. **Custom fields** named "email", "e-mail", "contact" or containing "email" (case insensitive fallback)
3. **Description** text (last resort fallback)

### Setup Requirements:

1. Create a custom field in your ClickUp List named "Contact Email" (type: Email or Text)
2. Add this field to your ClickUp Form
3. The field will be automatically pre-filled when users access the form through the application
4. Make sure the field ID matches `e041d530-cb4e-4fd1-9759-9cb3f9a9cbe4` or update the constant in `lib/clickup.ts`

### Important Notes:

- ✅ Users only see tickets with their email address
- 🔒 This provides privacy - users cannot see each other's tickets
- ✨ Email is automatically pre-filled in the ClickUp form
- 🔧 The ClickUp form field name must match the URL parameter: "Contact Email"

## Security

- All routes (except auth) are protected by middleware
- Only users from allowed tenants can sign in
- All ClickUp API calls happen server-side
- Session management via NextAuth with secure cookies
- Input validation on both client and server

## License

Private/internal use only.


