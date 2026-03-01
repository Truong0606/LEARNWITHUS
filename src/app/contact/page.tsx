import { Footer, Header } from "@/components/shared";
import { CheckCircle, GraduationCap } from "lucide-react";
import MentorForm from "./MentorForm";

export const metadata = {
  title: "Mentor | StudyHub",
  description: "Đăng ký mentor để được hỗ trợ học tập 1-1.",
};

const benefits = [
  "Định hướng học tập rõ ràng theo mục tiêu cá nhân",
  "Nhận phản hồi chi tiết cho bài tập và dự án",
  "Kết nối với cộng đồng học tập cùng ngành",
  "Tư vấn nghề nghiệp và lộ trình phát triển",
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Hero */}
        <section className="py-16 md:py-20 bg-studyhub-hero">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-slate-700 bg-slate-100 rounded-full">
              <GraduationCap size={16} className="text-slate-500" />
              Mentor
            </div>
            <h1 className="mb-4 text-3xl font-bold text-gray-800 md:text-4xl">
              Đăng ký{" "}
              <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                mentor
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-gray-600">
              Gửi yêu cầu để được tư vấn hoặc{' '}
              <a href="/mentors" className="font-medium text-slate-600 hover:underline">
                xem danh sách mentor
              </a>
              {' '}để đặt lịch trực tiếp.
            </p>
          </div>
        </section>

        {/* Form section */}
        <section className="py-12 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
          <div className="px-4 mx-auto max-w-5xl sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Benefits */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white">
                <h2 className="mb-6 text-xl font-semibold">
                  Lợi ích khi có mentor
                </h2>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-amber-300 flex-shrink-0 mt-0.5" />
                      <span className="text-white/90">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Form (Client Component) */}
              <MentorForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
