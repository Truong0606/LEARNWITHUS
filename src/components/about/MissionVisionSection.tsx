import { Target, Eye, Heart, Shield, Star, Users } from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Bảo Mật Tuyệt Đối",
    description: "Cam kết bảo vệ thông tin cá nhân và kết quả xét nghiệm của khách hàng"
  },
  {
    icon: Star,
    title: "Chất Lượng Hàng Đầu",
    description: "Sử dụng công nghệ tiên tiến nhất để đảm bảo độ chính xác cao nhất"
  },
  {
    icon: Heart,
    title: "Tận Tâm Phục Vụ",
    description: "Đặt khách hàng làm trung tâm, luôn lắng nghe và hỗ trợ tốt nhất"
  },
  {
    icon: Users,
    title: "Đội Ngũ Chuyên Nghiệp",
    description: "Bác sĩ và kỹ thuật viên được đào tạo bài bản, giàu kinh nghiệm"
  }
];

export default function MissionVisionSection() {
  return (
    <section className="py-16 md:py-20 bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Mission */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900">Sứ Mệnh</h3>
            </div>
            <p className="text-blue-700 leading-relaxed text-lg">
              Mang đến dịch vụ xét nghiệm ADN huyết thống chính xác, tin cậy và có ý nghĩa, 
              giúp mọi người khám phá nguồn gốc, tìm hiểu gia đình và xây dựng tương lai tốt đẹp hơn.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900">Tầm Nhìn</h3>
            </div>
            <p className="text-blue-700 leading-relaxed text-lg">
              Trở thành trung tâm xét nghiệm ADN hàng đầu khu vực Đông Nam Á, 
              tiên phong trong ứng dụng công nghệ sinh học hiện đại phục vụ cộng đồng.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Giá Trị Cốt Lõi
          </h2>
          <p className="text-lg text-blue-700 max-w-3xl mx-auto">
            Những nguyên tắc định hướng mọi hoạt động của chúng tôi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <div key={index} className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-blue-900 mb-3">{value.title}</h4>
              <p className="text-blue-700 text-sm leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
