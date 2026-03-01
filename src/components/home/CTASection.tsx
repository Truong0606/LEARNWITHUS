import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-16 bg-white md:py-20">
      <div className="px-4 mx-auto max-w-4xl sm:px-6 lg:px-8">
        <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white text-center overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium bg-white/20 rounded-full">
              <Sparkles size={16} className="text-amber-300" />
              Hoàn toàn miễn phí
            </div>
            <h2 className="mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">
              Bắt đầu hành trình học tập hiệu quả ngay hôm nay
            </h2>
            <p className="mb-8 text-white/80 max-w-2xl mx-auto">
              Tạo hồ sơ, chọn môn yêu thích và tham gia cộng đồng 25.000+ sinh viên đang học tập cùng nhau.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-slate-800 font-semibold transition-all bg-white rounded-xl hover:shadow-xl hover:-translate-y-0.5"
              >
                Đăng ký miễn phí
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold transition-all border-2 border-white/30 rounded-xl hover:bg-white/10"
              >
                Xem nhóm học nổi bật
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
