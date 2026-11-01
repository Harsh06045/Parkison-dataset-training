import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastMessage, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => addToast({ type: "success", title, message }), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast({ type: "error", title, message }), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast({ type: "warning", title, message }), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast({ type: "info", title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Renderer */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              toast.type === "success"
                ? "bg-[#061e14]/90 border-emerald-500/40 text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                : toast.type === "error"
                ? "bg-[#25090e]/90 border-rose-500/40 text-rose-100 shadow-[0_10px_30px_rgba(244,63,94,0.2)]"
                : toast.type === "warning"
                ? "bg-[#271804]/90 border-amber-500/40 text-amber-100 shadow-[0_10px_30px_rgba(245,158,11,0.2)]"
                : "bg-[#08152c]/90 border-blue-500/40 text-blue-100 shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === "success" && <CheckCircle2 className="size-5 text-emerald-400" />}
              {toast.type === "error" && <AlertCircle className="size-5 text-rose-400" />}
              {toast.type === "warning" && <AlertTriangle className="size-5 text-amber-400" />}
              {toast.type === "info" && <Info className="size-5 text-blue-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white leading-snug">{toast.title}</h4>
              {toast.message && <p className="text-[0.72rem] text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
