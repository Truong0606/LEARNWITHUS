import { ShieldCheck, Clock, Award, Globe } from "lucide-react";

const commitments = [
  {
    icon: ShieldCheck,
    title: "Bảo Mật Tuyệt Đối",
    description: "Hệ thống bảo mật đa lớp, mã hóa dữ liệu theo tiêu chuẩn quốc tế",
    features: ["Mã hóa AES-256", "Backup đa điểm", "Kiểm soát truy cập nghiêm ngặt"],
    bgColor: "bg-blue-600"
  },
  {
    icon: Award,
    title: "Độ Chính Xác Cao",
    description: "Cam kết độ chính xác 99.9% với công nghệ phân tích tiên tiến",
    features: ["Kiểm tra chéo 3 lần", "Thiết bị thế hệ mới", "Quy trình chuẩn ISO"],
    bgColor: "bg-green-600"
  },
  {
    icon: Clock,
    title: "Xử Lý Nhanh Chóng",
    description: "Kết quả nhanh nhất thị trường với quy trình tối ưu hóa",
    features: ["3-5 ngày làm việc", "Thông báo real-time", "Hỗ trợ khẩn cấp 24h"],
    bgColor: "bg-orange-600"
  },
  {
    icon: Globe,
    title: "Tiêu Chuẩn Quốc Tế",
    description: "Đạt chứng nhận quốc tế, được công nhận toàn cầu",
    features: ["Chứng nhận ISO 15189", "Chuẩn CAP", "Công nhận FDA"],
    bgColor: "bg-purple-600"
  }
];

export default function ValuesSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Cam Kết Chất Lượng
          </h2>
          <p className="text-lg text-blue-700 max-w-3xl mx-auto">
            Những tiêu chuẩn nghiêm ngặt mà chúng tôi cam kết thực hiện trong mọi dịch vụ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {commitments.map((commitment, index) => (
            <div key={index} className="group relative">
              {/* Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                {/* Icon */}
                <div className={`w-20 h-20 ${commitment.bgColor} rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <commitment.icon className="w-12 h-12 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-blue-900 mb-3 text-center">
                  {commitment.title}
                </h3>

                {/* Description */}
                <p className="text-blue-700 text-center mb-4 leading-relaxed">
                  {commitment.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  {commitment.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-sm text-blue-600">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 flex-shrink-0"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Tin Tưởng Từ Hơn 50,000 Khách Hàng
            </h3>
            <p className="text-blue-100 text-lg mb-6">
              Chúng tôi tự hào là đối tác đáng tin cậy của hàng nghìn gia đình Việt Nam
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white mb-2">99.9%</div>
                <div className="text-blue-200">Độ Chính Xác</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">50,000+</div>
                <div className="text-blue-200">Khách Hàng</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">15+</div>
                <div className="text-blue-200">Năm Kinh Nghiệm</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
