import React, { createContext, useContext, useMemo, useState } from "react";

type OnboardingState = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
};

type OnboardingContextValue = OnboardingState & {
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setPhone: (value: string) => void;
  reset: () => void;
};

const initialState: OnboardingState = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined
);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [email, setEmail] = useState(initialState.email);
  const [password, setPassword] = useState(initialState.password);
  const [firstName, setFirstName] = useState(initialState.firstName);
  const [lastName, setLastName] = useState(initialState.lastName);
  const [phone, setPhone] = useState(initialState.phone);

  const reset = () => {
    setEmail(initialState.email);
    setPassword(initialState.password);
    setFirstName(initialState.firstName);
    setLastName(initialState.lastName);
    setPhone(initialState.phone);
  };

  const value = useMemo(
    () => ({
      email,
      password,
      firstName,
      lastName,
      phone,
      setEmail,
      setPassword,
      setFirstName,
      setLastName,
      setPhone,
      reset,
    }),
    [email, password, firstName, lastName, phone]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
