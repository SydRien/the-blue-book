"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { getStorageBackend } from "@/lib/storage";

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const needsAuth =
    getStorageBackend() === "supabase" && isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!needsAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!needsAuth) {
      return;
    }

    const client = getSupabaseClient();

    void client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [needsAuth]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!needsAuth) {
      return;
    }

    setPending(true);
    setError(null);
    const client = getSupabaseClient();

    try {
      if (mode === "sign-in") {
        const { error: signInError } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          throw signInError;
        }
      } else {
        const { error: signUpError } = await client.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) {
          throw signUpError;
        }
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Authentication failed",
      );
    } finally {
      setPending(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <p className="font-mono text-xs tracking-[0.16em] text-muted uppercase">
          Checking session…
        </p>
      </div>
    );
  }

  if (needsAuth && !session) {
    return (
      <div className="flex h-full items-center justify-center bg-background px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-sm border border-panel-border bg-panel p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
        >
          <div className="mb-4 flex items-center justify-between">
            <h1 className="font-mono text-sm tracking-[0.18em] text-foreground uppercase">
              The Blue Book
            </h1>
            <div className="flex gap-1.5" aria-hidden>
              <span className="panel-screw" />
              <span className="panel-screw" />
            </div>
          </div>
          <p className="mb-5 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
            Personal access · Cloud sync
          </p>

          <label className="mb-3 block">
            <span className="mb-1 block font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-sm border border-panel-border bg-panel-inset px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-accent-soft"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 block font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
              Password
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-sm border border-panel-border bg-panel-inset px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-accent-soft"
            />
          </label>

          {error ? (
            <p className="mb-3 font-mono text-[10px] text-[#c45c5c]">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="module-button mb-3 w-full rounded-sm border border-panel-border px-3 py-2 font-mono text-[11px] tracking-[0.14em] text-foreground uppercase"
          >
            {pending
              ? "Working…"
              : mode === "sign-in"
                ? "Sign In"
                : "Create Account"}
          </button>

          <button
            type="button"
            className="w-full font-mono text-[10px] tracking-[0.12em] text-led-cyan uppercase"
            onClick={() =>
              setMode((current) =>
                current === "sign-in" ? "sign-up" : "sign-in",
              )
            }
          >
            {mode === "sign-in"
              ? "Need an account? Sign up"
              : "Have an account? Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
