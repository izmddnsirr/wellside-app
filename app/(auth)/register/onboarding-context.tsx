"use client";

import * as React from "react";

type OnboardingData = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
};

type OnboardingContextValue = {
  data: OnboardingData;
  step: 1 | 2;
  setStep: (step: 1 | 2) => void;
  update: (values: Partial<OnboardingData>) => void;
  reset: () => void;
};

const defaultData: OnboardingData = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  phone: "",
};

const OnboardingContext = React.createContext<OnboardingContextValue | null>(
  null
);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = React.useState<OnboardingData>(defaultData);
  const [step, setStep] = React.useState<1 | 2>(1);

  const update = React.useCallback((values: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...values }));
  }, []);

  const reset = React.useCallback(() => {
    setData(defaultData);
    setStep(1);
  }, []);

  const value = React.useMemo(
    () => ({
      data,
      step,
      setStep,
      update,
      reset,
    }),
    [data, step, update, reset]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = React.useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider.");
  }
  return context;
}
