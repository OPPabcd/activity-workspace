import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json();
  const adminPassword = (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim()) || "changeme";

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Password salah" }, { status: 401 });
  }

  const token = await signToken({ user: "admin" });
  const res = NextResponse.json({ success: true });

  res.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    maxAge: 315360000, // 10 tahun
    path: "/",
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("session", "", { maxAge: 0, path: "/" });
  return res;
}
