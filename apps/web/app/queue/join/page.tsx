import { joinQueueAction } from "./actions";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function JoinQueuePage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/wellside-logo-white.png"
          alt="Wellside+"
          className="h-8 w-auto mx-auto"
        />

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-white">Join the Queue</h1>
          <p className="text-sm text-white/50">
            Enter your details to get a queue number
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 text-center">
            {error === "missing"
              ? "Please fill in your name and phone number."
              : "Something went wrong. Please try again."}
          </div>
        )}

        <form action={joinQueueAction} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-white/70 block mb-2"
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Ahmad Razif"
              autoComplete="name"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 text-base focus:outline-none focus:border-white/30 focus:bg-white/8"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-white/70 block mb-2"
            >
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="e.g. 0123456789"
              autoComplete="tel"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 text-base focus:outline-none focus:border-white/30 focus:bg-white/8"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-white text-black font-semibold py-3 text-base hover:bg-white/90 transition-colors mt-2"
          >
            Get Queue Number
          </button>
        </form>
      </div>
    </div>
  );
}
