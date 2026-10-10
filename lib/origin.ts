import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://hapixflix.vercel.app",
  "https://hapixflix-iota.vercel.app",
  "https://anixflix-iota.vercel.app",
  "https://anixflix-qhjzouxr8-anikets-projects-3a166fd1.vercel.app",
  "http://localhost:3000",
];

export function validateOrigin(origin: string | null): boolean {
  if (!origin) return true;
  return ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));
}

export function originBlockedResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
