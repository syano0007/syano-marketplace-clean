import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import { applyDirection } from "@/i18n";

interface ServerSettings {
  theme?: string;
  language?: string;
  currency?: string;
}

async function fetchSettings(token: string): Promise<ServerSettings | null> {
  try {
    const res = await fetch("/api/user/settings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json() as ServerSettings;
  } catch {
    return null;
  }
}

async function pushSettings(token: string, settings: ServerSettings): Promise<void> {
  try {
    await fetch("/api/user/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });
  } catch {
    // Silently ignore — local state is always the source of truth for the UX
  }
}

/**
 * Mounts inside all settings providers.
 * - On login/page-load: fetches user's saved settings from server and applies them.
 * - While authenticated: debounces any theme/language/currency change and persists to server.
 */
export function useSettingsSync() {
  const { token, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { i18n } = useTranslation();

  // Has the server fetch completed for the current session? Don't save until then.
  const serverLoadedRef = useRef(false);
  const prevTokenRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── On token appearance (login or page reload with stored token) ─────────────
  useEffect(() => {
    if (token && token !== prevTokenRef.current) {
      prevTokenRef.current = token;
      serverLoadedRef.current = false;

      void (async () => {
        const settings = await fetchSettings(token);
        if (!settings) { serverLoadedRef.current = true; return; }

        if (settings.theme && ["light", "dark", "system"].includes(settings.theme)) {
          setTheme(settings.theme);
        }
        if (settings.language && ["ar", "en"].includes(settings.language)) {
          void i18n.changeLanguage(settings.language);
          applyDirection(settings.language);
          try { localStorage.setItem("marketplace_lang", settings.language); } catch {}
        }
        if (settings.currency === "SYP" || settings.currency === "USD") {
          setCurrency(settings.currency as "SYP" | "USD");
        }
        serverLoadedRef.current = true;
      })();
    } else if (!token) {
      prevTokenRef.current = null;
      serverLoadedRef.current = false;
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced save when settings change while authenticated ──────────────────
  useEffect(() => {
    if (!isAuthenticated || !token || !serverLoadedRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const lang = i18n.language;
    saveTimerRef.current = setTimeout(() => {
      void pushSettings(token, { theme: theme ?? "dark", language: lang, currency });
    }, 900);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [theme, i18n.language, currency, isAuthenticated, token]); // eslint-disable-line react-hooks/exhaustive-deps
}
