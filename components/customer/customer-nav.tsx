"use client";

import {
  ArrowLeft,
  Bell,
  Calendar,
  Home,
  Sparkles,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const navItems = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "Booking", icon: Calendar, href: "/booking" },
  { label: "AI", icon: Sparkles, href: "/ai" },
  { label: "Notification", icon: Bell, href: "/notification" },
  { label: "Profile", icon: User, href: "/profile" },
];
const bookingBackSteps = [
  { match: "/booking/confirmed", back: "/booking/review" },
  { match: "/booking/review", back: "/booking/time" },
  { match: "/booking/time", back: "/booking/barbers" },
  { match: "/booking/barbers", back: "/booking/services" },
  { match: "/booking/services", back: "/booking" },
];

export function CustomerNav() {
  const pathname = usePathname();
  const isBookingFlow = pathname.startsWith("/booking/");
  const backHref =
    bookingBackSteps.find((step) => pathname.startsWith(step.match))?.back ??
    "/booking";

  return (
    <>
      <nav aria-label="Primary" className="hidden justify-center lg:flex">
        <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-2 py-2 text-xs text-slate-500 shadow-md backdrop-blur-sm">
          {isBookingFlow ? (
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full border-slate-200/80 bg-white/70 text-slate-700 shadow-sm"
            >
              <Link href={backHref} aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
          <div className="flex flex-1 items-center justify-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold leading-none transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          {isBookingFlow ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full border-slate-200/80 bg-white/70 text-slate-700 shadow-sm"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-slate-200/80 bg-white p-10 shadow-[0_24px_60px_rgba(15,23,42,0.2)] sm:max-w-[640px] **:data-[slot=dialog-close]:right-6 **:data-[slot=dialog-close]:top-6 [&_[data-slot=dialog-close]_*]:size-5">
                <DialogHeader className="space-y-3 text-left">
                  <DialogTitle className="text-3xl font-semibold text-slate-900">
                    Are you sure you want to leave this booking?
                  </DialogTitle>
                  <DialogDescription className="text-base text-slate-500">
                    All selections will be lost
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex w-full flex-col gap-3 pt-2 sm:flex-row sm:justify-start sm:gap-4">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="h-12 w-full rounded-full border-slate-200 text-base font-semibold text-slate-700 sm:w-auto sm:min-w-[180px]"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    asChild
                    className="h-12 w-full rounded-full bg-slate-900 text-base font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.25)] hover:bg-slate-900/90 sm:w-auto sm:min-w-[180px]"
                  >
                    <Link href="/booking">Yes, exit</Link>
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </nav>

      <nav
        aria-label="Primary"
        className="fixed bottom-4 left-1/2 z-30 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 lg:hidden"
        style={{ animationDelay: "300ms" }}
      >
        <div className="rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur-sm">
          <div className="grid grid-cols-5 items-center text-[11px]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 rounded-full px-2 py-2 ${
                    isActive ? "bg-slate-100 text-sky-600" : "text-slate-500"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
