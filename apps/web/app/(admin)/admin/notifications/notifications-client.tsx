"use client";

import { useActionState, useRef } from "react";
import { broadcastNotification } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type State = {
  ok?: boolean;
  sent?: number;
  error?: string;
} | null;

export function NotificationsClient() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      const result = await broadcastNotification(formData);
      if (result.ok) {
        formRef.current?.reset();
      }
      return result;
    },
    null,
  );

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <Card className="border-border/60 max-w-xl">
        <CardHeader>
          <CardTitle>Send notification</CardTitle>
          <CardDescription>
            Push a custom message to all users who have the mobile app
            installed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Special offer this weekend"
                maxLength={100}
                required
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="body">Message</Label>
              <textarea
                id="body"
                name="body"
                placeholder="e.g. Book before Sunday and get 10% off your next cut."
                rows={4}
                maxLength={300}
                required
                disabled={isPending}
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            {state?.ok && (
              <p className="text-sm text-emerald-600">
                Sent to {state.sent ?? 0}{" "}
                {state.sent === 1 ? "user" : "users"}.
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="self-start"
            >
              {isPending ? "Sending…" : "Send to all users"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
