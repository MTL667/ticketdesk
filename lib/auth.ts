import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import type { DefaultSession } from "next-auth";

const allowedTenants = process.env.ALLOWED_TENANTS?.split(",").map((t) => t.trim()) || [];

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email",
          ...(process.env.AZURE_AD_TENANT_ID && process.env.AZURE_AD_TENANT_ID !== "common"
            ? { tenant: process.env.AZURE_AD_TENANT_ID }
            : {}),
        },
      },
      ...(process.env.AZURE_AD_TENANT_ID && process.env.AZURE_AD_TENANT_ID !== "common"
        ? { tenantId: process.env.AZURE_AD_TENANT_ID }
        : {}),
    } as any),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (!account?.id_token) {
        return false;
      }

      // Extract tenant ID from the ID token
      const tokenParts = account.id_token.split(".");
      if (tokenParts.length !== 3) {
        return false;
      }

      try {
        const payload = JSON.parse(
          Buffer.from(tokenParts[1], "base64").toString("utf-8")
        );
        const tenantId = payload.tid;

        // Check if tenant is in allowed list
        if (!allowedTenants.includes(tenantId)) {
          console.warn(`Sign-in rejected: Tenant ${tenantId} not in allowed list`);
          return false;
        }

        // Store tenant ID in user object for later use
        user.tenantId = tenantId;
        return true;
      } catch (error) {
        console.error("Error parsing ID token:", error);
        return false;
      }
    },
    async jwt({ token, user, account }: any) {
      if (user?.tenantId) {
        token.tenantId = user.tenantId;
      }
      if (user?.email) {
        token.email = user.email;
      }
      if (account?.id_token) {
        // Store tenant ID from token if not already set
        try {
          const tokenParts = account.id_token.split(".");
          if (tokenParts.length === 3) {
            const payload = JSON.parse(
              Buffer.from(tokenParts[1], "base64").toString("utf-8")
            );
            token.tenantId = payload.tid;
          }
        } catch (error) {
          console.error("Error extracting tenant from token:", error);
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.tenantId = token.tenantId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/api/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};

// Initialize NextAuth and export handlers, auth function, etc.
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);


