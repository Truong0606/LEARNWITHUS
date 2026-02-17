import { Cpu, Shield, Zap, Globe, Brain, Database } from "lucide-react";

const technologies = [
  {
    icon: Brain,
    title: "Trí Tuệ Nhân Tạo",
    description: "Ứng dụng AI và Machine Learning trong phân tích dữ liệu ADN",
    features: ["Phân tích tự động", "Độ chính xác cao", "Xử lý nhanh chóng"],
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  {
    icon: Shield,
    title: "Bảo Mật Blockchain",
    description: "Công nghệ blockchain đảm bảo an toàn thông tin tuyệt đối",
    features: ["Mã hóa đa lớp", "Lưu trữ phân tán", "Không thể thay đổi"],
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  {
    icon: Zap,
    title: "Tự Động Hóa",
    description: "Hệ thống robot và tự động hóa toàn bộ quy trình xét nghiệm",
    features: ["Robot pipetting", "Tự động phân loại", "Giảm sai sót"],
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200"
  },
  {
    icon: Database,
    title: "Big Data Analytics",
    description: "Phân tích dữ liệu lớn để tối ưu hóa kết quả xét nghiệm",
    features: ["Xử lý song song", "Thuật toán tiên tiến", "Báo cáo chi tiết"],
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200"
  },
  {
    icon: Cpu,
    title: "Chip Sinh Học",
    description: "Công nghệ chip sinh học thế hệ mới cho phân tích ADN",
    features: ["Tốc độ cao", "Tiết kiệm chi phí", "Độ nhạy cao"],
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200"
  },
  {
    icon: Globe,
    title: "Chuẩn Quốc Tế",
    description: "Tuân thủ các tiêu chuẩn quốc tế nghiêm ngặt nhất",
    features: ["ISO 15189", "CAP certified", "FDA approved"],
    bgColor: "bg-red-50",
    borderColor: "border-red-200"
  }
];

const equipment = [
  {
    name: "Illumina NovaSeq 6000",
    type: "Máy giải trình tự ADN",
    capability: "150 tỷ base/run"
  },
  {
    name: "Applied Biosystems 3500",
    type: "Máy phân tích di truyền",
    capability: "24 mẫu/run"
  },
  {
    name: "Thermo Fisher Ion GeneStudio S5",
    type: "Hệ thống NGS",
    capability: "1-50M reads"
  },
  {
    name: "Bio-Rad CFX96",
    type: "Real-time PCR",
    capability: "96 wells"
  }
];

export default function TechnologySection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Công Nghệ Tiên Tiến
          </h2>
          <p className="text-lg text-blue-700 max-w-3xl mx-auto">
            Ứng dụng những công nghệ mới nhất trong lĩnh vực sinh học phân tử và xét nghiệm ADN
          </p>
        </div>

        {/* Technology Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {technologies.map((tech, index) => (
            <div key={index} className={`${tech.bgColor} ${tech.borderColor} border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group`}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <tech.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-blue-900">{tech.title}</h3>
              </div>
              
              <p className="text-blue-700 mb-4 leading-relaxed">
                {tech.description}
              </p>

              <div className="space-y-2">
                {tech.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center text-sm text-blue-600">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 flex-shrink-0"></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Equipment Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-blue-900 mb-2">
              Trang Thiết Bị Hiện Đại
            </h3>
            <p className="text-blue-700">
              Đầu tư hàng triệu USD cho thiết bị y tế tiên tiến nhất
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {equipment.map((item, index) => (
              <div key={index} className="bg-blue-50 rounded-xl p-6 text-center hover:bg-blue-100 transition-colors duration-300">
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Cpu className="w-6 h-6 text-blue-700" />
                </div>
                <h4 className="text-lg font-bold text-blue-900 mb-2">{item.name}</h4>
                <p className="text-sm text-blue-700 mb-2">{item.type}</p>
                <span className="inline-block bg-blue-200 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                  {item.capability}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Innovation Timeline */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">
              Đổi Mới Liên Tục
            </h3>
            <p className="text-blue-100">
              Cam kết nghiên cứu và phát triển công nghệ mới
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">$5M+</div>
              <div className="text-blue-200">Đầu tư R&D hàng năm</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">50+</div>
              <div className="text-blue-200">Dự án nghiên cứu</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">20+</div>
              <div className="text-blue-200">Bằng sáng chế</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
