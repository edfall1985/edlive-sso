import type {
  Adapter,
  AdapterUser,
  AdapterAccount,
  AdapterSession,
  VerificationToken,
} from "next-auth/adapters";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";

function toUser(u: typeof users.$inferSelect): AdapterUser {
  return {
    id: String(u.id),
    email: u.email,
    emailVerified: u.email_verified,
    name: u.display_name,
    image: u.avatar_url,
    role: u.role || "user",
  } as AdapterUser;
}

export function DrizzleAdapter(db: MySql2Database): Adapter {
  return {
    async createUser(data: AdapterUser) {
      const [user] = await db
        .insert(users)
        .values({
          email: data.email,
          display_name: data.name,
          avatar_url: data.image,
          email_verified: data.emailVerified,
        })
        .$returningId();

      const [newUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id));

      return toUser(newUser);
    },

    async getUser(id: string) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(id)));

      return user ? toUser(user) : null;
    },

    async getUserByEmail(email: string) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      return user ? toUser(user) : null;
    },

    async getUserByAccount({
      providerAccountId,
      provider,
    }: {
      providerAccountId: string;
      provider: string;
    }) {
      const [account] = await db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.providerAccountId, providerAccountId),
            eq(accounts.provider, provider),
          ),
        );

      if (!account) return null;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, account.userId));

      return user ? toUser(user) : null;
    },

    async updateUser(data: Partial<AdapterUser> & { id: string }) {
      await db
        .update(users)
        .set({
          display_name: data.name,
          avatar_url: data.image,
          email_verified: data.emailVerified,
        })
        .where(eq(users.id, Number(data.id)));

      const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(data.id)));

      return toUser(updated);
    },

    async deleteUser(id: string) {
      await db.delete(users).where(eq(users.id, Number(id)));
    },

    async linkAccount(data: AdapterAccount) {
      await db.insert(accounts).values({
        userId: Number(data.userId),
        type: data.type,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        refresh_token: data.refresh_token,
        access_token: data.access_token,
        expires_at: data.expires_at,
        token_type: data.token_type,
        scope: data.scope,
        id_token: data.id_token,
        session_state: data.session_state,
      });
    },

    async unlinkAccount({
      providerAccountId,
      provider,
    }: {
      providerAccountId: string;
      provider: string;
    }) {
      await db
        .delete(accounts)
        .where(
          and(
            eq(accounts.providerAccountId, providerAccountId),
            eq(accounts.provider, provider),
          ),
        );
    },

    async createSession(data: {
      sessionToken: string;
      userId: string;
      expires: Date;
    }) {
      const [session] = await db
        .insert(sessions)
        .values({
          sessionToken: data.sessionToken,
          userId: Number(data.userId),
          expires: data.expires,
        })
        .$returningId();

      const [newSession] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, session.id));

      return {
        id: String(newSession.id),
        sessionToken: newSession.sessionToken,
        userId: String(newSession.userId),
        expires: newSession.expires,
      };
    },

    async getSessionAndUser(sessionToken: string) {
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, sessionToken));

      if (!session) return null;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));

      if (!user) return null;

      return {
        session: {
          id: String(session.id),
          sessionToken: session.sessionToken,
          userId: String(session.userId),
          expires: session.expires,
        },
        user: toUser(user),
      };
    },

    async updateSession(data: Partial<AdapterSession> & { sessionToken: string }) {
      await db
        .update(sessions)
        .set({
          expires: data.expires,
        })
        .where(eq(sessions.sessionToken, data.sessionToken));

      const [updated] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, data.sessionToken));

      if (!updated) return null;

      return {
        id: String(updated.id),
        sessionToken: updated.sessionToken,
        userId: String(updated.userId),
        expires: updated.expires,
      };
    },

    async deleteSession(sessionToken: string) {
      await db
        .delete(sessions)
        .where(eq(sessions.sessionToken, sessionToken));
    },

    async createVerificationToken(data: VerificationToken) {
      await db.insert(verificationTokens).values({
        identifier: data.identifier,
        token: data.token,
        expires: data.expires,
      });

      return data;
    },

    async useVerificationToken({
      identifier,
      token,
    }: {
      identifier: string;
      token: string;
    }) {
      const [vt] = await db
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        );

      if (!vt) return null;

      await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        );

      return {
        identifier: vt.identifier,
        token: vt.token,
        expires: vt.expires,
      };
    },
  };
}
