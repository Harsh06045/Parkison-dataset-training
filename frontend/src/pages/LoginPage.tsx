import React, { useState, useRef, useEffect } from "react";
import {
  Brain,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Stethoscope,
  Activity,
  Cpu,
  CheckCircle2,
  User,
  Shield,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/services/authApi";

interface LoginPageProps {
  onSuccess?: () => void;
  onSuccessNavigate?: (path: string) => void;
}

export function LoginPage({ onSuccess, onSuccessNavigate }: LoginPageProps) {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>("doctor");
  const [email, setEmail] = useState("dr.jenkins@neurofusion.ai");
  const [password, setPassword] = useState("DoctorPass2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);

  // Switch role and update preset defaults
  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    setError(null);
    if (role === "doctor") {
      setEmail("dr.jenkins@neurofusion.ai");
      setPassword("DoctorPass2026!");
    } else if (role === "patient") {
      setEmail("eleanor.vance@patient.neurofusion.ai");
      setPassword("PatientPass2026!");
    } else if (role === "admin") {
      setEmail("admin.it@hospital.org");
      setPassword("AdminPass2026!");
    }
  };

  // Ensure videos play smoothly
  useEffect(() => {
    if (desktopVideoRef.current) {
      desktopVideoRef.current.play().catch(() => {});
    }
    if (mobileVideoRef.current) {
      mobileVideoRef.current.play().catch(() => {});
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const authed = await login(email, password, selectedRole);
      const targetDashboard =
        authed.role === "patient"
          ? "/patient/dashboard"
          : authed.role === "admin"
          ? "/admin/dashboard"
          : "/doctor/dashboard";

      if (onSuccessNavigate) {
        onSuccessNavigate(targetDashboard);
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials or authorization key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    if (selectedRole === "doctor") {
      setEmail("dr.jenkins@neurofusion.ai");
      setPassword("DoctorPass2026!");
    } else if (selectedRole === "patient") {
      setEmail("eleanor.vance@patient.neurofusion.ai");
      setPassword("PatientPass2026!");
    } else if (selectedRole === "admin") {
      setEmail("admin.it@hospital.org");
      setPassword("AdminPass2026!");
    }
    setError(null);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row bg-[#0b1c30] text-[#0b1c30] select-none overflow-x-hidden">
      {/* ========================================================================= */}
      {/* LEFT PANE: Video Hero Section (Exact Fit Inside Left Area)               */}
      {/* ========================================================================= */}
      <div className="relative hidden lg:flex w-1/2 min-h-screen flex-col justify-between p-10 xl:p-14 text-white overflow-hidden bg-[#0b1c30] shadow-2xl">
        {/* Background Video Layer - Contained Exactly Inside Left Pane */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            ref={desktopVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 contrast-110"
          >
            <source src="/videos/Video Project 1.mp4" type="video/mp4" />
            <source src="/videos/Video%20Project%201.mp4" type="video/mp4" />
          </video>

          {/* Medical Clinical Vignette & Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c30] via-[#0b1c30]/75 to-[#0b1c30]/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1c30]/85 via-transparent to-[#0b1c30]/60" />

          {/* High-Tech Neural Grid Overlay */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, rgba(57, 184, 253, 0.5) 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* Top Header Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0ea5e9] to-[#39b8fd] text-white shadow-lg shadow-[#0ea5e9]/30">
              <Brain className="size-6" />
            </div>
            <div>
              <span className="font-headline font-black text-2xl tracking-tight text-white flex items-center gap-1.5 drop-shadow-sm">
                NeuroFusion<span className="text-[#39b8fd]">AI</span>
              </span>
              <span className="text-[0.65rem] uppercase font-bold tracking-widest text-[#94a3b8] block">
                Clinical Diagnostic Platform
              </span>
            </div>
          </div>

          <span className="rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-[0.68rem] font-bold text-[#39b8fd] border border-white/15 shadow-sm">
            v2.4 Production SaMD
          </span>
        </div>

        {/* Center Hero Statement */}
        <div className="relative z-10 space-y-4 max-w-lg my-auto py-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0ea5e9]/20 border border-[#0ea5e9]/40 px-3.5 py-1 text-xs font-bold text-[#39b8fd] backdrop-blur-md">
            <Sparkles className="size-3.5 text-[#39b8fd]" />
            <span>
              {selectedRole === "doctor"
                ? "SaMD Clinical Decision Support"
                : selectedRole === "patient"
                ? "Patient Health Record Portal"
                : "PACS & System Governance Console"}
            </span>
          </div>

          <h1 className="font-headline text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
            AI-Assisted <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39b8fd] via-[#38bdf8] to-[#0ea5e9]">
              Neurological Analysis
            </span>
          </h1>

          <p className="text-base text-cyan-200 leading-snug font-semibold drop-shadow">
            An Explainable Hybrid Deep Learning Framework for Neurodegenerative Disease Analysis
          </p>

          <p className="text-xs text-slate-300 leading-relaxed font-normal drop-shadow">
            NeuroFusionAI unites volumetric 3D Brain MRI Convolutional Vision Transformers and Quantum-Inspired Acoustic Phonation Classifiers into a single, cohesive clinical interface. Providing interpretable Grad-CAM heatmaps, biomarker SHAP rankings, and automated diagnostic reports for cognitive neurologists and clinical teams.
          </p>
        </div>

        {/* Bottom Feature Badges Grid */}
        <div className="relative z-10 pt-6 border-t border-white/10 grid grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
            <div className="flex items-center gap-1.5 text-[#39b8fd] font-bold text-[0.7rem] uppercase">
              <Brain className="size-3.5" />
              <span>3D MRI ViT</span>
            </div>
            <p className="text-[0.68rem] text-slate-200 mt-1 font-medium">Volumetric Grad-CAM</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
            <div className="flex items-center gap-1.5 text-[#39b8fd] font-bold text-[0.7rem] uppercase">
              <Cpu className="size-3.5" />
              <span>Quantum Layer</span>
            </div>
            <p className="text-[0.68rem] text-slate-200 mt-1 font-medium">4-Qubit VQC Decision</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
            <div className="flex items-center gap-1.5 text-[#39b8fd] font-bold text-[0.7rem] uppercase">
              <ShieldCheck className="size-3.5" />
              <span>HIPAA Compliant</span>
            </div>
            <p className="text-[0.68rem] text-slate-200 mt-1 font-medium">100% Audit Verified</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANE / MOBILE AREA: Form Card (Clean White or Mobile Glass)         */}
      {/* ========================================================================= */}
      <div className="relative w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 lg:bg-white overflow-hidden">
        {/* Mobile Background Video Layer (Shown Only on Mobile Viewports) */}
        <div className="lg:hidden absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            ref={mobileVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 contrast-110"
          >
            <source src="/videos/Video Project 1.mp4" type="video/mp4" />
            <source src="/videos/Video%20Project%201.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c30] via-[#0b1c30]/85 to-[#0b1c30]/80" />
        </div>

        {/* Mobile Header Branding (Visible on Phone/Tablet) */}
        <div className="relative z-10 flex lg:hidden flex-col items-center text-center mb-5 pt-2 space-y-1.5">
          <div className="flex size-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0ea5e9] to-[#39b8fd] text-white shadow-xl shadow-[#0ea5e9]/40 mb-1">
            <Brain className="size-7" />
          </div>
          <div>
            <h1 className="font-headline font-black text-2xl text-white tracking-tight drop-shadow-md">
              NeuroFusion<span className="text-[#39b8fd]">AI</span>
            </h1>
            <p className="text-[0.68rem] text-cyan-200 font-semibold uppercase tracking-wider drop-shadow">
              Clinical Diagnostic Portal
            </p>
          </div>
        </div>

        {/* Multi-Role Login Card */}
        <div className="relative z-10 w-full max-w-md bg-white/95 lg:bg-white backdrop-blur-xl border border-white/40 lg:border-none rounded-3xl lg:rounded-none p-6 sm:p-8 lg:p-0 shadow-2xl lg:shadow-none space-y-5">
          {/* Persona Role Switcher Pills */}
          <div className="space-y-1.5">
            <label className="text-[0.68rem] font-bold uppercase tracking-wider text-[#64748b] block">
              Select Portal Access Role:
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#f1f5f9] border border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => handleRoleChange("doctor")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === "doctor"
                    ? "bg-[#0ea5e9] text-white shadow-sm"
                    : "text-[#64748b] hover:text-[#0b1c30] hover:bg-white/60"
                }`}
              >
                <Stethoscope className="size-3.5" />
                <span>Doctor</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange("patient")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === "patient"
                    ? "bg-[#0ea5e9] text-white shadow-sm"
                    : "text-[#64748b] hover:text-[#0b1c30] hover:bg-white/60"
                }`}
              >
                <User className="size-3.5" />
                <span>Patient</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange("admin")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === "admin"
                    ? "bg-[#0ea5e9] text-white shadow-sm"
                    : "text-[#64748b] hover:text-[#0b1c30] hover:bg-white/60"
                }`}
              >
                <Shield className="size-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Form Dynamic Header */}
          <div className="border-b border-[#e2e8f0] pb-3">
            <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30] tracking-tight">
              {selectedRole === "doctor" && "Doctor Login"}
              {selectedRole === "patient" && "Patient Portal Login"}
              {selectedRole === "admin" && "Hospital Admin & PACS"}
            </h2>
            <p className="text-xs font-semibold text-[#6366f1] mt-0.5">
              {selectedRole === "doctor" && "An Explainable Hybrid Deep Learning Framework for Neurodegenerative Disease Analysis"}
              {selectedRole === "patient" && "Personal Neurological Health Records & Longitudinal Scan Archive"}
              {selectedRole === "admin" && "System Health, DICOM Infrastructure & AI Checkpoint Governance"}
            </p>
            <p className="text-[0.72rem] text-[#64748b] mt-0.5">
              {selectedRole === "doctor" && "Please enter your authorized medical credentials to access the clinical workspace."}
              {selectedRole === "patient" && "Access your personal 3D MRI scan results, voice assessments, and doctor reports."}
              {selectedRole === "admin" && "Authenticate with your hospital IT administrator credentials to manage infrastructure."}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 animate-in fade-in duration-150">
              <AlertCircle className="size-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Email / ID Field */}
            <div className="space-y-1.5">
              <label className="font-bold text-[#0b1c30] block">
                {selectedRole === "doctor" && "Doctor Email Address"}
                {selectedRole === "patient" && "Patient Email / MRN ID"}
                {selectedRole === "admin" && "Admin IT Email Address"}
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRole === "doctor"
                      ? "dr.jenkins@hospital.org"
                      : selectedRole === "patient"
                      ? "eleanor.vance@patient.org"
                      : "admin.it@hospital.org"
                  }
                  className="w-full h-11 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] pl-10 pr-3 text-xs text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#0b1c30] block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert(`Password reset instructions sent for ${selectedRole} account.`)}
                  className="text-[0.68rem] text-[#0ea5e9] font-bold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#64748b]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] pl-10 pr-10 text-xs text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[#64748b] hover:text-[#0b1c30]"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Terminal Indicator */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-[#cbd5e1] text-[#0ea5e9] focus:ring-[#0ea5e9]"
                />
                <span className="text-xs text-[#475569] font-medium">Keep session authenticated</span>
              </label>

              <span className="text-[0.68rem] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                <span>{selectedRole === "doctor" ? "DICOM Ready" : "Encrypted (AES-256)"}</span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-12 text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <span>Validating {selectedRole.toUpperCase()} Token...</span>
              ) : (
                <>
                  <span>
                    {selectedRole === "doctor" && "Access Clinical Portal"}
                    {selectedRole === "patient" && "Access Patient Portal"}
                    {selectedRole === "admin" && "Access Admin Console"}
                  </span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Autofill Preset Box for Selected Persona */}
          <div className="pt-3 border-t border-[#e2e8f0]">
            <div className="rounded-2xl bg-[#f0f9ff] border border-[#0ea5e9]/20 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#0284c7] flex items-center gap-1.5">
                  {selectedRole === "doctor" && <Stethoscope className="size-3.5 text-[#0ea5e9]" />}
                  {selectedRole === "patient" && <User className="size-3.5 text-[#0ea5e9]" />}
                  {selectedRole === "admin" && <Shield className="size-3.5 text-[#0ea5e9]" />}
                  <span>{selectedRole.toUpperCase()} Demo Credentials</span>
                </span>
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="rounded-lg bg-white px-2.5 py-1 text-[0.65rem] font-bold text-[#0ea5e9] border border-[#0ea5e9]/30 hover:bg-[#e0f2fe] transition-colors"
                >
                  Auto Fill
                </button>
              </div>
              <p className="text-[0.68rem] text-[#64748b] font-mono truncate">
                {selectedRole === "doctor" && "Dr. Sarah Jenkins (MD-98472-NEURO) • Cognitive Neurology"}
                {selectedRole === "patient" && "Eleanor Vance (MRN-489201) • Outpatient Registry"}
                {selectedRole === "admin" && "Marcus Vance (IT-ADMIN-894) • PACS Infrastructure"}
              </p>
            </div>
          </div>

          {/* Security Guarantee Footer */}
          <div className="text-center pt-1 text-[0.65rem] text-[#64748b] space-y-0.5">
            <p className="flex items-center justify-center gap-1 font-semibold text-[#0b1c30]">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>TLS 1.3 256-Bit Encrypted Multi-Tenant SaMD Portal</span>
            </p>
            <p>© 2026 NeuroFusionAI Systems Inc.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
