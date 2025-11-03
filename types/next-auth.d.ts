import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      email: string;
      tenantId: string;
    };
  }

  interface User {
    tenantId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    email?: string;
    tenantId?: string;
  }
}


