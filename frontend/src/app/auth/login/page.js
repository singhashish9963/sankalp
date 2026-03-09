"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from 'next/navigation';

const supabase = typeof window !== "undefined"
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        auth: {
          storage: {
            getItem: (key) => {
              return document.cookie
                .split('; ')
                .find(row => row.startsWith(key + '='))
                ?.split('=')[1];
            },
            setItem: (key, value) => {
              document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`;
            },
            removeItem: (key) => {
              document.cookie = `${key}=; path=/; max-age=0`;
            },
          },
        },
      }
    )
  : null;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    if (!supabase) return;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      setMsg(error.message);
    } else if (data.session) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('uniquePresence')
        .eq('id', data.user.id)
        .single();
      
      if (userData) {
        document.cookie = `uniquePresence=${userData.uniquePresence}; path=/; max-age=31536000; SameSite=Lax`;
      }
      setMsg("Login successful!");
      router.push('/dashboard');
    } else {
      setMsg("Please check your email to confirm your account.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-4">
      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        Login
      </h3>

      <input
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none transition-colors"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none transition-colors"
        placeholder="Password"
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        required
      />

      <button className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
        Login
      </button>

      {msg && (
        <p className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
          {msg}
        </p>
      )}
    </form>
  );
}
