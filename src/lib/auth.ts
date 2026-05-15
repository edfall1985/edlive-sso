import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DrizzleAdapter } from "./drizzle-adapter";

const OWNER_EMAILS = (process.env.OWNER_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db as any),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .then((rows) => rows[0]);

        if (!user || !user.password_hash) return null;

        const valid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!valid) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.display_name,
          image: user.avatar_url,
          role: user.role || "user",
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const edliveUrl = process.env.EDLIVE_URL || "https://live.digtri.com";

      // Jika redirect ke EdLive (cross-domain), lewatkan sso-token dulu
      if (url.startsWith(edliveUrl)) {
        return `/api/auth/sso-token?redirect=${encodeURIComponent(url)}`;
      }

      // Default: redirect dalam domain yang sama
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
      }

      if (account?.provider === "google") {
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.email, token.email!))
          .then((rows) => rows[0]);

        if (dbUser) {
          token.role = dbUser.role || "user";
          token.id = String(dbUser.id);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase();
        if (!email) return false;

        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .then((rows) => rows[0]);

        if (existing) {
          const isOwner = OWNER_EMAILS.includes(email);
          const targetRole = isOwner ? "owner" : existing.role;

          if (existing.role !== targetRole || !existing.google_id) {
            await db
              .update(users)
              .set({
                google_id: account.providerAccountId,
                avatar_url: user.image,
                display_name: user.name || existing.display_name,
                role: targetRole,
              })
              .where(eq(users.id, existing.id));
          }
        } else {
          const isOwner = OWNER_EMAILS.includes(email);
          await db.insert(users).values({
            email,
            display_name: user.name || email.split("@")[0],
            avatar_url: user.image,
            google_id: account.providerAccountId,
            auth_provider: "google",
            role: isOwner ? "owner" : "user",
            email_verified: new Date(),
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
