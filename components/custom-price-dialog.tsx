"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CustomPriceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: (price: number) => void;
};

export function CustomPriceDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: CustomPriceDialogProps) {
  const [digits, setDigits] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDigits("");
    }
    onOpenChange(nextOpen);
  };

  const parsedValue = parseInt(digits || "0", 10) / 100;
  const isValid = parsedValue > 0;
  const displayFormatted = parsedValue.toFixed(2);

  const appendDigit = (token: string) => {
    setDigits((prev) => {
      const next = (prev + token).replace(/^0+/, "");
      if (next.length > 9) return prev;
      return next;
    });
  };

  const backspace = () => setDigits((prev) => prev.slice(0, -1));
  const clear = () => setDigits("");

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(parsedValue);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex min-h-26 flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/20 px-5 py-4 text-center">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Amount
            </p>
            <p className="mt-1 text-3xl font-semibold leading-none">
              RM {displayFormatted}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                className="h-11 w-full text-sm font-semibold"
                onClick={() => appendDigit(key)}
              >
                {key}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["0", "00"].map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                className="h-11 w-full text-sm font-semibold"
                onClick={() => appendDigit(key)}
              >
                {key}
              </Button>
            ))}
            <Button
              type="button"
              variant="default"
              className="h-11 w-full text-sm font-semibold"
              onClick={backspace}
            >
              ⌫
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full text-sm font-semibold"
              onClick={clear}
            >
              Clear
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            className="w-full"
            onClick={handleConfirm}
            disabled={!isValid}
          >
            Confirm RM {displayFormatted}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
