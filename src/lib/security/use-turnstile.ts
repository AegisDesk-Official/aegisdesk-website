"use client";

import { useCallback, useEffect, useRef } from "react";

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstile(): Promise<TurnstileApi> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    let script = document.querySelector<HTMLScriptElement>("script[data-aegis-turnstile]");
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.dataset.aegisTurnstile = "1";
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing"))));
    script.addEventListener("error", () => reject(new Error("turnstile failed to load")));
  });
}

/**
 * Cloudflare Turnstile, loaded only when a site key is set. Each token works
 * once, so call reset() after every request to get the next one.
 * Returns a ref for the container element, plus getToken() and reset().
 */
export function useTurnstile(siteKey: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !containerRef.current || widgetIdRef.current) return;
        widgetIdRef.current = api.render(containerRef.current, {
          sitekey: siteKey,
          appearance: "interaction-only",
          callback: (token: string) => {
            tokenRef.current = token;
          },
          "expired-callback": () => {
            tokenRef.current = null;
          },
          "error-callback": () => {
            tokenRef.current = null;
          },
        });
      })
      .catch(() => {
        tokenRef.current = null;
      });
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
      tokenRef.current = null;
    };
  }, [siteKey]);

  const getToken = useCallback(() => tokenRef.current, []);
  const reset = useCallback(() => {
    tokenRef.current = null;
    if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
  }, []);

  return { containerRef, getToken, reset, enabled: !!siteKey };
}
