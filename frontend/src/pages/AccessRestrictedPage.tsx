import React from "react";
import { Lock, ShieldAlert, ArrowLeft, Home, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/services/authApi";

interface AccessRestrictedPageProps {
  requiredRole?: Role | "doctor" | "patient" | "admin";
  onNavigate: (path: string) => void;
}

export function AccessRestrictedPage({
  requiredRole,
  onNavigate,
}: AccessRestrictedPageProps) {
  const { user, logout } = useAuth();

  const userRole = user?.role || "doctor";

  const getAuthorizedPath = () => {
    if (userRole === "patient") return "/patient/dashboard";
    if (userRole === "admin") return "/admin/dashboard";
    return "/doctor/dashboard";
  };

  const getRoleLabel = (role?: string) => {
    if (role === "patient") return "Patient Health Portal";
    if (role === "admin") return "Hospital IT & PACS Admin";
    return "Attending Physician / Doctor";
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-card-deep border border-[#e2e8f0] text-center space-y-6 animate-in zoom-in-95 duration-200">
        {/* Lock Icon */}
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 shadow-md">
          <ShieldAlert className="size-10" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 px-3 py-0.5 text-xs font-bold">
            <Lock className="size-3" />
            <span>Access Restricted (403)</span>
          </div>

          <h2 className="font-headline text-2xl font-extrabold text-[#0b1c30] tracking-tight">
            Unauthorized Portal Access
          </h2>

          <p className="text-xs text-[#64748b] leading-relaxed">
            You do not have permission to view this section of NeuroFusionAI. Your current credentials are restricted to your assigned role.
          </p>
        </div>

        {/* Role Comparison Box */}
        <div className="p-4 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] text-xs space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[#64748b] font-medium">Your Authenticated Role:</span>
            <span className="font-bold font-mono text-[#0ea5e9] bg-[#e0f2fe] px-2 py-0.5 rounded-md uppercase text-[0.7rem]">
              {userRole}
            </span>
          </div>

          {requiredRole && (
            <div className="flex items-center justify-between">
              <span className="text-[#64748b] font-medium">Required Portal Role:</span>
              <span className="font-bold font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md uppercase text-[0.7rem]">
                {requiredRole}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-[#e2e8f0] text-[0.68rem] text-[#64748b]">
            Authorized Destination: <strong>{getRoleLabel(userRole)}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate(getAuthorizedPath())}
            className="btn-primary flex-1 py-3 text-xs font-bold shadow-sm flex items-center justify-center gap-2"
          >
            <Home className="size-4" />
            <span>Return to My Portal</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="btn-secondary py-3 px-4 text-xs font-bold text-rose-600 hover:bg-rose-50 border-rose-200 flex items-center justify-center gap-2"
          >
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
