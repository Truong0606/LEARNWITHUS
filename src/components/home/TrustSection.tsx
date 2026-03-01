import { BookOpen, GraduationCap, Users } from "lucide-react";

const indicators = [
  { value: "25K+", label: "Sinh viên", icon: Users, color: "violet" },
  { value: "1.2K+", label: "Nhóm học", icon: BookOpen, color: "pink" },
  { value: "350+", label: "Mentor", icon: GraduationCap, color: "amber" },
];

export default function TrustSection() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 border border-white rounded-full" />
        <div className="absolute bottom-10 right-10 w-60 h-60 border border-white rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white rounded-full" />
      </div>

      <div className="relative px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">
            Cộng đồng tin tưởng StudyHub
          </h2>
          <p className="text-white/80">
            Con số ấn tượng từ cộng đồng học tập của chúng tôi
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {indicators.map((indicator, index) => {
            const Icon = indicator.icon;
            return (
              <div
                key={index}
                className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-white/20">
                  <Icon size={32} className="text-white" />
                </div>
                <span className="block mb-2 text-5xl font-black md:text-6xl">
                  {indicator.value}
                </span>
                <p className="text-lg text-white/80">{indicator.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
