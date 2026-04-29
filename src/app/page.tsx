"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  router.push("/dashboard");
};

  return (
    <main className="min-h-screen">
      <div className="grid min-h-screen md:grid-cols-2">

        {/* LEFT SIDE (LIGHT) */}
        <section className="flex items-center justify-center bg-white px-8 py-12 text-black">
          <div className="w-full max-w-md">

            {/* LOGO */}
            <div className="mb-10 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 shadow-[0_0_20px_rgba(45,212,191,0.4)]" />
              <div>
                <p className="text-3xl font-bold tracking-tight">District</p>
                <p className="text-sm text-gray-500">Internal Hub</p>
              </div>
            </div>

            <h1 className="text-5xl font-bold tracking-tight">Welcome Back</h1>
            <p className="mt-4 text-lg text-gray-600">
              Access your sales, operations, and internal systems
            </p>

            <form onSubmit={handleLogin} className="mt-10 space-y-5">

              <div>
                <label className="mb-2 block text-sm text-gray-600">Email</label>
                <input
                  type="email"
                  placeholder="Enter Email"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-4 text-black placeholder:text-gray-400 outline-none focus:border-teal-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-600">Password</label>
                <input
                  type="password"
                  placeholder="Enter Password"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-4 text-black placeholder:text-gray-400 outline-none focus:border-teal-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
  type="submit"
  className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(45,212,191,0.4)] transition hover:opacity-90"
>
  LOGIN
</button>

            </form>

            <div className="mt-8 space-y-2 text-center">
              <p className="text-sm text-gray-500">
                <span className="cursor-pointer text-teal-500 font-semibold">
                  Forgot Password?
                </span>
              </p>
              <p className="text-sm text-gray-500">
                Don't have an account?{" "}
                <Link href="/signup" className="text-teal-500 font-semibold">
  Sign Up
</Link>
              </p>
            </div>

          </div>
        </section>

        {/* RIGHT SIDE (DARK) */}
        <section className="relative hidden md:flex text-white">

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.25),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.25),transparent_40%),linear-gradient(180deg,#0b1b1f_0%,#000000_100%)]" />

          <div className="relative z-10 flex w-full flex-col justify-center px-16 py-14">

            <div className="mb-16">
              <h2 className="text-5xl font-bold text-teal-400">
                Sales Control
              </h2>
              <p className="mt-4 text-2xl text-white/70">
                Track calls, leads, and follow-ups in one place
              </p>
              <p className="mt-8 max-w-xl text-lg text-white/50 italic">
                "No more messy sheets. Everything is tracked, organized, and actionable."
              </p>
              <p className="mt-4 text-white/80 font-semibold">
                - District System
              </p>
            </div>

            <div className="border-t border-white/10 pt-14">
              <h3 className="text-4xl font-bold text-blue-400">
                Full Visibility
              </h3>
              <p className="mt-4 text-2xl text-white/70">
                Know exactly what your team is doing at all times
              </p>
              <p className="mt-8 max-w-xl text-lg text-white/50 italic">
                "From sales activity to future POs and inventory, everything lives here."
              </p>
              <p className="mt-4 text-white/80 font-semibold">
                - District Operations
              </p>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
