import { NextResponse } from "next/server";

export async function POST(request) {
  const response = NextResponse.json({ success: true });

  const cookies = request.cookies.getAll();

  cookies.forEach(cookie => {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
      });
    }

    if (cookie.name === "uniquePresence") {
      response.cookies.set(cookie.name, "", {
        path: "/",
        maxAge: 0,
      });
    }
  });

  return response;
}
