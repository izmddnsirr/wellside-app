export const metadata = {
  title: "Offline — Wellside+",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="text-4xl">📡</div>
      <h1 className="mt-4 text-2xl font-semibold text-foreground">
        You&apos;re offline
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Check your internet connection and try again.
      </p>
    </div>
  );
}
