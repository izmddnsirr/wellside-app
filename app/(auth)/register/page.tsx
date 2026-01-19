"use client";

import { Card, CardContent } from "@/components/ui/card";
import { OnboardingProvider, useOnboarding } from "./onboarding-context";
import { StepOneForm } from "./step-one-form";
import { StepTwoForm } from "./step-two-form";

function RegisterCard() {
  const { step } = useOnboarding();

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-start justify-center pt-6 md:pt-10">
          <div className="w-full max-w-xs">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                {step === 1 ? <StepOneForm /> : <StepTwoForm />}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <OnboardingProvider>
      <RegisterCard />
    </OnboardingProvider>
  );
}
