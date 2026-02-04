import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://tarot-api-vercel.vercel.app/api/products/angeles_12/spread",
      { cache: "no-store" }
    );

    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "proxy_failed" },
      { status: 500 }
    );
  }
}
