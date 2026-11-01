import React, { useState } from "react";
import {
  User,
  Shield,
  Bell,
  Sliders,
  FileText,
  Palette,
  Database,
  HelpCircle,
  Info,
  Save,
  Edit3,
  X,
  Check,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Smartphone,
  History,
  LogOut,
  Trash2,
  Download,
  Upload,
  Brain,
  Activity,
  Cpu,
  ChevronRight,
  ChevronDown,
  Mail,
  Phone,
  Hospital,
  MapPin,
  Stethoscope,
  Key,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/common/Modal";

type SettingsTab =
  | "profile"
  | "security"
  | "notifications"
  | "analysis"
  | "reports"
  | "appearance"
  | "privacy"
  | "support"
  | "about";

export function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // ==========================================
  // PROFILE STATE
  // ==========================================
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "Dr. Sarah Jenkins, MD, PhD");
  const [medicalLicenseId, setMedicalLicenseId] = useState(user?.medicalLicenseId || "MD-98472-NEURO");
  const [email, setEmail] = useState(user?.email || "dr.jenkins@neurofusion.ai");
  const [phone, setPhone] = useState("+1 (555) 234-8901");
  const [specialization, setSpecialization] = useState(user?.specialization || "Cognitive Neurology & Movement Disorders");
  const [hospital, setHospital] = useState(user?.hospital || "Metropolitan Neurological Institute & Brain Research Center");
  const [location, setLocation] = useState("Boston, MA • Clinical Suite 402");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ==========================================
  // SECURITY STATE
  // ==========================================
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30m");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLogoutAllModalOpen, setIsLogoutAllModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // ==========================================
  // NOTIFICATIONS STATE
  // ==========================================
  const [notifAnalysisComplete, setNotifAnalysisComplete] = useState(true);
  const [notifAnalysisFailed, setNotifAnalysisFailed] = useState(true);
  const [notifReportGenerated, setNotifReportGenerated] = useState(true);
  const [notifNewPatient, setNotifNewPatient] = useState(true);
  const [notifSystemUpdates, setNotifSystemUpdates] = useState(false);
  const [notifSecurityAlerts, setNotifSecurityAlerts] = useState(true);
  const [notificationChannel, setNotificationChannel] = useState<"in-app" | "email" | "both" | "off">("both");

  // ==========================================
  // ANALYSIS PREFERENCES STATE
  // ==========================================
  const [defaultDisease, setDefaultDisease] = useState<"alzheimer" | "parkinson">("alzheimer");
  const [showConfidenceScore, setShowConfidenceScore] = useState(true);
  const [showClassProbabilities, setShowClassProbabilities] = useState(true);
  const [showPipelineStages, setShowPipelineStages] = useState(true);
  const [autoOpenExplainability, setAutoOpenExplainability] = useState(true);
  const [autoSaveResults, setAutoSaveResults] = useState(true);
  const [gradCamResolution, setGradCamResolution] = useState<"high" | "standard">("high");
  const [quantumOptimizationMode, setQuantumOptimizationMode] = useState<"variational" | "standard">("variational");

  // ==========================================
  // REPORT PREFERENCES STATE
  // ==========================================
  const [reportShowHospitalLogo, setReportShowHospitalLogo] = useState(true);
  const [reportShowDoctorCredentials, setReportShowDoctorCredentials] = useState(true);
  const [reportShowDigitalSignature, setReportShowDigitalSignature] = useState(true);
  const [reportShowPatientDemographics, setReportShowPatientDemographics] = useState(true);
  const [reportShowGradCam, setReportShowGradCam] = useState(true);
  const [reportShowSHAP, setReportShowSHAP] = useState(true);
  const [reportShowQuantum, setReportShowQuantum] = useState(true);
  const [reportFormat, setReportFormat] = useState<"pdf" | "json">("pdf");

  // ==========================================
  // APPEARANCE STATE
  // ==========================================
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("light");
  const [layoutDensity, setLayoutDensity] = useState<"comfortable" | "compact">("comfortable");
  const [appLanguage, setAppLanguage] = useState("en-US");

  // ==========================================
  // PRIVACY STATE
  // ==========================================
  const [dataRetentionDays, setDataRetentionDays] = useState("90");
  const [isDeleteDataModalOpen, setIsDeleteDataModalOpen] = useState(false);

  // ==========================================
  // HELP & FAQ STATE
  // ==========================================
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile({
        fullName,
        medicalLicenseId,
        specialization,
        hospital,
      });
      setIsEditingProfile(false);
      success("Profile Updated", "Doctor credentials and clinic details saved successfully.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toastError("Password Too Short", "Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError("Mismatch", "New password and confirmation do not match.");
      return;
    }
    setIsPasswordModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    success("Security Credentials Updated", "Your physician account password has been changed.");
  };

  const handleSaveNotifications = () => {
    success("Notification Preferences Saved", "Your notification channels and alert filters have been updated.");
  };

  const handleSaveAnalysis = () => {
    success("Analysis Preferences Saved", "Clinical AI decision parameters and pipeline preferences calibrated.");
  };

  const handleSaveReports = () => {
    success("Report Template Saved", "Diagnostic clinical report generator configuration saved.");
  };

  const handleSaveAppearance = () => {
    success("Appearance Updated", `Theme set to ${themeMode.toUpperCase()} mode with ${layoutDensity} layout.`);
  };

  const handleExportData = () => {
    info("Preparing Data Export", "Generating encrypted JSON audit bundle for download...");
    setTimeout(() => {
      const dataStr = JSON.stringify(
        {
          doctor: { fullName, medicalLicenseId, specialization, hospital },
          exportedAt: new Date().toISOString(),
          settings: { defaultDisease, themeMode, dataRetentionDays },
        },
        null,
        2
      );
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `NeuroFusionAI_Data_Export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success("Export Complete", "Data archive downloaded.");
    }, 1200);
  };

  const navTabs = [
    { id: "profile", label: "Profile", icon: User, desc: "Doctor credentials & clinic" },
    { id: "security", label: "Account & Security", icon: Shield, desc: "2FA, password & sessions" },
    { id: "notifications", label: "Notifications", icon: Bell, desc: "Alerts & email triggers" },
    { id: "analysis", label: "Analysis Preferences", icon: Sliders, desc: "AI pipelines & models" },
    { id: "reports", label: "Report Preferences", icon: FileText, desc: "Template & PDF signatures" },
    { id: "appearance", label: "Appearance", icon: Palette, desc: "Themes, density & language" },
    { id: "privacy", label: "Privacy & Data", icon: Database, desc: "Data retention & export" },
    { id: "support", label: "Help & Support", icon: HelpCircle, desc: "Guides, FAQs & contact" },
    { id: "about", label: "About NeuroFusionAI", icon: Info, desc: "Architecture & citations" },
  ];

  const faqs = [
    {
      q: "How does Alzheimer's 3D MRI Analysis work?",
      a: "Our Alzheimer's module ingests volumetric T1/T2 MRI brain scans, normalizes the voxel coordinates, and passes them through an ensemble of 3D Convolutional Neural Networks (CNN) coupled with a Vision Transformer (ViT). This evaluates hippocampal volume, ventricular enlargement, and entorhinal cortical thinning.",
    },
    {
      q: "How does Parkinson's Voice Biomarker Analysis work?",
      a: "The Parkinson's module analyzes sustained phonation acoustic recordings (e.g. sustained vowel /a/). It extracts fundamental frequency perturbations (Jitter), amplitude deviations (Shimmer), and Harmonics-to-Noise Ratio (HNR), then evaluates them through a simulated 4-qubit Quantum-Inspired Variational Classifier (VQC).",
    },
    {
      q: "What is Grad-CAM explainability?",
      a: "Gradient-Weighted Class Activation Mapping (Grad-CAM) computes gradient flows to highlight the specific 3D anatomical brain regions that contributed most to the AI model's diagnosis across Axial, Coronal, and Sagittal slice planes.",
    },
    {
      q: "What are SHAP biomarker rankings?",
      a: "Shapley Additive Explanations (SHAP) calculate the positive and negative risk attribution of individual volumetric and acoustic biomarker factors relative to age-matched normal reference baselines.",
    },
    {
      q: "What is the Quantum-Inspired Decision Layer?",
      a: "It is a variational quantum circuit simulation (4 simulated qubits with angle-encoded rotation states) that projects high-dimensional acoustic feature vectors into Hilbert state space to find optimal non-linear decision boundaries.",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-[#0b1c30] select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
              System Configuration &amp; Governance
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="text-xs font-mono text-[#64748b]">Route: /settings</span>
          </div>
          <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
            Clinical Platform Settings
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Terminal Verified</span>
          </span>

          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3.5 py-1.5 text-xs transition-colors shadow-xs"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out Doctor</span>
          </button>
        </div>
      </div>

      {/* Main Settings Grid: Left Nav + Right Content Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT SETTINGS NAVIGATION PANEL (4 Cols)                                    */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-3 shadow-card border border-[#e2e8f0] space-y-1">
          <div className="px-3 py-2 border-b border-[#e2e8f0] mb-2">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#64748b]">
              Navigation Categories
            </span>
          </div>

          <div className="space-y-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`w-full flex items-center gap-3.5 p-3 rounded-xl text-left transition-all group ${
                    active
                      ? "bg-[#0ea5e9] text-white font-bold shadow-md"
                      : "text-[#475569] hover:bg-[#f8f9ff] hover:text-[#0b1c30]"
                  }`}
                >
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-[#f8f9ff] text-[#0ea5e9] group-hover:bg-[#e0f2fe]"
                    }`}
                  >
                    <Icon className="size-4.5" />
                  </div>

                  <div className="flex-1 truncate">
                    <p className={`text-xs ${active ? "text-white font-bold" : "font-bold text-[#0b1c30]"}`}>
                      {tab.label}
                    </p>
                    <p className={`text-[0.65rem] truncate ${active ? "text-white/80" : "text-[#64748b]"}`}>
                      {tab.desc}
                    </p>
                  </div>

                  <ChevronRight
                    className={`size-4 shrink-0 transition-transform ${
                      active ? "text-white translate-x-0.5" : "text-[#cbd5e1] group-hover:text-[#64748b]"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick Doctor Sign Out in Navigation Rail */}
          <div className="pt-3 border-t border-[#e2e8f0] mt-2 px-1">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-xs group"
            >
              <LogOut className="size-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Sign Out of Session</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT CONTENT PANEL (8 Cols)                                             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* ===================================================================== */}
          {/* 1. PROFILE SECTION                                                    */}
          {/* ===================================================================== */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-[#e2e8f0] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
                <div>
                  <h3 className="font-headline text-lg font-bold text-[#0b1c30]">
                    Physician Profile &amp; Clinic Credentials
                  </h3>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Manage your medical board license, institutional affiliation, and clinical contact information.
                  </p>
                </div>

                {!isEditingProfile ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLogoutModalOpen(true)}
                      className="btn-secondary text-rose-600 hover:bg-rose-50 border-rose-200 py-2 px-3 text-xs font-bold flex items-center gap-1.5"
                    >
                      <LogOut className="size-3.5" />
                      <span>Sign Out</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="btn-primary py-2 px-4 text-xs font-bold"
                    >
                      <Edit3 className="size-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="btn-secondary py-2 px-3 text-xs"
                    >
                      <X className="size-3.5" />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="btn-primary py-2 px-4 text-xs"
                    >
                      <Save className="size-3.5" />
                      <span>{isSavingProfile ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Avatar Card */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0]">
                <div className="relative">
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0b1c30] to-[#0ea5e9] text-white text-2xl font-bold shadow-md">
                    {fullName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  {isEditingProfile && (
                    <button
                      type="button"
                      onClick={() => info("Photo Upload", "Avatar file upload simulated.")}
                      className="absolute -bottom-2 -right-2 flex size-7 items-center justify-center rounded-full bg-[#0ea5e9] text-white shadow-md hover:bg-[#0284c7] transition-colors"
                      title="Upload Avatar"
                    >
                      <Upload className="size-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <h4 className="font-headline font-bold text-base text-[#0b1c30]">{fullName}</h4>
                  <p className="text-xs text-[#0ea5e9] font-mono font-semibold">{medicalLicenseId}</p>
                  <p className="text-xs text-[#64748b]">{specialization}</p>
                </div>
              </div>

              {/* Profile Form Details */}
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#0b1c30]">Full Legal Name</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] disabled:bg-slate-50 px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[#0b1c30]">Medical License ID</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={medicalLicenseId}
                      onChange={(e) => setMedicalLicenseId(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] disabled:bg-slate-50 px-3 text-[#0b1c30] font-mono focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[#0b1c30]">Doctor Email Address</label>
                    <input
                      type="email"
                      disabled={!isEditingProfile}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] disabled:bg-slate-50 px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[#0b1c30]">Direct Phone Line</label>
                    <input
                      type="tel"
                      disabled={!isEditingProfile}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] disabled:bg-slate-50 px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-bold text-[#0b1c30]">Medical Specialization</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] disabled:bg-slate-50 px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[#0b1c30]">Hospital / Medical Center</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] disabled:bg-slate-50 px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[#0b1c30]">Clinical Suite / Location</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] disabled:bg-slate-50 px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="flex justify-end gap-2 pt-4 border-t border-[#e2e8f0]">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="btn-secondary py-2 px-4"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="btn-primary py-2 px-6"
                    >
                      <Save className="size-4" />
                      <span>{isSavingProfile ? "Saving..." : "Save Profile"}</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 2. ACCOUNT & SECURITY                                                 */}
          {/* ===================================================================== */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-[#e2e8f0] space-y-6">
                <div className="border-b border-[#e2e8f0] pb-4">
                  <h3 className="font-headline text-lg font-bold text-[#0b1c30]">
                    Security Dashboard &amp; Authentication
                  </h3>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Manage two-factor authentication, active clinical terminals, and cryptographic session parameters.
                  </p>
                </div>

                {/* Status Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-emerald-900">2FA Status</p>
                      <p className="text-[0.68rem] text-emerald-700">Hardware &amp; App Token</p>
                    </div>
                    <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 font-bold text-[0.65rem]">
                      Enabled
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-blue-900">Session Security</p>
                      <p className="text-[0.68rem] text-blue-700">TLS 1.3 + AES-256</p>
                    </div>
                    <span className="rounded-full bg-blue-600 text-white px-2.5 py-0.5 font-bold text-[0.65rem]">
                      Secure
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-purple-900">Active Terminals</p>
                      <p className="text-[0.68rem] text-purple-700">3 Devices Synced</p>
                    </div>
                    <span className="rounded-full bg-purple-600 text-white px-2.5 py-0.5 font-bold text-[0.65rem]">
                      Active
                    </span>
                  </div>
                </div>

                {/* Password & 2FA Controls */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] text-xs">
                    <div>
                      <p className="font-bold text-[#0b1c30]">Physician Password</p>
                      <p className="text-[#64748b] text-[0.68rem]">Last changed 24 days ago.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="btn-secondary py-2 px-4 text-xs font-semibold"
                    >
                      <Key className="size-3.5" />
                      <span>Change Password</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] text-xs">
                    <div>
                      <p className="font-bold text-[#0b1c30]">Two-Factor Authentication (2FA)</p>
                      <p className="text-[#64748b] text-[0.68rem]">Require time-based authenticator code on new terminal logins.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={twoFactorEnabled}
                        onChange={(e) => {
                          setTwoFactorEnabled(e.target.checked);
                          success("2FA Setting Saved", `Two-factor authentication ${e.target.checked ? "enabled" : "disabled"}.`);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0ea5e9]"></div>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] text-xs">
                    <div>
                      <p className="font-bold text-[#0b1c30]">Inactivity Session Timeout</p>
                      <p className="text-[#64748b] text-[0.68rem]">Automatically lock terminal after period of clinical inactivity.</p>
                    </div>
                    <select
                      value={sessionTimeout}
                      onChange={(e) => {
                        setSessionTimeout(e.target.value);
                        success("Timeout Saved", `Session timeout set to ${e.target.value}.`);
                      }}
                      className="h-9 rounded-xl border border-[#e2e8f0] bg-white px-3 text-xs text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none font-medium"
                    >
                      <option value="15m">15 Minutes (High Security)</option>
                      <option value="30m">30 Minutes (Recommended)</option>
                      <option value="1h">1 Hour</option>
                      <option value="4h">4 Hours (Clinical Shift)</option>
                    </select>
                  </div>
                </div>

                {/* Active Sessions List */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                    Active Clinical Terminals &amp; Sessions
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                          <Monitor className="size-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[#0b1c30]">Hospital Workstation 4 (Current Device)</p>
                          <p className="text-[0.68rem] text-[#64748b]">Boston, MA • IP 192.168.10.42 • Chrome / Windows</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[0.65rem] font-bold">
                        Online
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                          <Smartphone className="size-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[#0b1c30]">iPad Pro 12.9 (Neurology Rounds)</p>
                          <p className="text-[0.68rem] text-[#64748b]">Hospital Wi-Fi • Active 14m ago</p>
                        </div>
                      </div>
                      <span className="text-[0.68rem] text-[#64748b] font-mono">Synced</span>
                    </div>
                  </div>
                </div>

                {/* Dangerous Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#e2e8f0]">
                  <button
                    type="button"
                    onClick={() => setIsLogoutAllModalOpen(true)}
                    className="btn-secondary text-rose-600 hover:bg-rose-50 border-rose-200 text-xs py-2 px-4"
                  >
                    <LogOut className="size-3.5" />
                    <span>Logout From All Devices</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDeactivateModalOpen(true)}
                    className="text-xs text-[#94a3b8] hover:text-rose-600 underline transition-colors"
                  >
                    Account Deactivation Request
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 3. NOTIFICATIONS PREFERENCES                                         */}
          {/* ===================================================================== */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-[#e2e8f0] space-y-6 text-xs">
              <div className="border-b border-[#e2e8f0] pb-4">
                <h3 className="font-headline text-lg font-bold text-[#0b1c30]">
                  Notification Preferences &amp; Alert Routing
                </h3>
                <p className="text-[#64748b] text-xs mt-0.5">
                  Configure which diagnostic events trigger in-app banners, push alerts, or physician email dispatches.
                </p>
              </div>

              {/* Delivery Channel Selector */}
              <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-2">
                <label className="font-bold text-[#0b1c30] block">Default Notification Delivery Channel:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["both", "in-app", "email", "off"] as const).map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => setNotificationChannel(channel)}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                        notificationChannel === channel
                          ? "bg-[#0ea5e9] text-white font-bold shadow-sm"
                          : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#e2e8f0]"
                      }`}
                    >
                      {channel === "both" ? "Both (In-App & Email)" : channel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Event Toggles */}
              <div className="space-y-3">
                <h4 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                  Diagnostic &amp; Clinical Event Triggers
                </h4>

                {[
                  {
                    title: "Analysis Completed",
                    desc: "Notify when an Alzheimer's 3D MRI scan or Parkinson's vocal analysis completes.",
                    state: notifAnalysisComplete,
                    setter: setNotifAnalysisComplete,
                  },
                  {
                    title: "Analysis Failed or Low Signal",
                    desc: "Alert immediately if scan motion artifact or degraded audio phonation is detected.",
                    state: notifAnalysisFailed,
                    setter: setNotifAnalysisFailed,
                  },
                  {
                    title: "Official Diagnostic Report Generated",
                    desc: "Trigger notice when a printable PDF clinical report is finalized.",
                    state: notifReportGenerated,
                    setter: setNotifReportGenerated,
                  },
                  {
                    title: "New Patient Enrolled",
                    desc: "Notify when a new patient record is added to the clinical registry.",
                    state: notifNewPatient,
                    setter: setNotifNewPatient,
                  },
                  {
                    title: "System & AI Model Updates",
                    desc: "Updates regarding deep learning checkpoints, Grad-CAM updates, and PennyLane quantum engine.",
                    state: notifSystemUpdates,
                    setter: setNotifSystemUpdates,
                  },
                  {
                    title: "Security & Terminal Alerts",
                    desc: "Alerts on new device logins, password modifications, and session expirations.",
                    state: notifSecurityAlerts,
                    setter: setNotifSecurityAlerts,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]"
                  >
                    <div>
                      <p className="font-bold text-[#0b1c30]">{item.title}</p>
                      <p className="text-[0.68rem] text-[#64748b]">{item.desc}</p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={item.state}
                        onChange={(e) => item.setter(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0ea5e9]"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  className="btn-primary py-2.5 px-6"
                >
                  <Save className="size-4" />
                  <span>Save Notification Preferences</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 4. ANALYSIS PREFERENCES                                              */}
          {/* ===================================================================== */}
          {activeTab === "analysis" && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-[#e2e8f0] space-y-6 text-xs">
              <div className="border-b border-[#e2e8f0] pb-4">
                <h3 className="font-headline text-lg font-bold text-[#0b1c30]">
                  AI Analysis Calibration &amp; Workflow Preferences
                </h3>
                <p className="text-[#64748b] text-xs mt-0.5">
                  Tune model inference parameters, explainability defaults, and automated pipeline workflows.
                </p>
              </div>

              {/* Default Disease Module */}
              <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-2">
                <label className="font-bold text-[#0b1c30] block">Default Diagnostic Disease Module:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDefaultDisease("alzheimer")}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      defaultDisease === "alzheimer"
                        ? "bg-purple-50 border-purple-300 shadow-sm"
                        : "bg-white border-[#e2e8f0] hover:bg-[#f1f5f9]"
                    }`}
                  >
                    <Brain className="size-5 text-purple-600" />
                    <div>
                      <p className="font-bold text-[#0b1c30]">Alzheimer&rsquo;s Disease (Brain MRI)</p>
                      <p className="text-[0.65rem] text-[#64748b]">3D CNN + Vision Transformer</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDefaultDisease("parkinson")}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      defaultDisease === "parkinson"
                        ? "bg-cyan-50 border-cyan-300 shadow-sm"
                        : "bg-white border-[#e2e8f0] hover:bg-[#f1f5f9]"
                    }`}
                  >
                    <Activity className="size-5 text-cyan-600" />
                    <div>
                      <p className="font-bold text-[#0b1c30]">Parkinson&rsquo;s Disease (Vocal / Quantum-AI)</p>
                      <p className="text-[0.65rem] text-[#64748b]">Acoustic Phonation + VQC</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* AI Presentation Toggles */}
              <div className="space-y-3">
                <h4 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                  Result Visualization &amp; Presentation Defaults
                </h4>

                {[
                  {
                    title: "Show Diagnostic Confidence Score Gauge",
                    desc: "Display quantitative percentage confidence bars in prediction summaries.",
                    state: showConfidenceScore,
                    setter: setShowConfidenceScore,
                  },
                  {
                    title: "Show Multi-Class Posterior Probabilities",
                    desc: "Display probability distributions across Cognitive Normal, MCI, and Dementia/PD stages.",
                    state: showClassProbabilities,
                    setter: setShowClassProbabilities,
                  },
                  {
                    title: "Show 7-Stage Neural Pipeline Execution",
                    desc: "Display live step indicators during MRI voxel ingestion and audio DSP processing.",
                    state: showPipelineStages,
                    setter: setShowPipelineStages,
                  },
                  {
                    title: "Automatically Open Visual Explainability",
                    desc: "Open Grad-CAM and SHAP attribution charts upon inference completion.",
                    state: autoOpenExplainability,
                    setter: setAutoOpenExplainability,
                  },
                  {
                    title: "Automatically Archive Results to Patient History",
                    desc: "Persist completed scan dossiers into longitudinal patient records.",
                    state: autoSaveResults,
                    setter: setAutoSaveResults,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]"
                  >
                    <div>
                      <p className="font-bold text-[#0b1c30]">{item.title}</p>
                      <p className="text-[0.68rem] text-[#64748b]">{item.desc}</p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={item.state}
                        onChange={(e) => item.setter(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0ea5e9]"></div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Technical Model Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-1">
                  <label className="font-bold text-[#0b1c30]">Grad-CAM Heatmap Resolution</label>
                  <select
                    value={gradCamResolution}
                    onChange={(e) => setGradCamResolution(e.target.value as any)}
                    className="w-full h-9 rounded-xl border border-[#e2e8f0] bg-white px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none mt-1"
                  >
                    <option value="high">High-Definition Interpolation (512x512)</option>
                    <option value="standard">Standard Anatomical Voxel Grid (256x256)</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-1">
                  <label className="font-bold text-[#0b1c30]">Quantum-Inspired Decision Engine</label>
                  <select
                    value={quantumOptimizationMode}
                    onChange={(e) => setQuantumOptimizationMode(e.target.value as any)}
                    className="w-full h-9 rounded-xl border border-[#e2e8f0] bg-white px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none mt-1"
                  >
                    <option value="variational">4-Qubit Strongly Entangling Variational Ansatz</option>
                    <option value="standard">Angle-Encoded Rotational Decision Boundary</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={handleSaveAnalysis}
                  className="btn-primary py-2.5 px-6"
                >
                  <Save className="size-4" />
                  <span>Save Analysis Preferences</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 5. REPORT PREFERENCES                                                */}
          {/* ===================================================================== */}
          {activeTab === "reports" && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-[#e2e8f0] space-y-6 text-xs">
              <div className="border-b border-[#e2e8f0] pb-4">
                <h3 className="font-headline text-lg font-bold text-[#0b1c30]">
                  Clinical Diagnostic Report Customization
                </h3>
                <p className="text-[#64748b] text-xs mt-0.5">
                  Configure institutional headers, digital signatures, and explainability annexes on generated PDF reports.
                </p>
              </div>

              {/* Report Inclusions Checklist */}
              <div className="space-y-3">
                <h4 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                  Report Section Inclusions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Hospital / Academic Center Header Logo", state: reportShowHospitalLogo, setter: setReportShowHospitalLogo },
                    { label: "Doctor Legal Name & State License ID", state: reportShowDoctorCredentials, setter: setReportShowDoctorCredentials },
                    { label: "Cryptographic Electronic Doctor Signature", state: reportShowDigitalSignature, setter: setReportShowDigitalSignature },
                    { label: "Patient Demographics & MMSE/UPDRS Baseline", state: reportShowPatientDemographics, setter: setReportShowPatientDemographics },
                    { label: "Grad-CAM Multi-Plane Brain Slice Visuals", state: reportShowGradCam, setter: setReportShowGradCam },
                    { label: "SHAP Volumetric Biomarker Attribution Rankings", state: reportShowSHAP, setter: setReportShowSHAP },
                    { label: "Quantum-Inspired 4-Qubit Decision Metrics", state: reportShowQuantum, setter: setReportShowQuantum },
                    { label: "Mandatory Decision Support Disclaimer", state: true, setter: () => {}, disabled: true },
                  ].map((item, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer ${
                        item.state ? "bg-[#f0f9ff] border-[#0ea5e9]" : "bg-[#f8f9ff] border-[#e2e8f0]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={item.disabled}
                        checked={item.state}
                        onChange={(e) => item.setter(e.target.checked)}
                        className="size-4 rounded border-[#cbd5e1] text-[#0ea5e9] focus:ring-[#0ea5e9]"
                      />
                      <span className="font-bold text-[#0b1c30] leading-snug">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Default Output Format */}
              <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0b1c30]">Default Report Output Format</p>
                  <p className="text-[0.68rem] text-[#64748b]">Clinical print &amp; DICOM/EMR export specification.</p>
                </div>

                <span className="rounded-xl bg-white border border-[#e2e8f0] px-3.5 py-1.5 font-bold font-mono text-[#0ea5e9]">
                  PDF / A-1b Compliant
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => info("Report Sample", "Previewing sample clinical report...")}
                  className="btn-secondary py-2.5 px-4"
                >
                  <FileText className="size-4" />
                  <span>Preview Sample Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveReports}
                  className="btn-primary py-2.5 px-6"
                >
                  <Save className="size-4" />
                  <span>Save Report Preferences</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 6. APPEARANCE                                                        */}
          {/* ===================================================================== */}
          {activeTab === "appearance" && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-[#e2e8f0] space-y-6 text-xs">
              <div className="border-b border-[#e2e8f0] pb-4">
                <h3 className="font-headline text-lg font-bold text-[#0b1c30]">
                  Appearance &amp; Accessibility Preferences
                </h3>
                <p className="text-[#64748b] text-xs mt-0.5">
                  Customize the interface theme, layout density, and clinical language locale.
                </p>
              </div>

              {/* Visual Theme Cards */}
              <div className="space-y-3">
                <label className="font-bold text-[#0b1c30] block">Visual Color Theme Mode:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Light Mode Card */}
                  <button
                    type="button"
                    onClick={() => setThemeMode("light")}
                    className={`p-4 rounded-2xl border text-left space-y-3 transition-all ${
                      themeMode === "light"
                        ? "border-[#0ea5e9] bg-[#f0f9ff] ring-2 ring-[#0ea5e9]"
                        : "border-[#e2e8f0] bg-white hover:bg-[#f8f9ff]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Sun className="size-5 text-[#0ea5e9]" />
                      {themeMode === "light" && <CheckCircle2 className="size-4 text-[#0ea5e9]" />}
                    </div>
                    <div>
                      <p className="font-bold text-[#0b1c30]">Clinical Light (Active)</p>
                      <p className="text-[0.65rem] text-[#64748b] mt-0.5">High-contrast diagnostic view</p>
                    </div>
                  </button>

                  {/* Dark Mode Card */}
                  <button
                    type="button"
                    onClick={() => setThemeMode("dark")}
                    className={`p-4 rounded-2xl border text-left space-y-3 transition-all ${
                      themeMode === "dark"
                        ? "border-[#0ea5e9] bg-[#0b1c30] text-white ring-2 ring-[#0ea5e9]"
                        : "border-[#e2e8f0] bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Moon className="size-5 text-[#39b8fd]" />
                      {themeMode === "dark" && <CheckCircle2 className="size-4 text-[#39b8fd]" />}
                    </div>
                    <div>
                      <p className="font-bold">Dark Radiology Mode</p>
                      <p className="text-[0.65rem] text-slate-300 mt-0.5">Low-light imaging contrast</p>
                    </div>
                  </button>

                  {/* System Default */}
                  <button
                    type="button"
                    onClick={() => setThemeMode("system")}
                    className={`p-4 rounded-2xl border text-left space-y-3 transition-all ${
                      themeMode === "system"
                        ? "border-[#0ea5e9] bg-[#f0f9ff] ring-2 ring-[#0ea5e9]"
                        : "border-[#e2e8f0] bg-white hover:bg-[#f8f9ff]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Monitor className="size-5 text-slate-600" />
                      {themeMode === "system" && <CheckCircle2 className="size-4 text-[#0ea5e9]" />}
                    </div>
                    <div>
                      <p className="font-bold text-[#0b1c30]">System Default</p>
                      <p className="text-[0.65rem] text-[#64748b] mt-0.5">Matches OS settings</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Layout Density & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-1">
                  <label className="font-bold text-[#0b1c30]">UI Table &amp; Card Density</label>
                  <select
                    value={layoutDensity}
                    onChange={(e) => setLayoutDensity(e.target.value as any)}
                    className="w-full h-9 rounded-xl border border-[#e2e8f0] bg-white px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none mt-1"
                  >
                    <option value="comfortable">Comfortable (Standard Touch/Click Spacing)</option>
                    <option value="compact">Compact (Dense Tabular Data View)</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-1">
                  <label className="font-bold text-[#0b1c30]">Clinical Language Locale</label>
                  <select
                    value={appLanguage}
                    onChange={(e) => setAppLanguage(e.target.value)}
                    className="w-full h-9 rounded-xl border border-[#e2e8f0] bg-white px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none mt-1"
                  >
                    <option value="en-US">English (United States - Medical EN)</option>
                    <option value="es-ES">Español (España / LATAM)</option>
                    <option value="de-DE">Deutsch (Klinische Medizin)</option>
                    <option value="fr-FR">Français (Médical)</option>
                    <option value="ja-JP">日本語 (医療診断)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={handleSaveAppearance}
                  className="btn-primary py-2.5 px-6"
                >
                  <Save className="size-4" />
                  <span>Save Appearance Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 7. PRIVACY & DATA MANAGEMENT                                         */}
          {/* ===================================================================== */}
          {activeTab === "privacy" && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-[#e2e8f0] space-y-6 text-xs">
              <div className="border-b border-[#e2e8f0] pb-4">
                <h3 className="font-headline text-lg font-bold text-[#0b1c30]">
                  Privacy, Data Governance &amp; Export
                </h3>
                <p className="text-[#64748b] text-xs mt-0.5">
                  Control patient scan retention periods, manage DICOM/audio buffers, and download cryptographic audit archives.
                </p>
              </div>

              {/* Retention Policy */}
              <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#0b1c30]">Local Analysis Data Retention Period:</label>
                  <span className="font-mono font-bold text-[#0ea5e9]">{dataRetentionDays} Days</span>
                </div>
                <select
                  value={dataRetentionDays}
                  onChange={(e) => {
                    setDataRetentionDays(e.target.value);
                    success("Retention Saved", `Patient scan retention updated to ${e.target.value} days.`);
                  }}
                  className="w-full h-9 rounded-xl border border-[#e2e8f0] bg-white px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none font-medium"
                >
                  <option value="30">30 Days (Clinical Fast Purge)</option>
                  <option value="90">90 Days (Standard Audit Cycle)</option>
                  <option value="365">1 Year (Longitudinal Study)</option>
                  <option value="indefinite">Indefinite (Physician Managed)</option>
                </select>
                <p className="text-[0.68rem] text-[#64748b]">
                  Scans older than this window will be scrubbed from browser local caches.
                </p>
              </div>

              {/* Data Operations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-3">
                  <div>
                    <p className="font-bold text-[#0b1c30]">Export Clinical Registry</p>
                    <p className="text-[0.68rem] text-[#64748b] mt-0.5">
                      Download all enrolled patients, scan records, and AI feature attribution vectors as JSON.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="btn-primary w-full py-2 text-xs"
                  >
                    <Download className="size-3.5" />
                    <span>Download JSON Archive</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#f8f9ff] border border-rose-200 space-y-3">
                  <div>
                    <p className="font-bold text-rose-700">Delete Analysis Data</p>
                    <p className="text-[0.68rem] text-[#64748b] mt-0.5">
                      Purge cached 3D MRI voxel slices and audio phonation files from local storage.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDeleteDataModalOpen(true)}
                    className="btn-secondary w-full py-2 text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Purge Local Data Cache</span>
                  </button>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] text-[#64748b] text-[0.7rem] space-y-1">
                <p className="font-bold text-[#0b1c30]">Patient Privacy Governance:</p>
                <p className="leading-relaxed">
                  NeuroFusionAI operates with end-to-end client-side privacy. Patient de-identification transforms all MRI DICOM tags and audio recordings before AI feature extraction.
                </p>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 8. HELP & SUPPORT                                                    */}
          {/* ===================================================================== */}
          {activeTab === "support" && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-[#e2e8f0] space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e8f0] pb-4">
                <div>
                  <h3 className="font-headline text-lg font-bold text-[#0b1c30]">
                    Clinical Decision Support &amp; Knowledge Base
                  </h3>
                  <p className="text-[#64748b] text-xs mt-0.5">
                    User guides, AI architecture explainers, and direct technical support.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(true)}
                  className="btn-primary py-2 px-4 text-xs"
                >
                  <Mail className="size-3.5" />
                  <span>Contact Medical Support</span>
                </button>
              </div>

              {/* Expandable FAQs */}
              <div className="space-y-3">
                <h4 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                  Frequently Asked Clinical &amp; AI Questions
                </h4>

                <div className="space-y-2">
                  {faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;

                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full p-4 flex items-center justify-between text-left font-bold text-[#0b1c30] hover:text-[#0ea5e9] transition-colors"
                        >
                          <span>{faq.q}</span>
                          {isOpen ? (
                            <ChevronDown className="size-4 text-[#0ea5e9] shrink-0" />
                          ) : (
                            <ChevronRight className="size-4 text-[#64748b] shrink-0" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 text-[#475569] leading-relaxed border-t border-[#e2e8f0]/60 animate-in fade-in duration-150">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Support Channels Card */}
              <div className="p-4 rounded-xl bg-[#f0f9ff] border border-[#0ea5e9]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-[#0b1c30]">24/7 Clinical Support Hotline</p>
                  <p className="text-[0.68rem] text-[#64748b]">
                    Direct line for clinical informatics teams and hospital integration engineers.
                  </p>
                </div>
                <span className="font-mono font-bold text-[#0ea5e9] text-sm">
                  support@neurofusion.ai
                </span>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 9. ABOUT NEUROFUSIONAI                                               */}
          {/* ===================================================================== */}
          {activeTab === "about" && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-[#e2e8f0] space-y-6 text-xs">
              <div className="border-b border-[#e2e8f0] pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0b1c30] to-[#0ea5e9] text-white shadow-md">
                    <Brain className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-headline text-xl font-black text-[#0b1c30]">
                      NeuroFusion<span className="text-[#0ea5e9]">AI</span>
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      AI-Assisted Neurological Disease Analysis Platform
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[0.65rem] font-bold px-3 py-0.5">
                  Production Version 2.4.0 (Build 2026.08)
                </span>
              </div>

              {/* Dual Module Architecture Specification */}
              <div className="space-y-3">
                <h4 className="font-headline text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                  Deep Learning &amp; Quantum Architecture Specification
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Alzheimer's Card */}
                  <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 space-y-2">
                    <div className="flex items-center gap-2 text-purple-700 font-bold">
                      <Brain className="size-4" />
                      <span>Alzheimer&rsquo;s Diagnostic Module</span>
                    </div>
                    <ul className="space-y-1 text-[#475569] text-[0.68rem]">
                      <li>• <strong>Modality:</strong> 3D Brain MRI (T1-Weighted / T2-FLAIR)</li>
                      <li>• <strong>Architecture:</strong> 3D CNN + Vision Transformer (ViT)</li>
                      <li>• <strong>Feature Fusion:</strong> Volumetric ROI Quantification</li>
                      <li>• <strong>Explainability:</strong> Grad-CAM 3D Heatmaps + SHAP</li>
                    </ul>
                  </div>

                  {/* Parkinson's Card */}
                  <div className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/60 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-700 font-bold">
                      <Activity className="size-4" />
                      <span>Parkinson&rsquo;s Diagnostic Module</span>
                    </div>
                    <ul className="space-y-1 text-[#475569] text-[0.68rem]">
                      <li>• <strong>Modality:</strong> Sustained Phonation Audio Signal</li>
                      <li>• <strong>Acoustic DSP:</strong> MDVP Jitter, Shimmer &amp; HNR</li>
                      <li>• <strong>Decision Layer:</strong> 4-Qubit Quantum-Inspired VQC</li>
                      <li>• <strong>Explainability:</strong> Phonatory Feature SHAP Rankings</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Legal, Licenses & Citations */}
              <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-2">
                <h5 className="font-bold text-[#0b1c30]">Clinical Research &amp; Benchmark Citations:</h5>
                <p className="text-[0.68rem] text-[#64748b] leading-relaxed">
                  1. ADNI (Alzheimer&rsquo;s Disease Neuroimaging Initiative) 3D MRI benchmark cohorts. <br />
                  2. Oxford Parkinson&rsquo;s Disease Vocal Phonation Dataset (Max Little et al.). <br />
                  3. PennyLane Quantum Machine Learning Framework for Parameterized Quantum Circuits.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e2e8f0] text-[0.68rem] text-[#64748b]">
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => info("Terms of Use", "Standard SaMD terms apply.")} className="hover:text-[#0b1c30] underline">
                    Terms of Use
                  </button>
                  <button type="button" onClick={() => info("Privacy Policy", "Clinical confidentiality policy active.")} className="hover:text-[#0b1c30] underline">
                    Privacy Policy
                  </button>
                  <button type="button" onClick={() => info("Licenses", "MIT / Apache 2.0 open source components.")} className="hover:text-[#0b1c30] underline">
                    Open-Source Licenses
                  </button>
                </div>
                <span>© 2026 NeuroFusionAI Informatics Inc.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS & CONFIRMATION DIALOGS                                             */}
      {/* ========================================================================= */}

      {/* 1. Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Physician Password"
      >
        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-[#0b1c30]">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#0b1c30]">New Password (min. 8 chars)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#0b1c30]">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#e2e8f0]">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="btn-secondary py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary py-2 px-6"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Logout All Devices Modal */}
      <Modal
        isOpen={isLogoutAllModalOpen}
        onClose={() => setIsLogoutAllModalOpen(false)}
        title="Logout From All Terminals"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3">
            <AlertTriangle className="size-5 shrink-0 text-amber-600 mt-0.5" />
            <p className="leading-relaxed">
              Are you sure you want to invalidate all active sessions? You will need to log back in on all clinic workstations and tablet devices.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsLogoutAllModalOpen(false)}
              className="btn-secondary py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogoutAllModalOpen(false);
                success("Sessions Invalidated", "All remote physician sessions terminated.");
              }}
              className="btn-primary bg-rose-600 hover:bg-rose-700 py-2 px-5"
            >
              Logout Everywhere
            </button>
          </div>
        </div>
      </Modal>

      {/* 3. Delete Data Modal */}
      <Modal
        isOpen={isDeleteDataModalOpen}
        onClose={() => setIsDeleteDataModalOpen(false)}
        title="Purge Local Analysis Data"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertTriangle className="size-5 shrink-0 text-rose-600 mt-0.5" />
            <p className="leading-relaxed">
              Warning: This will remove all locally cached 3D MRI scans and vocal audio recordings from this browser. This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteDataModalOpen(false)}
              className="btn-secondary py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDeleteDataModalOpen(false);
                success("Cache Purged", "Local diagnostic scan cache successfully deleted.");
              }}
              className="btn-primary bg-rose-600 hover:bg-rose-700 py-2 px-5"
            >
              Confirm Purge
            </button>
          </div>
        </div>
      </Modal>

      {/* 4. Contact Medical Support Modal */}
      <Modal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        title="Contact Medical &amp; Technical Support"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsSupportModalOpen(false);
            setSupportMessage("");
            success("Ticket Submitted", "Our clinical engineering team will respond to dr.jenkins@neurofusion.ai within 2 hours.");
          }}
          className="space-y-4 text-xs"
        >
          <div className="space-y-1">
            <label className="font-bold text-[#0b1c30]">Subject / Problem Category</label>
            <select className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] px-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none">
              <option>Clinical AI Model Question</option>
              <option>DICOM / MRI Upload Issue</option>
              <option>Voice Recording &amp; Acoustic DSP</option>
              <option>EMR / PACS Integration Assistance</option>
              <option>Other Technical Request</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#0b1c30]">Description of Problem</label>
            <textarea
              required
              rows={4}
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              placeholder="Describe what happened or the specific patient case context..."
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] p-3 text-[#0b1c30] focus:border-[#0ea5e9] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsSupportModalOpen(false)}
              className="btn-secondary py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary py-2 px-6"
            >
              Submit Support Ticket
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. Deactivation Modal */}
      <Modal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        title="Physician Account Deactivation"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#475569] leading-relaxed">
            To deactivate a licensed medical practitioner account, your hospital IT administrator must sign off on patient record handover in accordance with medical governance guidelines.
          </p>
          <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] text-[#64748b]">
            Contact Institutional Admin: <strong>admin-it@hospital.org</strong>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsDeactivateModalOpen(false)}
              className="btn-primary py-2 px-5"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* 6. Confirm Doctor Sign Out Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Sign Out Doctor Session"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-[#e2e8f0] space-y-2">
            <p className="font-bold text-[#0b1c30] text-sm">
              End session for {fullName}?
            </p>
            <p className="text-[#64748b] leading-relaxed">
              You will be safely signed out of the NeuroFusionAI clinical diagnostic portal on this terminal. Unsaved scan drafts will be securely saved.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(false)}
              className="btn-secondary py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogoutModalOpen(false);
                logout();
              }}
              className="btn-primary bg-rose-600 hover:bg-rose-700 py-2 px-5 font-bold"
            >
              <LogOut className="size-3.5" />
              <span>Confirm Sign Out</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
