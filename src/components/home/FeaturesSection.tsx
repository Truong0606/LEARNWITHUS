import {
  BookOpenCheck,
  GraduationCap,
  MessageSquare,
  Timer,
  UserCircle,
  Users,
} from "lucide-react";
import type { Feature } from "@/types/home.types";

const features: Feature[] = [
  {
    icon: UserCircle,
    title: "Hồ sơ học tập cá nhân",
    description:
      "Lưu môn học, sở thích, mục tiêu và tiến độ để theo dõi rõ ràng.",
    color: "violet",
  },
  {
    icon: BookOpenCheck,
    title: "Nhóm học theo môn",
    description:
      "Tìm nhóm phù hợp lịch học và trình độ để học cùng hiệu quả.",
    color: "pink",
  },
  {
    icon: MessageSquare,
    title: "Diễn đàn thảo luận",
    description:
      "Đăng bài, hỏi đáp và chia sẻ tài liệu trong cộng đồng.",
    color: "emerald",
  },
  {
    icon: Timer,
    title: "Pomodoro tập trung",
    description:
      "Thiết lập phiên học 25/5 để duy trì năng suất mỗi ngày.",
    color: "amber",
  },
  {
    icon: Users,
    title: "Không gian học nhóm",
    description:
      "Tạo lịch học, phân công nhiệm vụ và nhắc lịch tự động.",
    color: "rose",
  },
  {
    icon: GraduationCap,
    title: "Đăng ký mentor",
    description:
      "Chọn mentor phù hợp để được định hướng và hỗ trợ 1-1.",
    color: "indigo",
  },
];

const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  violet: { bg: "bg-slate-50", icon: "text-slate-600", border: "border-slate-200" },
  pink: { bg: "bg-slate-100", icon: "text-slate-600", border: "border-slate-200" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-200" },
  rose: { bg: "bg-rose-50", icon: "text-rose-600", border: "border-rose-200" },
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", border: "border-indigo-200" },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 bg-white md:py-20">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl">
            Tất cả những gì bạn cần để{" "}
            <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              học tập hiệu quả
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600">
            Công cụ toàn diện giúp bạn quản lý việc học, kết nối bạn bè và đạt mục tiêu
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const colors = colorMap[feature.color || "violet"];
            return (
              <div
                key={index}
                className={`p-6 text-center transition-all rounded-2xl border ${colors.border} ${colors.bg} hover:shadow-lg hover:-translate-y-1`}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 mb-4 rounded-xl ${colors.bg} border ${colors.border}`}>
                  <feature.icon size={28} className={colors.icon} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
