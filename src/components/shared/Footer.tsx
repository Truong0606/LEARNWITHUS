import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white">
      <div className="px-6 py-12 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-white">
              StudyHub
            </h2>
            <p className="text-sm leading-relaxed text-white/80">
              Nền tảng học tập cộng đồng giúp sinh viên kết nối, trao đổi và
              bứt phá hiệu quả với nhóm học, diễn đàn và mentor đồng hành.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">
              Liên kết nhanh
            </h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-amber-300"
                >
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="transition-colors hover:text-amber-300"
                >
                  Nhóm học
                </Link>
              </li>
              <li>
                <Link
                  href="/blogs"
                  className="transition-colors hover:text-amber-300"
                >
                  Diễn đàn
                </Link>
              </li>
              <li>
                <Link
                  href="/mentors"
                  className="transition-colors hover:text-amber-300"
                >
                  Mentor
                </Link>
              </li>
              <li>
                <Link
                  href="/upgrade"
                  className="transition-colors hover:text-amber-300"
                >
                  Nâng cấp VIP
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">
              Liên hệ
            </h3>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <Mail className="text-amber-300 flex-shrink-0" size={16} />
                <span>support@studyhub.vn</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="text-amber-300 flex-shrink-0" size={16} />
                <span>+ 84 968 456 789</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="text-amber-300 flex-shrink-0" size={16} />
                <span>TP Hồ Chí Minh, Vietnam</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-12 text-sm text-center text-white/70 border-t border-white/20">
          © 2026 StudyHub.
          <p className="flex justify-center gap-4 pt-2">
            <span className="text-amber-300">Kết nối</span>
            <span className="text-white/50">–</span>
            <span className="text-white">Tập trung</span>
            <span className="text-white/50">–</span>
            <span className="text-amber-300">Tiến bộ</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
