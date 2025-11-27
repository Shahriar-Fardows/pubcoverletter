// app/api/session/route.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const sessionId = uuidv4();

  // iccha hole cookie te set korte paro future e
  return NextResponse.json({ sessionId });
}
