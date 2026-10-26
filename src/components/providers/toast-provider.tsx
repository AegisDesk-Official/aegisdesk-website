"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, type = "info", duration = 4000 }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, title, description, type, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-5",
              t.type === "success" && "bg-emerald-950/90 border-emerald-800/60 text-emerald-100",
              t.type === "error" && "bg-red-950/90 border-red-800/60 text-red-100",
              t.type === "warning" && "bg-amber-950/90 border-amber-800/60 text-amber-100",
              t.type === "info" && "bg-card/95 border-border text-foreground"
            )}
          >
            {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === "error" && <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />}
            {t.type === "warning" && <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />}
            {t.type === "info" && <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />}

            <div className="flex-1">
              <h5 className="text-sm font-semibold leading-tight">{t.title}</h5>
              {t.description && <p className="text-xs opacity-90 mt-1">{t.description}</p>}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
