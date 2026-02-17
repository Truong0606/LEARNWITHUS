import { Calendar, CheckCircle } from "lucide-react";

const milestones = [
  {
    year: "2008",
    title: "Thành lập công ty",
    description: "Bloodline DNA Center được thành lập với sứ mệnh mang công nghệ xét nghiệm ADN tiên tiến đến Việt Nam"
  },
  {
    year: "2012",
    title: "Mở rộng quy mô",
    description: "Khai trương phòng lab hiện đại đầu tiên tại TP.HCM với trang thiết bị nhập khẩu từ Mỹ"
  },
  {
    year: "2015",
    title: "Chứng nhận quốc tế",
    description: "Đạt chứng nhận ISO 15189 và CAP - tiêu chuẩn vàng trong ngành xét nghiệm y học"
  },
  {
    year: "2018",
    title: "Công nghệ AI",
    description: "Ứng dụng trí tuệ nhân tạo trong phân tích ADN, nâng độ chính xác lên 99.9%"
  },
  {
    year: "2020",
    title: "Mở rộng toàn quốc",
    description: "Phủ sóng dịch vụ trên toàn quốc với 15 chi nhánh và đội ngũ 200+ chuyên gia"
  }
];

export default function HistorySection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Hành Trình Phát Triển
          </h2>
          <p className="text-lg text-blue-700 max-w-3xl mx-auto">
            Từ một startup nhỏ đến trung tâm xét nghiệm ADN hàng đầu Việt Nam
          </p>
        </div>

        <div className="relative">
          {/* Timeline line - Hidden on mobile */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-blue-200"></div>

          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div key={index} className={`flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8'}`}>
                  <div className="bg-blue-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center mb-3 justify-center">
                      <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-2xl font-bold text-blue-900">{milestone.year}</span>
                    </div>
                    <h3 className="text-xl font-bold text-blue-900 mb-2">{milestone.title}</h3>
                    <p className="text-blue-700">{milestone.description}</p>
                  </div>
                </div>

                {/* Timeline dot - Hidden on mobile */}
                <div className="hidden md:flex relative z-10">
                  <div className="w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-lg items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                </div>

                <div className="hidden md:block w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
