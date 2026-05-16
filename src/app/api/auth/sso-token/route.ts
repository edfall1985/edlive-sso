import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const redirectUrl = searchParams.get("redirect") || process.env.EDLIVE_URL || "https://live.digtri.com";

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      // Belum login — redirect ke login SSO
      const ssoUrl = process.env.NEXTAUTH_URL || "https://sso.digtri.com";
      return NextResponse.redirect(
        `${ssoUrl}/login?callbackUrl=${encodeURIComponent(redirectUrl)}`,
      );
    }

    // Cari user di DB
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .then((rows) => rows[0]);

    if (!dbUser) {
      const ssoUrl = process.env.NEXTAUTH_URL || "https://sso.digtri.com";
      return NextResponse.redirect(
        `${ssoUrl}/login?error=UserNotFound`,
      );
    }

    // Generate JWT token untuk EdLive
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

    // Redirect ke EdLive dengan token
    const edliveUrl = new URL(redirectUrl);
    edliveUrl.searchParams.set("token", token);

    return NextResponse.redirect(edliveUrl.toString());
  } catch (error) {
    console.error("SSO token error:", error);
    const fallback = process.env.EDLIVE_URL || "https://live.digtri.com";
    return NextResponse.redirect(fallback);
  }
}
