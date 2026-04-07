export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="grid min-h-screen md:grid-cols-2">

        {/* LEFT SIDE */}
        <section className="flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md">

            {/* LOGO STYLE */}
            <div className="mb-10 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 shadow-[0_0_25px_rgba(45,212,191,0.5)]" />
              <div>
                <p className="text-3xl font-bold tracking-tight">District</p>
                <p className="text-sm text-white/50">Internal Hub</p>
              </div>
            </div>

            <h1 className="text-5xl font-bold tracking-tight">Welcome Back</h1>
            <p className="mt-4 text-lg text-white/60">
              Access your sales, operations, and internal systems
            </p>

            <form className="mt-10 space-y-5">

              <div>
                <label className="mb-2 block text-sm text-white/70">Email</label>
                <input
                  type="email"
                  placeholder="Enter Email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-white placeholder:text-white/35 outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Password</label>
                <input
                  type="password"
                  placeholder="Enter Password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-white placeholder:text-white/35 outline-none focus:border-teal-400"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-4 text-base font-bold text-black shadow-[0_0_20px_rgba(45,212,191,0.5)] transition hover:opacity-90"
              >
                LOGIN
              </button>

            </form>

            <div className="mt-8 space-y-2 text-center">
              <p className="text-sm text-teal-300">Access managed internally</p>
              <p className="text-sm text-white/40">Forgot Password?</p>
            </div>

          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="relative hidden md:flex">

          {/* BACKGROUND GLOW */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.2),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.2),transparent_40%)]" />

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
