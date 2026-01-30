"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { isValidE164, normalizePhone } from "@/src/lib/phone";

const phoneSchema = z
  .string()
  .trim()
  .min(1, { message: "Phone number is required." })
  .transform((value) => normalizePhone(value, "MY"))
  .refine(isValidE164, {
    message: "Enter a valid phone number (e.g. +60123456789).",
  });

const onboardingSchema = z.object({
  firstName: z.string().trim().min(1, { message: "First name is required." }),
  lastName: z.string().trim().min(1, { message: "Last name is required." }),
  phone: phoneSchema,
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export function StepTwoForm() {
  const router = useRouter();
  const { data, update, setStep, reset } = useOnboarding();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    },
  });

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      update({
        firstName: values.firstName ?? "",
        lastName: values.lastName ?? "",
        phone: values.phone ?? "",
      });
    });
    return () => subscription.unsubscribe();
  }, [form, update]);

  const phoneRegister = form.register("phone");

  const handleSubmit = async (values: OnboardingValues) => {
    setErrorMessage(null);
    setIsLoading(true);
    update({
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
    });

    const supabase = createClient();
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            phone: values.phone,
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
      first_name: values.firstName,
      last_name: values.lastName,
      phone: values.phone,
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
    <form
      className="flex w-full flex-col gap-6"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
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
            autoComplete="given-name"
            {...form.register("firstName")}
            className="dark:bg-[#151515] dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
          <Input
            id="lastName"
            autoComplete="family-name"
            {...form.register("lastName")}
            className="dark:bg-[#151515] dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <div className="flex">
            <div className="flex items-center gap-2 rounded-l-md border border-border bg-muted/40 px-3 text-sm font-medium text-foreground/80 dark:border-white/10 dark:bg-white/5">
              <span aria-hidden="true" className="text-base">
                🇲🇾
              </span>
              <span className="text-sm">+60</span>
            </div>
            <Input
              id="phone"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel"
              placeholder="123456789"
              {...phoneRegister}
              onChange={(event) => {
                const digitsOnly = event.target.value.replace(/\D/g, "");
                form.setValue("phone", digitsOnly, {
                  shouldDirty: true,
                });
              }}
              onBlur={phoneRegister.onBlur}
              className="rounded-l-none bg-background dark:bg-[#151515] dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
            />
          </div>
        </Field>
        {form.formState.errors.firstName?.message ||
        form.formState.errors.lastName?.message ||
        form.formState.errors.phone?.message ? (
          <FieldDescription className="text-center text-red-600">
            {form.formState.errors.firstName?.message ||
              form.formState.errors.lastName?.message ||
              form.formState.errors.phone?.message}
          </FieldDescription>
        ) : null}
        {errorMessage ? (
          <FieldDescription className="text-center text-red-600">
            {errorMessage}
          </FieldDescription>
        ) : null}
        <Field>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setStep(1)}
              disabled={isLoading}
              className="w-full sm:flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full sm:flex-1"
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
