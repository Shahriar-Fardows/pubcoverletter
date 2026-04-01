import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretfallbackkey123!@#";

export async function GET(req: Request) {
  try {
    const cookiesArray = req.headers.get("cookie")?.split("; ");
    const tokenStr = cookiesArray?.find(row => row.startsWith("auth_token="));
    
    if (!tokenStr) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    
    const token = tokenStr.split("=")[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return NextResponse.json({ user: decoded }, { status: 200 });
    } catch {
      return NextResponse.json({ user: null }, { status: 401 });
    }
  } catch (error) {
    console.error("Auth verify error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
