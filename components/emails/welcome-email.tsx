import * as React from "react";

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui", lineHeight: 1.6 }}>
      <h1>Welcome, {name} 👋</h1>
      <p>
        Ini email test pertama dari <b>Wellside</b>.
      </p>
      <p>Kalau awak terima email ni, setup Resend memang dah ngam ✅</p>
    </div>
  );
}
