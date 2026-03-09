"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from 'next/navigation';

// Supabase client (browser-safe)
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

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    if (!supabase) {
        console.error("Supabase client is not initialized.");
        return;
    }

    console.log("🚀 Form submitted. Creating account...");
    setMsg("Creating account...");

    try {
      // 1️⃣ Sign up user in Supabase Auth
      console.log("1️⃣ Attempting Supabase Auth signup for:", { email });
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass
      });

      console.log("   Supabase Auth response:", { data, error });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("User not created in Supabase Auth");
      console.log("   ✅ Supabase Auth signup successful. User ID:", data.user.id);

      // 2️⃣ Insert user info into Supabase 'users' table
      const userPayload = {
        id: data.user.id,
        name,
        email,
        phone,
        password: pass // Note: Storing plain text passwords is not recommended.
      };
      console.log("2️⃣ Inserting user into 'users' table:", userPayload);
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert([userPayload])
        .select('uniquePresence')
        .single();

      console.log("   Supabase insert response:", { insertData, insertError });
      if (insertError) throw new Error(insertError.message);
      
      const uniquePresence = insertData?.uniquePresence;
      if (!uniquePresence) throw new Error("Failed to get uniquePresence token from insert response");
      console.log("   ✅ User insert successful. uniquePresence token:", uniquePresence);
      
      // Store token in cookie
      document.cookie = `uniquePresence=${uniquePresence}; path=/; max-age=31536000; SameSite=Lax`;
      console.log("   🍪 Cookie 'uniquePresence' set.");

      // 3️⃣ Call MongoDB API to create profile
      const profilePayload = {
        name,
        email,
        phone,
        location: "",
        title: "",
        bio: "",
        linkedin: "",
        github: "",
        website: "",
        joinDate: new Date().toLocaleString("default", { month: "long", year: "numeric" })
      };
      console.log("3️⃣ Calling MongoDB API '/api/saveProfile' with payload:", profilePayload);
      const profileResponse = await fetch("/api/saveProfile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${uniquePresence}`,
        },
        body: JSON.stringify(profilePayload),
      });

      const profileResult = await profileResponse.json();
      console.log("   MongoDB API response:", { status: profileResponse.status, body: profileResult });
      if (profileResult.status !== "success") {
        console.warn("MongoDB profile creation may have failed:", profileResult.message);
      } else {
        console.log("   ✅ MongoDB profile creation successful.");
      }

      // 4️⃣ Success message and redirect
      console.log("✅ All steps completed successfully! Redirecting...");
      setMsg("Account created successfully!");
      setTimeout(() => router.push('/dashboard'), 2000);

    } catch (err) {
      console.error("❌ Signup error caught:", err);
      setMsg(err.message || "Failed to create account");
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-4 mx-auto mt-12 p-6 bg-gray-900/50 backdrop-blur-md rounded-2xl border-2 border-purple-500/20">
      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-center">
        Sign up
      </h3>

      <input
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none transition-colors"
        placeholder="Full Name"
        value={name}
        onChange={e=>setName(e.target.value)}
        required
      />
      <input
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none transition-colors"
        placeholder="Email"
        type="email"
        value={email}
        onChange={e=>setEmail(e.target.value)}
        required
      />
      <input
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none transition-colors"
        placeholder="Phone Number"
        type="tel"
        value={phone}
        onChange={e=>setPhone(e.target.value)}
        required
      />
      <input
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none transition-colors"
        placeholder="Password"
        type="password"
        value={pass}
        onChange={e=>setPass(e.target.value)}
        required
      />
      <button className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
        Create account
      </button>

      {msg && <p className="text-sm text-gray-300 bg-gray-800/30 p-3 rounded-lg">{msg}</p>}
    </form>
  );
}