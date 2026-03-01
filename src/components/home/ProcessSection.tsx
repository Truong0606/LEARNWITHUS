import { BookOpenCheck, ClipboardList, Users, Wand2 } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Tạo hồ sơ học tập",
    description: "Nhập thông tin, mục tiêu và lịch học cá nhân.",
    color: "violet",
    step: "01",
  },
  {
    icon: BookOpenCheck,
    title: "Chọn môn & sở thích",
    description: "Gợi ý nhóm học phù hợp theo môn và trình độ.",
    color: "pink",
    step: "02",
  },
  {
    icon: Users,
    title: "Tham gia nhóm",
    description: "Kết nối bạn học, chia sẻ tài liệu và làm bài cùng nhau.",
    color: "emerald",
    step: "03",
  },
  {
    icon: Wand2,
    title: "Học tập tập trung",
    description: "Pomodoro, diễn đàn và mentor hỗ trợ xuyên suốt.",
    color: "amber",
    step: "04",
  },
];

const colorMap: Record<string, { gradient: string; text: string }> = {
  violet: { gradient: "from-slate-600 to-slate-800", text: "text-slate-600" },
  pink: { gradient: "from-slate-600 to-slate-800", text: "text-slate-600" },
  emerald: { gradient: "from-emerald-500 to-green-500", text: "text-emerald-600" },
  amber: { gradient: "from-amber-500 to-orange-500", text: "text-amber-600" },
};

export default function ProcessSection() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl">
            Hành trình học tập cùng{" "}
            <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              StudyHub
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600">
            4 bước đơn giản để bắt đầu học tập hiệu quả hơn
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {steps.map((step, index) => {
            const colors = colorMap[step.color];
            return (
              <div key={index} className="relative p-6 text-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className={`text-6xl font-black ${colors.text} opacity-10`}>
                    {step.step}
                  </span>
                </div>
                <div className={`flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${colors.gradient} shadow-lg`}>
                  <step.icon size={28} className="text-white" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-gray-800 md:text-lg">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
