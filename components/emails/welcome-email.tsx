import * as React from "react";

type WelcomeEmailProps = {
  name?: string | null;
  preheader?: string;
};

export function WelcomeEmail({ name, preheader }: WelcomeEmailProps) {
  const recipient = name?.trim() || "there";

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui", lineHeight: 1.6 }}>
      {preheader ? (
        <div
          style={{
            display: "none",
            fontSize: "1px",
            color: "#f8fafc",
            lineHeight: "1px",
            maxHeight: "0px",
            maxWidth: "0px",
            opacity: 0,
            overflow: "hidden",
          }}
        >
          {preheader}
        </div>
      ) : null}
      <h1>Welcome to Wellside</h1>
      <p>Hi {recipient},</p>
      <p>
        Thanks for joining Wellside. You can now book your next appointment and
        manage your visits in one place.
      </p>
      <p>If you have any questions, just reply to this email.</p>
    </div>
  );
}
