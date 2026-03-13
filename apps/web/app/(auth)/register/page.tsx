"use client";
import { OnboardingProvider, useOnboarding } from "./onboarding-context";
import { StepOneForm } from "./step-one-form";
import { StepTwoForm } from "./step-two-form";
import Image from "next/image";

function RegisterCard() {
  const { step } = useOnboarding();

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            {step === 1 ? <StepOneForm /> : <StepTwoForm />}
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/placeholder.svg"
          alt="Image"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
          sizes="(min-width: 1024px) 50vw, 100vw"
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
