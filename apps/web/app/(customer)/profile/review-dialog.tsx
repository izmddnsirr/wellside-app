"use client";

import { useActionState, useState } from "react";
import { submitReview } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StarRating } from "@/components/ui/star-rating";
import { Star } from "lucide-react";

type Props = {
  bookingId: string;
  barberId: string;
  barberName: string;
};

type State = { ok?: boolean; error?: string } | null;

export function ReviewDialog({ bookingId, barberId, barberName }: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);

  const [state, action, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      const result = await submitReview(formData);
      if (result.ok) setOpen(false);
      return result;
    },
    null,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Star className="h-3 w-3" />
          Rate
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate your experience</DialogTitle>
          <DialogDescription>
            How was your session with {barberName}?
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="barberId" value={barberId} />
          <input type="hidden" name="rating" value={rating} />

          <div className="flex justify-center py-2">
            <StarRating value={rating} onChange={setRating} size={32} />
          </div>

          <div className="space-y-1.5">
            <textarea
              name="comment"
              placeholder="Leave a comment (optional)"
              rows={3}
              maxLength={300}
              disabled={isPending}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || rating === 0}
              className="w-full"
            >
              {isPending ? "Submitting…" : "Submit review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
