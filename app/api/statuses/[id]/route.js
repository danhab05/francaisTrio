import { NextResponse } from "next/server";
import { setStatus } from "../../../../lib/db";

const ALLOWED = new Set(["new", "review", "known"]);

export async function POST(request, { params }) {
  const body = await request.json();
  const id = Number(params.id);
  const status = body?.status;

  if (!Number.isInteger(id) || !ALLOWED.has(status)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  setStatus(id, status);
  return NextResponse.json({ ok: true });
}
