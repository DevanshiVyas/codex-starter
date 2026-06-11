import { sql } from "@/app/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const result = (await sql`SELECT version()`) as { version: string }[];

  return NextResponse.json(result[0] ?? { version: null });
}
