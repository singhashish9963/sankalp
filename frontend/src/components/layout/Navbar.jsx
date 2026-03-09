"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ChevronDown, LogOut, User, LayoutDashboard } from "lucide-react";



export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [session, setSession] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Load session and subscribe to changes
  useEffect(() => {
    let unsub;
    const load = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error) setSession(session || null);
    };
    load();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session || null);
    });
    unsub = data?.subscription;

    return () => {
      unsub?.unsubscribe?.();
    };
  }, []);

  // Derived user fields
  const user = session?.user || null;
  const displayName = useMemo(() => {
    const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
    return name;
  }, [user]);
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const initials = useMemo(() => {
    const name = displayName?.trim() || "";
    if (!name) return "?";
    const parts = name.split(/\s+/);
    const chars = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
    return chars.toUpperCase() || "?";
  }, [displayName]);

  // Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      localStorage.removeItem("user_id");
      localStorage.removeItem("role");
      // Optionally send to home or login
      if (pathname?.startsWith("/dashboard")) {
        router.replace("/auth/login");
      } else {
        router.refresh(); // re-render navbar state
      }
      setMenuOpen(false);
    }
  };

  return (
    <div className="w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
          AI Career Copilot
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 hover:underline underline-offset-4">
            Dashboard
          </Link>

          {!user ? (
            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-white shadow hover:shadow-md transition-shadow"
            >
              Login
            </Link>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-sm hover:shadow transition"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 grid place-items-center text-xs font-bold text-purple-700">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <span className="max-w-[120px] truncate text-gray-800">{displayName}</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-700 hover:underline text-sm">
            Dashboard
          </Link>
          {!user ? (
            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 text-white shadow"
            >
              Login
            </Link>
          ) : (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="h-9 w-9 rounded-full overflow-hidden border border-gray-200 bg-white shadow-sm"
              aria-label="User menu"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-xs font-bold text-purple-700 bg-gradient-to-br from-purple-100 to-pink-100">
                  {initials}
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && user && (
        <div className="md:hidden border-t">
          <div className="mx-auto max-w-6xl px-4 py-2 flex flex-col">
            <Link href="/profile" className="px-2 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>
              Profile
            </Link>
            <Link href="/dashboard" className="px-2 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
            <button onClick={handleLogout} className="px-2 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg">
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
