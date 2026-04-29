"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* ✅ COPY YOUR REAL LOGO FROM SIDEBAR */
function SellerCompLogoFull() {
  return (
    <div className="flex items-center gap-3 justify-center">
      <svg
        viewBox="0 0 64 64"
        className="h-20 w-20"
        fill="none"
      >
        <path d="M12 18H20L24 38C24.6 40.6 26.9 42.5 29.6 42.5H45.5C48 42.5 50.2 40.8 50.8 38.4L55 22H23.5"
          stroke="#67C23A" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="31" cy="50" r="3.8" fill="#67C23A" />
        <circle cx="46" cy="50" r="3.8" fill="#67C23A" />
        <rect x="30" y="29" width="5" height="9" rx="1" fill="#F4C430" />
        <rect x="38" y="25" width="5" height="13" rx="1" fill="#41C7D9" />
        <rect x="46" y="21" width="5" height="17" rx="1" fill="#2F80ED" />
        <path d="M26 35L38 23L43 28L56 15"
          stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      <div className="text-[34px] font-extrabold leading-none">
        <span style={{ color: "#2F80ED" }}>Seller</span>
        <span style={{ color: "#67C23A" }}>Comp</span>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  // ✅ check passwords match
  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Check your email to confirm your account.");
  router.push("/");
};

  return (
    <main className="min-h-screen">
      <div className="grid min-h-screen md:grid-cols-2">

        {/* LEFT SIDE */}
        <section className="flex items-center justify-center bg-white px-8 py-12 text-black">
          <div className="w-full max-w-md">

            {/* ✅ REAL LOGO */}
            <div className="mb-10">
              <SellerCompLogoFull />
            </div>

            <h1 className="text-center text-4xl font-bold">
  Start Your 14 Day Trial
</h1>

<p className="mt-4 text-center text-lg text-gray-600">
  Built for sellers. Start in seconds.
</p>

            <form onSubmit={handleSignup} className="mt-10 space-y-5">

  {/* FIRST + LAST NAME */}
  <div className="grid grid-cols-2 gap-3">
    <input
  type="text"
  required
  value={firstName}
  onChange={(e) => setFirstName(e.target.value)}
  placeholder="First Name"
  className="w-full rounded-xl border border-gray-300 px-4 py-4 outline-none focus:border-teal-400"
/>

   <input
  type="text"
  required
  value={lastName}
  onChange={(e) => setLastName(e.target.value)}
  placeholder="Last Name"
  className="w-full rounded-xl border border-gray-300 px-4 py-4 outline-none focus:border-teal-400"
/>
  </div>

  {/* EMAIL */}
  <input
    type="email"
    required
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="Enter Email"
    className="w-full rounded-xl border border-gray-300 px-4 py-4 outline-none focus:border-teal-400"
  />

  {/* PASSWORD */}
  <input
    type="password"
    required
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Password"
    className="w-full rounded-xl border border-gray-300 px-4 py-4 outline-none focus:border-teal-400"
  />

  {/* CONFIRM PASSWORD */}
  <input
  type="password"
  required
  value={confirmPassword}
  onChange={(e) => setConfirmPassword(e.target.value)}
  placeholder="Confirm Password"
  className="w-full rounded-xl border border-gray-300 px-4 py-4 outline-none focus:border-teal-400"
/>

  {/* TERMS */}
  <label className="flex items-center gap-3 text-sm text-gray-600">
    <input type="checkbox" className="h-5 w-5" />
    <span>
      I agree to the{" "}
      <span className="text-blue-500 font-medium">Privacy Policy</span> and{" "}
      <span className="text-blue-500 font-medium">Terms & Conditions</span>
    </span>
  </label>

  {/* BUTTON */}
  <button
    type="submit"
    className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-4 text-lg font-bold text-white shadow-md hover:opacity-90"
  >
    START MY FREE TRIAL
  </button>

</form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/" className="text-teal-500 font-semibold hover:underline">
                Log In
              </Link>
            </p>

          </div>
        </section>

        {/* ✅ RIGHT SIDE (YOUR EXACT LANDING PAGE) */}
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