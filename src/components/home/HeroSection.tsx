import Link from "next/link";
import { BookOpenCheck, Sparkles, Timer, Users } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative py-20 overflow-hidden md:py-24 bg-studyhub-hero">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-slate-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-slate-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" />
      <div className="absolute top-40 right-1/3 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />

      <div className="relative flex flex-col items-center px-4 mx-auto md:flex-row max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-12 text-center md:w-1/2 md:text-left md:mb-0">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-violet-700 bg-violet-100 rounded-full">
            <Sparkles size={16} className="text-amber-500" />
            Nền tảng học tập #1 cho sinh viên
          </div>
          <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-800 md:text-4xl lg:text-5xl">
            Học tập hiệu quả cùng
            <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              {" "}cộng đồng{" "}
            </span>
            sinh viên
          </h1>
          <p className="max-w-lg mb-8 text-sm text-gray-600 md:text-base">
            Tạo hồ sơ học tập, chọn môn yêu thích, tham gia nhóm học phù hợp,
            thảo luận trên diễn đàn và tăng năng suất với Pomodoro.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white transition-all bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl shadow-lg shadow-pink-200 hover:shadow-xl hover:shadow-pink-300 hover:-translate-y-0.5 font-semibold"
            >
              <Sparkles size={18} />
              Bắt đầu miễn phí
            </Link>
            <Link
              href="/services"
              className="inline-block px-6 py-3 font-semibold text-slate-700 transition-all border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300"
            >
              Khám phá nhóm học
            </Link>
          </div>
        </div>
        <div className="flex justify-center md:w-1/2">
          <div className="relative w-full max-w-md">
            <div className="grid gap-4">
              <div className="p-6 bg-white border border-violet-100 rounded-2xl shadow-lg shadow-violet-100/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg shadow-slate-200">
                    <Timer size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pomodoro đang chạy</p>
                    <p className="text-xl font-bold text-gray-800">24:30</p>
                  </div>
                </div>
                <div className="h-2.5 overflow-hidden bg-violet-100 rounded-full">
                  <div className="w-2/3 h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full" />
                </div>
              </div>

              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-100/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg shadow-slate-200">
                    <Users size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nhóm học hôm nay</p>
                    <p className="text-lg font-bold text-gray-800">
                      Toán rời rạc - Nhóm 7
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    8 online
                  </span>
                  {" "}đang thảo luận bài tập chương 4.
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200">
                    <BookOpenCheck size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Môn học yêu thích</p>
                    <p className="text-base font-semibold text-gray-800">
                      Lập trình Web, AI, Kinh tế học
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
