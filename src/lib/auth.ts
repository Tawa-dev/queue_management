import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    zoneId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      zoneId?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Staff Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValidPassword = await compare(password, user.passwordHash);

        if (!isValidPassword) {
          return null;
        }

        // Resolve zoneId at login time so it's baked into the JWT.
        // Staff with an assigned zone use it directly. Zone-less users
        // (admins) get Zone A's ID resolved once here — never again per
        // session — eliminating the zone fallback DB query on every poll.
        let zoneId = user.zoneId;
        if (!zoneId) {
          const defaultZone = await db.zone.findFirst({
            where: { code: "A" },
            select: { id: true },
          });
          zoneId = defaultZone?.id ?? null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          zoneId,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // 12 hours (covers standard shift duration)
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.zoneId = user.zoneId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.role = token.role as Role;
        session.user.zoneId = token.zoneId as string | null;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
