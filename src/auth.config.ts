import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config shared between the middleware (proxy) and the
 * full server-side auth instance. Must NOT import Prisma or bcrypt.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
} satisfies NextAuthConfig;