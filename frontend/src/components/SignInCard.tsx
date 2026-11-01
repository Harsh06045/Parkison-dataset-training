import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { AccountTypeSelector, type AccountType } from "@/components/AccountTypeSelector";
import { Button } from "@/components/ui/button";
import { authService, type User } from "@/lib/authService";

interface SignInCardProps {
  onSuccess?: (user: User) => void;
  onSwitchToRegister?: () => void;
  onSwitchToForgotPassword?: () => void;
}

export function SignInCard({ onSuccess, onSwitchToRegister, onSwitchToForgotPassword }: SignInCardProps) {
  const [accountType, setAccountType] = useState<AccountType>("doctor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      const user = await authService.login(email, password, accountType);
      if (onSuccess) onSuccess(user);
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[340px] xs:max-w-[370px] sm:max-w-[420px] lg:max-w-[440px] xl:max-w-[450px] rounded-[20px] border border-blue-500/30 bg-[#060919]/90 p-3 sm:p-4 lg:p-4.5 shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_35px_rgba(37,99,235,0.2)] backdrop-blur-2xl transition-all duration-300 hover:border-blue-500/50 my-0 max-h-[calc(100vh-4.5rem)] overflow-y-auto"
    >
      {/* Header Titles */}
      <h2 className="text-center text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-sm">
        Welcome Back
      </h2>
      <p className="mt-0.5 text-center text-[0.62rem] text-slate-400">
        Sign in to continue to NeuroFusion AI
      </p>

      {error && (
        <div className="mt-1.5 flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/40 p-1.5 text-[0.65rem] text-red-300 backdrop-blur-md">
          <AlertCircle className="size-3.5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-1.5 space-y-1.5 sm:space-y-2">
        {/* Email Address */}
        <div className="space-y-0.5">
          <label htmlFor="email" className="text-[0.65rem] font-medium text-slate-300">
            Email Address
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="e.g. doctor@neurofusion.ai"
              className="h-8 sm:h-8.5 w-full rounded-lg border border-slate-800/90 bg-slate-950/60 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 backdrop-blur-md transition-all focus:border-blue-500/80 focus:bg-slate-900/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-0.5">
          <label htmlFor="password" className="text-[0.65rem] font-medium text-slate-300">
            Password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="h-8 sm:h-8.5 w-full rounded-lg border border-slate-800/90 bg-slate-950/60 pl-8 pr-8 text-xs text-white placeholder:text-slate-500 backdrop-blur-md transition-all focus:border-blue-500/80 focus:bg-slate-900/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-200 p-0.5"
            >
              {showPassword ? (
                <EyeOff className="size-3.5" aria-hidden="true" />
              ) : (
                <Eye className="size-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-[0.62rem] text-blue-400 transition-colors hover:text-blue-300 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* Account Type Selector ("Login as") */}
        <AccountTypeSelector value={accountType} onChange={setAccountType} />

        {/* Sign In Button */}
        <Button
          type="submit"
          disabled={loading}
          className="h-8 sm:h-8.5 w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-xs font-semibold text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] transition-all duration-300 hover:shadow-[0_6px_25px_rgba(99,102,241,0.5)] hover:brightness-110 active:scale-[0.99] gap-1.5 flex items-center justify-center disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="size-3.5" />
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative my-1 flex items-center justify-center">
          <div className="w-full border-t border-slate-800/80"></div>
          <span className="absolute bg-[#060919] px-2 text-[0.6rem] text-slate-500">
            or continue with
          </span>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* Google */}
          <button
            type="button"
            className="group flex h-7.5 sm:h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-950/40 px-2.5 text-[0.68rem] sm:text-xs font-medium text-slate-300 transition-all duration-300 hover:border-blue-500/40 hover:bg-blue-950/30 hover:text-white hover:scale-[1.03] hover:shadow-[0_2px_12px_rgba(59,130,246,0.15)]"
          >
            <svg className="size-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="truncate">Google</span>
          </button>

          {/* Microsoft */}
          <button
            type="button"
            className="group flex h-7.5 sm:h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-950/40 px-2.5 text-[0.68rem] sm:text-xs font-medium text-slate-300 transition-all duration-300 hover:border-blue-500/40 hover:bg-blue-950/30 hover:text-white hover:scale-[1.03] hover:shadow-[0_2px_12px_rgba(59,130,246,0.15)]"
          >
            <svg className="size-3.5" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H1z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            <span className="truncate">Microsoft</span>
          </button>
        </div>

        {/* Footer link */}
        <p className="pt-0.5 text-center text-[0.62rem] text-slate-400">
          Don&rsquo;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-blue-400 transition-colors hover:text-blue-300 hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </form>
  );
}
