import Image from "next/image";
import { GraduationCap, Award, Stethoscope, Star } from "lucide-react";

const team = [
  {
    name: "BS.CK2 Nguyễn Thanh Nam",
    position: "Giám đốc chuyên môn",
    speciality: "Chuyên khoa Di truyền Y học",
    experience: "20 năm kinh nghiệm",
    education: "Tiến sĩ Y học - Đại học Y Hà Nội",
    achievements: ["Chứng chỉ CAP", "Nghiên cứu sinh tại Mỹ", "300+ công trình khoa học"],
    image: "https://i.postimg.cc/YSFzZ4VZ/9e0e121abaf50eab57e4.jpg",
    rating: 4.9
  },
  {
    name: "BS.CK1 Trần Thị Minh Châu",
    position: "Trưởng phòng Xét nghiệm",
    speciality: "Sinh học phân tử",
    experience: "15 năm kinh nghiệm",
    education: "Thạc sĩ Sinh học - ĐH Khoa học Tự nhiên",
    achievements: ["Chứng chỉ ISO 15189", "Chuyên gia ADN hàng đầu", "150+ nghiên cứu"],
    image: "https://i.postimg.cc/YSFzZ4VZ/9e0e121abaf50eab57e4.jpg",
    rating: 4.8
  },
  {
    name: "BS. Lê Văn Hoàng",
    position: "Bác sĩ tư vấn di truyền",
    speciality: "Tư vấn di truyền học",
    experience: "12 năm kinh nghiệm",
    education: "Bác sĩ Y học - Đại học Y Dược TP.HCM",
    achievements: ["Chứng chỉ tư vấn di truyền", "Đào tạo tại Singapore", "1000+ ca tư vấn"],
    image: "https://i.postimg.cc/YSFzZ4VZ/9e0e121abaf50eab57e4.jpg",
    rating: 4.9
  },
  {
    name: "ThS. Phạm Thị Lan Anh",
    position: "Chuyên viên phân tích ADN",
    speciality: "Công nghệ sinh học",
    experience: "10 năm kinh nghiệm",
    education: "Thạc sĩ Công nghệ sinh học - ĐH Bách khoa",
    achievements: ["Chuyên gia NGS", "Chứng chỉ quốc tế", "AI trong phân tích ADN"],
    image: "https://i.postimg.cc/YSFzZ4VZ/9e0e121abaf50eab57e4.jpg",
    rating: 4.7
  }
];

export default function TeamSection() {
  return (
    <section className="py-16 md:py-20 bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Đội Ngũ Chuyên Gia
          </h2>
          <p className="text-lg text-blue-700 max-w-3xl mx-auto">
            Những chuyên gia hàng đầu trong lĩnh vực xét nghiệm ADN và di truyền y học
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group">
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <Image 
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Rating */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                  <span className="text-sm font-semibold text-blue-900">{member.rating}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Name & Position */}
                <h3 className="text-lg font-bold text-blue-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-semibold mb-2">{member.position}</p>
                
                {/* Speciality */}
                <div className="flex items-center mb-3">
                  <Stethoscope className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-sm text-blue-700">{member.speciality}</span>
                </div>

                {/* Experience */}
                <div className="flex items-center mb-3">
                  <Award className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-sm text-blue-700">{member.experience}</span>
                </div>

                {/* Education */}
                <div className="flex items-center mb-4">
                  <GraduationCap className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-sm text-blue-700">{member.education}</span>
                </div>

                {/* Achievements */}
                <div className="space-y-1">
                  {member.achievements.map((achievement, achievementIndex) => (
                    <div key={achievementIndex} className="flex items-center text-xs text-blue-600">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2 flex-shrink-0"></div>
                      <span>{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-900 mb-2">50+</div>
              <div className="text-blue-700">Chuyên gia</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-900 mb-2">200+</div>
              <div className="text-blue-700">Nhân viên</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-900 mb-2">15</div>
              <div className="text-blue-700">Chi nhánh</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-900 mb-2">24/7</div>
              <div className="text-blue-700">Hỗ trợ</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
