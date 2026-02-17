import { Footer, Header } from "@/components/shared";
import { CheckCircle, GraduationCap, Send } from "lucide-react";

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
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-violet-700 bg-violet-100 rounded-full">
              <GraduationCap size={16} className="text-pink-500" />
              Mentor
            </div>
            <h1 className="mb-4 text-3xl font-bold text-gray-800 md:text-4xl">
              Đăng ký{" "}
              <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                mentor
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-gray-600">
              Chọn mentor phù hợp để được hướng dẫn học tập và định hướng lộ trình.
            </p>
          </div>
        </section>

        {/* Form section */}
        <section className="py-12 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-pink-100">
          <div className="px-4 mx-auto max-w-5xl sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Benefits */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white">
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

              {/* Form */}
              <div className="p-8 bg-white rounded-2xl border border-pink-100 shadow-lg">
                <h2 className="mb-6 text-xl font-semibold text-gray-800">
                  Gửi yêu cầu mentor
                </h2>
                <form className="space-y-4">
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 text-sm border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 text-sm border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="email@studyhub.vn"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Môn học quan tâm
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 text-sm border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="VD: Lập trình Web"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Mục tiêu học tập
                    </label>
                    <textarea
                      className="w-full px-4 py-3 text-sm border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent min-h-[120px] resize-none"
                      placeholder="Mô tả mục tiêu của bạn..."
                    />
                  </div>
                  <button className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl hover:shadow-lg hover:shadow-pink-200 transition-all">
                    <Send size={18} />
                    Gửi yêu cầu
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
