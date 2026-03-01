import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Users } from "lucide-react";
import type { BlogPost } from "@/types/home.types";

const posts: BlogPost[] = [
  {
    title: "5 cách học nhóm hiệu quả cho sinh viên",
    description:
      "Từ phân công nhiệm vụ đến quy tắc thảo luận, tối ưu hiệu quả học tập của nhóm.",
    link: "/blogs",
    icon: Users,
    color: "violet",
  },
  {
    title: "Pomodoro giúp tập trung tốt hơn như thế nào?",
    description:
      "Tìm hiểu cách chia nhỏ thời gian học giúp giảm mệt mỏi và tăng năng suất.",
    link: "/blogs",
    icon: Clock,
    color: "pink",
  },
  {
    title: "Chọn mentor phù hợp với mục tiêu học tập",
    description:
      "Các tiêu chí chọn mentor để bạn có lộ trình học rõ ràng và bền vững.",
    link: "/blogs",
    icon: BookOpen,
    color: "emerald",
  },
];

const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  violet: { bg: "bg-slate-50", icon: "text-slate-600", border: "border-slate-200" },
  pink: { bg: "bg-slate-100", icon: "text-slate-600", border: "border-slate-200" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200" },
};

export default function BlogSection() {
  return (
    <section className="py-16 bg-white md:py-20">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl">
            Góc chia sẻ{" "}
            <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              kiến thức
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600">
            Bài viết hữu ích giúp bạn học tập hiệu quả hơn mỗi ngày
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {posts.map((post, index) => {
            const colors = colorMap[post.color || "violet"];
            const Icon = post.icon || BookOpen;
            return (
              <div
                key={index}
                className={`p-6 transition-all rounded-2xl border ${colors.border} ${colors.bg} hover:shadow-lg hover:-translate-y-1`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl ${colors.bg} border ${colors.border}`}>
                  <Icon size={24} className={colors.icon} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-800">
                  {post.title}
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  {post.description}
                </p>
                <Link
                  href={post.link}
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${colors.icon} hover:gap-2 transition-all`}
                >
                  Đọc thêm
                  <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
