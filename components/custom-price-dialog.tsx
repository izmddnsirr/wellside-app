"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type CustomPriceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: (price: number) => void;
};

const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "Back"];

export function CustomPriceDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: CustomPriceDialogProps) {
  const [value, setValue] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setValue("");
    }
    onOpenChange(nextOpen);
  };

  const displayValue = value.length ? value : "0.00";
  const parsedValue = Number(value);
  const isValid = Number.isFinite(parsedValue) && parsedValue > 0;

  const handleKeypad = (key: string) => {
    if (key === "Back") {
      setValue((prev) => prev.slice(0, -1));
      return;
    }

    if (key === ".") {
      setValue((prev) => {
        if (prev.includes(".")) {
          return prev;
        }
        if (prev === "") {
          return "0.";
        }
        return `${prev}.`;
      });
      return;
    }

    setValue((prev) => {
      if (prev.includes(".")) {
        const decimals = prev.split(".")[1] ?? "";
        if (decimals.length >= 2) {
          return prev;
        }
      }
      if (prev === "0") {
        return key;
      }
      return `${prev}${key}`;
    });
  };

  const handleClear = () => {
    setValue("");
  };

  const formattedValue = useMemo(() => {
    if (!isValid) {
      return "RM 0.00";
    }
    return `RM ${parsedValue.toFixed(2)}`;
  }, [isValid, parsedValue]);

  const handleConfirm = () => {
    if (!isValid) {
      return;
    }
    onConfirm(Number(parsedValue.toFixed(2)));
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
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-5 text-center">
            <Input
              value={displayValue}
              readOnly
              className="h-12 border-0 bg-transparent p-0 text-center text-3xl font-semibold shadow-none focus-visible:ring-0"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {formattedValue}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {keypad.map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                className="h-12 text-base"
                onClick={() => handleKeypad(key)}
              >
                {key}
              </Button>
            ))}
          </div>
          <Button type="button" variant="ghost" onClick={handleClear}>
            Clear
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleConfirm} disabled={!isValid}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
