import { NextResponse } from "next/server";
import { getAllStatuses, resetStatuses } from "../../../lib/db";

export async function GET() {
  return NextResponse.json({ statuses: getAllStatuses() });
}

export async function DELETE() {
  resetStatuses();
  return NextResponse.json({ ok: true });
}
