import { useState } from "react";
import { ArrowLeft, ArrowRight, Brain, KeyRound, Mail, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/authService";

interface ForgotPasswordCardProps {
  onBackToLogin: () => void;
}

type Step = "request" | "otp" | "reset" | "success";

export function ForgotPasswordCard({ onBackToLogin }: ForgotPasswordCardProps) {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword(email);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = otpCode.join("");
    if (code.length < 6) {
      setError("Please enter all 6 digits of the OTP verification code.");
      return;
    }

    try {
      setLoading(true);
      await authService.verifyOtp(email, code);
      setStep("reset");
    } catch (err: any) {
      setError(err.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setStep("success");
    } catch (err: any) {
      setError("Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const next = [...otpCode];
    next[index] = value;
    setOtpCode(next);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  return (
    <div className="w-full max-w-[320px] xs:max-w-[350px] sm:max-w-[390px] lg:max-w-[410px] rounded-[22px] border border-blue-500/30 bg-[#060919]/85 p-3.5 sm:p-4.5 lg:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_35px_rgba(37,99,235,0.2)] backdrop-blur-2xl transition-all duration-300 hover:border-blue-500/50 my-auto max-h-[calc(100vh-5.5rem)] overflow-y-auto">
      {/* Header Avatar Circle */}
      <div className="flex justify-center">
        <div className="flex size-10 sm:size-11 items-center justify-center rounded-full border border-blue-500/35 bg-blue-950/50 shadow-[0_0_12px_rgba(59,130,246,0.3)] backdrop-blur-md">
          <Brain className="size-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" aria-hidden="true" />
        </div>
      </div>

      {error && (
        <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/40 p-2 text-[0.7rem] text-red-300 backdrop-blur-md">
          <AlertCircle className="size-3.5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Request OTP */}
      {step === "request" && (
        <form onSubmit={handleRequestOtp} className="mt-2.5 space-y-2.5">
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">Reset Password</h2>
            <p className="mt-0.5 text-[0.68rem] text-slate-400">
              Enter your email address and we&rsquo;ll send a 6-digit OTP verification code.
            </p>
          </div>

          <div className="space-y-0.5 pt-1">
            <label htmlFor="reset-email" className="text-[0.7rem] font-medium text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@institution.org"
                className="h-8.5 sm:h-9 w-full rounded-xl border border-slate-800/90 bg-slate-950/60 pl-8.5 pr-3 text-xs text-white placeholder:text-slate-500 backdrop-blur-md focus:border-blue-500/80 focus:outline-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-9 sm:h-9.5 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-semibold text-white shadow-md gap-2"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <><span>Send Reset OTP</span><ArrowRight className="size-3.5" /></>}
          </Button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center justify-center gap-1.5 w-full text-[0.68rem] text-slate-400 hover:text-white pt-0.5"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Sign In</span>
          </button>
        </form>
      )}

      {/* Step 2: OTP Verification */}
      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="mt-2.5 space-y-2.5">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[0.62rem] text-blue-300 mb-1.5">
              <ShieldCheck className="size-3" />
              <span>OTP Sent to {email}</span>
            </div>
            <h2 className="text-lg font-bold text-white">Enter OTP Code</h2>
            <p className="mt-0.5 text-[0.68rem] text-slate-400">
              Enter 6-digit code (Demo code: <strong className="text-blue-300">123456</strong>).
            </p>
          </div>

          {/* 6 Digit Inputs */}
          <div className="flex justify-center gap-1.5 py-1.5">
            {otpCode.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                className="size-8 sm:size-9 rounded-xl border border-slate-700 bg-slate-900/80 text-center text-xs font-bold text-blue-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-9 sm:h-9.5 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-semibold text-white shadow-md gap-2"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <><span>Verify OTP</span><ArrowRight className="size-3.5" /></>}
          </Button>

          <button
            type="button"
            onClick={() => setStep("request")}
            className="flex items-center justify-center gap-1.5 w-full text-[0.68rem] text-slate-400 hover:text-white pt-0.5"
          >
            <ArrowLeft className="size-3.5" />
            <span>Change Email Address</span>
          </button>
        </form>
      )}

      {/* Step 3: New Password */}
      {step === "reset" && (
        <form onSubmit={handleResetPassword} className="mt-2.5 space-y-2.5">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">Set New Password</h2>
            <p className="mt-0.5 text-[0.68rem] text-slate-400">Choose a new secure password for your account.</p>
          </div>

          <div className="space-y-0.5">
            <label className="text-[0.7rem] font-medium text-slate-300">New Password</label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="h-8.5 sm:h-9 w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-8.5 pr-3 text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-[0.7rem] font-medium text-slate-300">Confirm Password</label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="h-8.5 sm:h-9 w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-8.5 pr-3 text-xs text-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-9 sm:h-9.5 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-semibold text-white shadow-md gap-2"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <span>Update Password</span>}
          </Button>
        </form>
      )}

      {/* Step 4: Success */}
      {step === "success" && (
        <div className="mt-3 text-center space-y-2.5 py-1">
          <div className="flex justify-center text-emerald-400">
            <CheckCircle2 className="size-10 animate-bounce" />
          </div>
          <h2 className="text-lg font-bold text-white">Password Reset Complete!</h2>
          <p className="text-[0.7rem] text-slate-300">
            Your password has been successfully updated. You can now log in with your new credentials.
          </p>
          <Button
            type="button"
            onClick={onBackToLogin}
            className="h-9 w-full rounded-xl bg-blue-600 text-xs font-semibold text-white mt-1"
          >
            Go to Sign In
          </Button>
        </div>
      )}
    </div>
  );
}
