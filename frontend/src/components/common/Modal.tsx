import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "lg",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthMap = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${maxWidthMap[maxWidth]} rounded-3xl border border-[#e2e8f0] bg-white p-6 sm:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 my-8`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4 mb-6">
            <h3 className="font-headline text-lg font-bold text-[#0b1c30] tracking-tight">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#0b1c30] transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {!title && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#0b1c30] transition-colors"
          >
            <X className="size-4" />
          </button>
        )}

        {children}
      </div>
    </div>
  );
}
