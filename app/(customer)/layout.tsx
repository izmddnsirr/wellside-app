import { CustomerNav } from "@/components/customer/customer-nav";
import { Manrope, Sora } from "next/font/google";

const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${display.variable} ${body.variable} relative min-h-screen bg-[#f4f6fb] font-semibold text-slate-900`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-30 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#dbeafe] opacity-70 blur-3xl lg:-top-24 lg:left-10 lg:h-96 lg:w-96 lg:translate-x-0" />
        <div className="absolute -right-24 top-40 h-56 w-56 rounded-full bg-[#e0f2fe] opacity-80 blur-3xl lg:-right-10 lg:top-20 lg:h-80 lg:w-80" />
      </div>

      <header className="lg:sticky lg:top-0 lg:z-30 lg:pt-4">
        <div className="mx-auto w-full max-w-none px-5 lg:px-10">
          <CustomerNav />
        </div>
      </header>

      <main className="relative mx-auto flex min-h-screen w-full max-w-none flex-col gap-8 px-5 pb-20 pt-5 lg:px-10 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
