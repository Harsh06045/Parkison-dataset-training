import { Stethoscope, User, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccountType = "doctor" | "patient" | "admin";

const OPTIONS: { id: AccountType; label: string; Icon: typeof Stethoscope }[] = [
  { id: "doctor", label: "Doctor", Icon: Stethoscope },
  { id: "patient", label: "Patient", Icon: User },
  { id: "admin", label: "Admin", Icon: ShieldCheck },
];

export function AccountTypeSelector({
  value,
  onChange,
}: {
  value: AccountType;
  onChange: (value: AccountType) => void;
}) {
  return (
    <div className="space-y-1 w-full">
      <label className="text-[0.7rem] font-semibold text-slate-300 tracking-wide">
        Login as
      </label>
      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-950/70 p-1 border border-slate-800 backdrop-blur-md">
        {OPTIONS.map(({ id, label, Icon }) => {
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(id)}
              className={cn(
                "group flex flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 px-1.5 text-[0.68rem] font-semibold transition-all duration-300 min-h-[40px] cursor-pointer",
                selected
                  ? "border border-blue-500 bg-blue-600/30 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.35)] scale-[1.03]"
                  : "border border-transparent bg-transparent text-slate-400 hover:text-blue-300 hover:bg-blue-950/40 hover:border-blue-500/30 hover:scale-[1.05] hover:shadow-[0_0_10px_rgba(59,130,246,0.15)]"
              )}
            >
              <Icon className="size-3.5 text-current transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
