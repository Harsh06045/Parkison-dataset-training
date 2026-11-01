import { useState } from "react";
import { ArrowRight, Lock, Mail, User as UserIcon, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { AccountTypeSelector, type AccountType } from "@/components/AccountTypeSelector";
import { Button } from "@/components/ui/button";
import { authService, type User } from "@/lib/authService";

interface RegisterCardProps {
  onSuccess: (user: User) => void;
  onSwitchToLogin: () => void;
}

export function RegisterCard({ onSuccess, onSwitchToLogin }: RegisterCardProps) {
  const [role, setRole] = useState<AccountType>("doctor");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [medicalLicenseId, setMedicalLicenseId] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (role === "doctor" && !medicalLicenseId.trim()) {
      setError("Medical License / NPI ID is required for Doctor registration.");
      return;
    }
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    try {
      setLoading(true);
      const user = await authService.register({
        fullName,
        email,
        role,
        medicalLicenseId: role === "doctor" ? medicalLicenseId : undefined,
      });
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[340px] xs:max-w-[370px] sm:max-w-[420px] lg:max-w-[440px] xl:max-w-[450px] rounded-[20px] border border-blue-500/30 bg-[#060919]/90 p-3 sm:p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_35px_rgba(37,99,235,0.2)] backdrop-blur-2xl transition-all duration-300 hover:border-blue-500/50 my-auto max-h-[calc(100vh-4.5rem)] overflow-y-auto"
    >
      {/* Header Titles */}
      <h2 className="text-center text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-sm">
        Create Account
      </h2>
      <p className="mt-0.5 text-center text-[0.62rem] text-slate-400">
        Join NeuroFusion AI to access predictive diagnostics
      </p>

      {error && (
        <div className="mt-1.5 flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/40 p-1.5 text-[0.65rem] text-red-300 backdrop-blur-md">
          <AlertCircle className="size-3.5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-1.5 space-y-1 sm:space-y-1.5">
        {/* Full Name */}
        <div className="space-y-0.5">
          <label htmlFor="reg-name" className="text-[0.65rem] font-medium text-slate-300">
            Full Name
          </label>
          <div className="relative">
            <UserIcon
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="reg-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Sarah Jenkins"
              className="h-7.5 sm:h-8 w-full rounded-lg border border-slate-800/90 bg-slate-950/60 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 backdrop-blur-md transition-all focus:border-blue-500/80 focus:bg-slate-900/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-0.5">
          <label htmlFor="reg-email" className="text-[0.65rem] font-medium text-slate-300">
            Email Address
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@institution.org"
              className="h-7.5 sm:h-8 w-full rounded-lg border border-slate-800/90 bg-slate-950/60 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 backdrop-blur-md transition-all focus:border-blue-500/80 focus:bg-slate-900/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-0.5">
          <label htmlFor="reg-password" className="text-[0.65rem] font-medium text-slate-300">
            Password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="h-7.5 sm:h-8 w-full rounded-lg border border-slate-800/90 bg-slate-950/60 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 backdrop-blur-md transition-all focus:border-blue-500/80 focus:bg-slate-900/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Account Type Selector ("Login as") */}
        <AccountTypeSelector value={role} onChange={setRole} />

        {/* Doctor Medical License / NPI Field */}
        {role === "doctor" && (
          <div className="space-y-0.5">
            <label htmlFor="reg-license" className="text-[0.65rem] font-medium text-blue-300">
              Medical License / NPI Number
            </label>
            <div className="relative">
              <ShieldCheck
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-blue-400"
                aria-hidden="true"
              />
              <input
                id="reg-license"
                type="text"
                value={medicalLicenseId}
                onChange={(e) => setMedicalLicenseId(e.target.value)}
                placeholder="e.g. MD-94820-CA"
                className="h-7.5 sm:h-8 w-full rounded-lg border border-blue-500/40 bg-blue-950/30 pl-8 pr-3 text-xs text-white placeholder:text-blue-300/40 backdrop-blur-md transition-all focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
          </div>
        )}

        {/* Terms Agreement */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <input
            id="terms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="size-3.5 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/40"
          />
          <label htmlFor="terms" className="text-[0.62rem] text-slate-300">
            I agree to the{" "}
            <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a> &amp;{" "}
            <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="h-8 sm:h-8.5 w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-xs font-semibold text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] transition-all duration-300 hover:shadow-[0_6px_25px_rgba(99,102,241,0.5)] hover:brightness-110 active:scale-[0.99] gap-1.5 flex items-center justify-center disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="size-3.5" />
            </>
          )}
        </Button>

        {/* Footer link */}
        <p className="pt-0.5 text-center text-[0.62rem] text-slate-400">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-blue-400 transition-colors hover:text-blue-300 hover:underline"
          >
            Sign in here
          </button>
        </p>
      </div>
    </form>
  );
}
