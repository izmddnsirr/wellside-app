"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useOnboarding } from "./onboarding-context";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function StepOneForm() {
  const { data, update, setStep } = useOnboarding();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const email = data.email.trim();
    const password = data.password;
    const confirmPassword = data.confirmPassword;

    if (!email) {
      setErrorMessage("Email is required.");
      return;
    }
    if (!emailRegex.test(email)) {
      setErrorMessage("Email format is invalid.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Confirm password must match.");
      return;
    }

    update({ email });
    setStep(2);
  };

  return (
    <form className="flex w-full flex-col gap-6" onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <img
            src="/wellside-logo.png"
            alt="Wellside"
            className="h-14 w-auto dark:invert"
          />
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Create your Wellside account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            value={data.email}
            onChange={(event) => update({ email: event.target.value })}
            className="dark:bg-[#151515] dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            value={data.password}
            onChange={(event) => update({ password: event.target.value })}
            className="dark:bg-[#151515] dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={data.confirmPassword}
            onChange={(event) => update({ confirmPassword: event.target.value })}
            className="dark:bg-[#151515] dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
          />
        </Field>
        {errorMessage ? (
          <FieldDescription className="text-center text-red-600">
            {errorMessage}
          </FieldDescription>
        ) : null}
        <Field>
          <Button type="submit" size="lg" className="w-full">
            Continue
          </Button>
        </Field>
        <FieldDescription className="text-center">
          Already have an account? <a href="/login">Login</a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
