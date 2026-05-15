import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");

    return NextResponse.json({ valid: true, user: decoded });
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
