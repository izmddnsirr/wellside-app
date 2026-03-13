"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  rules?: PasswordRule[];
  rulesPreset?: "min-6";
};

const presetRules: Record<NonNullable<PasswordInputProps["rulesPreset"]>, PasswordRule[]> =
  {
    "min-6": [
      {
        id: "min-6",
        label: "At least 6 characters",
        test: (value: string) => value.length >= 6,
      },
    ],
  };

function PasswordInput({
  className,
  rules,
  rulesPreset,
  value,
  defaultValue,
  onChange,
  onBlur,
  disabled,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(
    typeof defaultValue === "string" ? defaultValue : ""
  );

  const isControlled = value !== undefined;
  const currentValue = String(isControlled ? value ?? "" : internalValue);
  const resolvedRules = rules ?? (rulesPreset ? presetRules[rulesPreset] : undefined);
  const ruleResults = resolvedRules?.map((rule) => ({
    ...rule,
    passed: rule.test(currentValue),
  }));
  const showValidation =
    Boolean(ruleResults?.length) && (touched || currentValue.length > 0);
  const isInvalid = Boolean(
    showValidation && ruleResults?.some((rule) => !rule.passed)
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          {...props}
          type={isVisible ? "text" : "password"}
          className={cn("pr-10", className)}
          value={isControlled ? currentValue : undefined}
          defaultValue={!isControlled ? defaultValue : undefined}
          onChange={(event) => {
            if (!isControlled) {
              setInternalValue(event.target.value);
            }
            onChange?.(event);
          }}
          onBlur={(event) => {
            setTouched(true);
            onBlur?.(event);
          }}
          aria-invalid={isInvalid || undefined}
          disabled={disabled}
        />
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={() => setIsVisible((prev) => !prev)}
          aria-label={isVisible ? "Hide password" : "Show password"}
          disabled={disabled}
        >
          {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {showValidation ? (
        <ul className="grid gap-1 text-xs text-muted-foreground">
          {ruleResults?.map((rule) => (
            <li key={rule.id} className="flex items-center gap-2">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  rule.passed ? "bg-emerald-500" : "bg-muted-foreground/70"
                )}
              />
              <span className={rule.passed ? "text-foreground" : undefined}>
                {rule.label}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export { PasswordInput };
export type { PasswordRule };
