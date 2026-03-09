import { NextResponse } from "next/server";

export async function middleware(request) {
  const cookies = request.cookies.getAll();
  const authCookie = cookies.find(cookie => 
    cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );
  
  if (!authCookie) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  try {
    const session = JSON.parse(authCookie.value);

    const expiresAt = session.expires_at;
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (expiresAt && expiresAt < currentTime) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
  } catch (error) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/user/:path*'],
};
