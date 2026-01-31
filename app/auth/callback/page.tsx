"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const buildRedirectPath = (type: string | null) => {
  if (type === "invite" || type === "recovery") {
    return `/set-password?type=${type}`;
  }
  return "/home";
};

export default function AuthCallbackPage() {
  useEffect(() => {
    const supabase = createClient();
    const url = new URL(window.location.href);
    const searchType = url.searchParams.get("type");
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const hashType = hashParams.get("type");
    const type = searchType ?? hashType;

    const finalize = (targetType: string | null) => {
      window.location.replace(buildRedirectPath(targetType));
    };

    const code = url.searchParams.get("code");
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .finally(() => finalize(type));
      return;
    }

    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .finally(() => finalize(type));
      return;
    }

    finalize(type);
  }, []);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <p className="text-sm text-muted-foreground">Processing authentication…</p>
    </div>
  );
}
