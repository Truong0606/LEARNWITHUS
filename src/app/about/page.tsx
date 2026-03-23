import { Footer, Header } from "@/components/shared";
import { Target, Eye, Heart, Lightbulb } from "lucide-react";

export const metadata = {
  title: "Giới thiệu | Learn With Us",
  description: "Giới thiệu về Learn With Us và sứ mệnh kết nối cộng đồng học tập sinh viên.",
};

const values = [
  { icon: Target, title: "Sứ mệnh", description: "Kết nối sinh viên cùng học tập, chia sẻ kiến thức và hỗ trợ nhau vượt qua các môn học khó.", color: "violet" },
  { icon: Eye, title: "Tầm nhìn", description: "Trở thành nền tảng học tập cộng đồng hàng đầu cho sinh viên tại Việt Nam.", color: "pink" },
  { icon: Heart, title: "Giá trị", description: "Tôn trọng, chia sẻ, tiến bộ và minh bạch trong mọi hoạt động học tập.", color: "emerald" },
];

const features = [
  { title: "Cá nhân hóa lộ trình học", description: "Mỗi bạn có hồ sơ học tập riêng, cập nhật môn học, mục tiêu và lịch học.", color: "violet" },
  { title: "Học nhóm & thảo luận", description: "Nhóm học theo môn giúp bạn trao đổi bài tập, chia sẻ tài liệu và hỏi đáp.", color: "pink" },
  { title: "Tập trung với Pomodoro", description: "Thiết lập phiên học giúp tăng tập trung, theo dõi tiến độ và tránh xao nhãng.", color: "amber" },
  { title: "Mentor đồng hành", description: "Nhận tư vấn 1-1 từ mentor để định hướng học tập và nghề nghiệp.", color: "emerald" },
];

const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
  violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
  pink: { bg: "bg-pink-50", border: "border-pink-200", icon: "text-pink-600" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Hero */}
        <section className="py-16 md:py-20 bg-learnwithus-hero">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-violet-700 bg-violet-100 rounded-full">
              <Lightbulb size={16} className="text-amber-500" />
              Về chúng tôi
            </div>
            <h1 className="mb-4 text-3xl font-bold text-gray-800 md:text-4xl lg:text-5xl">
              Learn With Us -{" "}
              <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                Học cùng nhau
              </span>
              , tiến xa hơn
            </h1>
            <p className="max-w-3xl mx-auto text-gray-600 md:text-lg">
              Learn With Us giúp sinh viên tạo hồ sơ học tập, tìm nhóm phù hợp, thảo luận
              trên diễn đàn và nhận hỗ trợ từ mentor để tối ưu hiệu quả học tập.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-20 bg-white">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              {values.map((item, index) => {
                const colors = colorMap[item.color];
                const Icon = item.icon;
                return (
                  <div key={index} className={`p-8 rounded-2xl border ${colors.border} ${colors.bg}`}>
                    <div className={`inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl ${colors.bg} border ${colors.border}`}>
                      <Icon size={24} className={colors.icon} />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-800">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-pink-100">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl">
                Learn With Us{" "}
                <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                  hoạt động
                </span>{" "}
                như thế nào?
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {features.map((item, index) => {
                const colors = colorMap[item.color];
                return (
                  <div key={index} className={`p-6 rounded-2xl border ${colors.border} bg-white hover:shadow-lg transition-all`}>
                    <h3 className="mb-2 text-lg font-semibold text-gray-800">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
