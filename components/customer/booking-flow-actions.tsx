"use client";

import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
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

type BookingFlowActionsProps = {
  backHref: string;
};

export function BookingFlowActions({ backHref }: BookingFlowActionsProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        asChild
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full border-slate-200/80 bg-white/80 text-slate-700 shadow-sm"
      >
        <Link href={backHref} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-slate-200/80 bg-white/80 text-slate-700 shadow-sm"
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
    </div>
  );
}
