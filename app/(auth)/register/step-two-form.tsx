"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useOnboarding } from "./onboarding-context";

export function StepTwoForm() {
  const router = useRouter();
  const { data, update, setStep, reset } = useOnboarding();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!data.firstName.trim()) {
      setErrorMessage("First name is required.");
      return;
    }
    if (!data.lastName.trim()) {
      setErrorMessage("Last name is required.");
      return;
    }
    if (data.phone.trim().length < 8) {
      setErrorMessage("Phone number must be at least 8 characters.");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);

    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            first_name: data.firstName.trim(),
            last_name: data.lastName.trim(),
            phone: data.phone.trim(),
            role: "customer",
          },
        },
      });

    if (signUpError) {
      setErrorMessage(signUpError.message);
      toast.error(signUpError.message);
      setIsLoading(false);
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      const message = "Registration failed. Please try again.";
      setErrorMessage(message);
      toast.error(message);
      setIsLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      email: data.email.trim(),
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      phone: data.phone.trim(),
    });

    if (profileError) {
      setErrorMessage(profileError.message);
      toast.error(profileError.message);
      setIsLoading(false);
      return;
    }

    reset();

    if (!signUpData.session) {
      toast.info("Confirm your email");
      router.replace("/login");
      return;
    }

    router.replace("/home");
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
          <h1 className="text-2xl font-bold">Tell us about yourself</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Finish setting up your profile
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="firstName">First Name</FieldLabel>
          <Input
            id="firstName"
            name="firstName"
            value={data.firstName}
            onChange={(event) => update({ firstName: event.target.value })}
            className="dark:bg-[#151515] dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
          <Input
            id="lastName"
            name="lastName"
            value={data.lastName}
            onChange={(event) => update({ lastName: event.target.value })}
            className="dark:bg-[#151515] dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <Input
            id="phone"
            name="phone"
            value={data.phone}
            onChange={(event) => update({ phone: event.target.value })}
            className="dark:bg-[#151515] dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
          />
        </Field>
        {errorMessage ? (
          <FieldDescription className="text-center text-red-600">
            {errorMessage}
          </FieldDescription>
        ) : null}
        <FieldSeparator />
        <Field>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isLoading}
              className="sm:w-1/2"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="sm:w-1/2"
            >
              {isLoading ? "Creating..." : "Create account"}
            </Button>
          </div>
        </Field>
        <FieldDescription className="text-center">
          Already have an account? <a href="/login">Login</a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
