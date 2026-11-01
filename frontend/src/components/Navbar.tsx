import { useState } from "react";
import { Brain, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { type User } from "@/lib/authService";

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "features", label: "Features" },
  { id: "workflow", label: "AI Workflow" },
  { id: "tech_stack", label: "Tech Stack" },
  { id: "contact", label: "Contact" },
];

export function Navbar({ currentView, onNavigate, currentUser, onLogout }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-blue-500/20 bg-[#040612]/85 backdrop-blur-2xl transition-all shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16 sm:h-18">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2.5 text-left group focus:outline-none shrink-0"
        >
          <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-indigo-950/80 border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.35)] backdrop-blur-md group-hover:border-indigo-400 transition-all">
            <Brain className="size-5 sm:size-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Neuro<span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Fusion AI</span>
            </span>
            <span className="text-[0.6rem] font-medium tracking-wide text-slate-400 -mt-1 hidden sm:block">
              Intelligent. <span className="text-blue-400">Explainable.</span> Reliable.
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-blue-500/20 bg-slate-950/60 px-2.5 py-1 backdrop-blur-xl shadow-inner">
          {NAV_LINKS.map(({ id, label }) => {
            const active = currentView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-blue-300 border border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Auth Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate("dashboard")}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/60 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/60 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
              >
                <LayoutDashboard className="size-3.5" />
                <span>{currentUser.role.toUpperCase()} Portal</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-slate-700 hover:text-white transition-all"
                title="Logout"
              >
                <LogOut className="size-3.5" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate("login")}
                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-700 hover:text-white transition-all"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onNavigate("register")}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:brightness-110 transition-all"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex size-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#040612]/95 px-5 py-4 backdrop-blur-2xl space-y-3">
          <div className="flex flex-col gap-1.5">
            {NAV_LINKS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onNavigate(id);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  currentView === id
                    ? "bg-blue-600/25 text-blue-300 border border-blue-500/40"
                    : "text-slate-300 hover:bg-slate-900/60 hover:text-white"
                }`}
              >
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate("dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white"
                >
                  <LayoutDashboard className="size-3.5" />
                  <span>Go to {currentUser.role.toUpperCase()} Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 py-2 text-xs font-medium text-slate-400"
                >
                  <LogOut className="size-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate("login");
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 py-2 text-center text-xs font-semibold text-white"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate("register");
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2 text-center text-xs font-semibold text-white"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
