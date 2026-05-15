import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .then((rows) => rows[0]);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const token = jwt.sign(
      {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.display_name,
        role: dbUser.role,
        avatar: dbUser.avatar_url,
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "24h" },
    );

    return NextResponse.json({ token, user: dbUser });
  } catch (error) {
    console.error("SSO route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
