import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url =
      "https://tarot-api-vercel.vercel.app/api/products/angeles_12/spread";

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "upstream_error", status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
