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
        className="h-10 w-10 rounded-full border-border/60 bg-background/80 text-foreground shadow-sm"
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
            className="h-10 w-10 rounded-full border-border/60 bg-background/80 text-foreground shadow-sm"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to leave this booking?
            </DialogTitle>
            <DialogDescription>
              All selections will be lost
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button asChild>
              <Link href="/booking">Yes, exit</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
