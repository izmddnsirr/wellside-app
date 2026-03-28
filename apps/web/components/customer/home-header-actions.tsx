"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { House } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type UserState = {
  isLoading: boolean;
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
};

const DEFAULT_USER_STATE: UserState = {
  isLoading: true,
  userId: null,
  displayName: "",
  avatarUrl: null,
};

export function HomeHeaderActions() {
  const [userState, setUserState] = useState<UserState>(DEFAULT_USER_STATE);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted || !user) {
        if (isMounted) {
          setUserState({ ...DEFAULT_USER_STATE, isLoading: false });
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, first_name, last_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      const displayName =
        profile?.display_name?.trim() ||
        [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
        user.email?.split("@")[0] ||
        "User";

      setUserState({
        isLoading: false,
        userId: user.id,
        displayName,
        avatarUrl: profile?.avatar_url?.trim() || null,
      });
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      if (!session?.user) {
        setUserState({ ...DEFAULT_USER_STATE, isLoading: false });
        return;
      }

      void loadUser();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const initials = useMemo(() => {
    return userState.displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [userState.displayName]);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUserState({ ...DEFAULT_USER_STATE, isLoading: false });
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  if (userState.isLoading || !userState.userId) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-border/60 bg-background/70 px-5 py-2 font-semibold text-foreground backdrop-blur-md backdrop-saturate-150 transition-colors hover:bg-muted dark:border-white/25 dark:bg-white/12 dark:hover:bg-white/24"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <Link
        href="/home"
        aria-label="Go to home"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 bg-white/85 text-black transition-colors hover:border-black/25 hover:bg-white dark:border-white/20 dark:bg-black/70 dark:text-white dark:hover:border-white/30 dark:hover:bg-black/85"
      >
        <House className="h-4 w-4" />
      </Link>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-black/15 bg-white/85 px-1.5 pr-2.5 text-black backdrop-blur-md backdrop-saturate-150 transition-colors hover:border-black/25 hover:bg-white dark:border-white/20 dark:bg-black/70 dark:text-white dark:hover:border-white/30 dark:hover:bg-black/85"
            aria-label="Open account menu"
          >
            {userState.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userState.avatarUrl}
                alt={userState.displayName}
                className="h-7 w-7 rounded-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-xs font-semibold text-black dark:bg-white/15 dark:text-white">
                {initials || "U"}
              </span>
            )}
            <span className="max-w-28 truncate text-sm font-semibold text-black sm:max-w-36 dark:text-white">
              {userState.displayName}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-44 rounded-xl border border-border/70 bg-background/95 p-1.5 shadow-xl backdrop-blur-xl dark:border-white/20 dark:bg-background/90"
        >
          <Link
            href="/home"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground/90 transition-colors hover:bg-muted dark:hover:bg-white/10"
          >
            Go to home
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-muted hover:text-red-600 dark:text-red-300 dark:hover:bg-white/10 dark:hover:text-red-200"
            disabled={isSigningOut}
          >
            {isSigningOut ? "Logging out..." : "Logout"}
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
