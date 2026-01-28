"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type StaffLoginFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  errorMessage?: string | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {pending ? "Logging in..." : "Login"}
    </Button>
  );
}

export function StaffLoginForm({ action, errorMessage }: StaffLoginFormProps) {
  return (
    <form className="w-full max-w-xs" action={action}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <img
            src="/wellside-logo.png"
            alt="Wellside"
            className="h-14 w-auto dark:invert"
          />
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>
          <PasswordInput
            id="password"
            name="password"
            required
          />
        </Field>
        {errorMessage ? (
          <FieldDescription className="text-center text-red-600">
            {errorMessage}
          </FieldDescription>
        ) : null}
        <Field>
          <SubmitButton />
        </Field>
      </FieldGroup>
    </form>
  );
}
