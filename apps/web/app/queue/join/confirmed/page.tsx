type PageProps = {
  searchParams: Promise<{ number?: string; ahead?: string }>;
};

export default async function QueueConfirmedPage({ searchParams }: PageProps) {
  const { number, ahead } = await searchParams;
  const queueNumber = Number(number ?? 0);
  const waitingAhead = Number(ahead ?? 0);

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/wellside-logo-white.png"
          alt="Wellside+"
          className="h-8 w-auto mx-auto"
        />

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/50 uppercase tracking-widest">
              Your Queue Number
            </p>
            <p className="text-8xl font-bold text-white leading-none">
              {String(queueNumber).padStart(2, "0")}
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-5 space-y-1">
            {waitingAhead === 0 ? (
              <p className="text-lg font-semibold text-emerald-400">
                You&apos;re next!
              </p>
            ) : (
              <>
                <p className="text-3xl font-bold text-white">{waitingAhead}</p>
                <p className="text-sm text-white/50">
                  {waitingAhead === 1 ? "person" : "people"} ahead of you
                </p>
              </>
            )}
          </div>

          <p className="text-sm text-white/40">
            Please wait at the shop. We&apos;ll call your number when it&apos;s
            your turn.
          </p>
        </div>

        <a
          href="/queue/join"
          className="block text-sm text-white/30 hover:text-white/50 transition-colors"
        >
          Join for someone else
        </a>
      </div>
    </div>
  );
}
