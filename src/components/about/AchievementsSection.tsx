import { Trophy, Star, Users, Microscope } from "lucide-react";

const achievements = [
  { icon: Trophy, number: "15+", label: "Giải thưởng Y tế" },
  { icon: Star, number: "99.9%", label: "Độ chính xác" },
  { icon: Users, number: "50,000+", label: "Khách hàng" },
  { icon: Microscope, number: "100,000+", label: "Mẫu xét nghiệm" }
];

export default function AchievementsSection() {
  return (
    <section className="py-20 bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Thành Tựu Đạt Được</h2>
          <p className="text-xl text-blue-100">Con số biết nói về chất lượng dịch vụ</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {achievements.map((item, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                  <item.icon className="w-8 h-8" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">{item.number}</div>
              <div className="text-blue-200">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
