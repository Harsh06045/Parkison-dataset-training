import { useState } from "react";
import { Mail, MapPin, Phone, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    institution: "",
    inquiryType: "Clinical Trial & Hospital Integration",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 py-12 sm:py-20 text-white select-none">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-block rounded-full bg-blue-500/15 border border-blue-500/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300 backdrop-blur-md">
          Get in Touch
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Partner with <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">NeuroFusion AI</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-300">
          Interested in deploying AI diagnostic tools at your medical institution or research center? Contact our clinical team.
        </p>
      </div>

      <div className="mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info Side */}
        <div className="lg:col-span-5 space-y-6 rounded-3xl border border-blue-500/25 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-lg">
          <h3 className="text-xl font-bold text-white">Clinical Support &amp; Partnerships</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Our medical AI specialists work directly with radiologists, neurologists, and healthcare administrators.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-400">
                <Mail className="size-5" />
              </div>
              <div>
                <p className="text-[0.7rem] text-slate-400 font-medium">Work Email</p>
                <p className="text-sm font-semibold text-white">clinical@neurofusion.ai</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400">
                <Phone className="size-5" />
              </div>
              <div>
                <p className="text-[0.7rem] text-slate-400 font-medium">Clinical Desk</p>
                <p className="text-sm font-semibold text-white">+1 (800) 492-NEURO</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-teal-950/60 border border-teal-500/30 text-teal-400">
                <MapPin className="size-5" />
              </div>
              <div>
                <p className="text-[0.7rem] text-slate-400 font-medium">Headquarters</p>
                <p className="text-sm font-semibold text-white">San Francisco AI Medical Center, CA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-lg">
          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="flex justify-center text-emerald-400">
                <CheckCircle2 className="size-14 animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold text-white">Inquiry Received!</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Thank you for reaching out. Our clinical partnership team will contact your institution within 24 hours.
              </p>
              <Button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 rounded-xl bg-blue-600 px-6 py-2 text-xs font-semibold text-white"
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Dr. Alexander Vance"
                    className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Work Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="a.vance@stanfordmed.org"
                    className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Hospital / Institution Name</label>
                <input
                  type="text"
                  required
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="Stanford Neurological Institute"
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Inquiry Type</label>
                <select
                  value={formData.inquiryType}
                  onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Clinical Trial & Hospital Integration">Clinical Trial &amp; PACS Integration</option>
                  <option value="Research Collaboration">Research Collaboration</option>
                  <option value="Enterprise License">Enterprise Hospital License</option>
                  <option value="General Question">General Inquiry</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Message / Inquiry Details</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your research requirements or clinical deployment timeline..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs sm:text-sm font-semibold text-white shadow-lg gap-2"
              >
                <span>Submit Clinical Inquiry</span>
                <Send className="size-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
