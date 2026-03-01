import Image from "next/image";
import type { TeamMember } from "@/types/home.types";

const team: TeamMember[] = [
  {
    name: "ThS. Vũ Thanh",
    title: "Mentor Toán & Tư duy logic",
    image: "https://i.postimg.cc/5y7sWk1t/mentor-01.jpg",
  },
  {
    name: "ThS. Lê Minh Châu",
    title: "Mentor Lập trình Web",
    image: "https://i.postimg.cc/jS6Xq3gC/mentor-02.jpg",
  },
  {
    name: "TS. Nguyễn An",
    title: "Mentor AI & Khoa học dữ liệu",
    image: "https://i.postimg.cc/0NQh6sKF/mentor-03.jpg",
  },
  {
    name: "ThS. Trần Ngọc",
    title: "Mentor Kinh tế học",
    image: "https://i.postimg.cc/3wM2rj6y/mentor-04.jpg",
  },
];

export default function TeamSection() {
  return (
    <section className="py-16 bg-white md:py-20">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl">
            Mentor{" "}
            <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              đồng hành
            </span>{" "}
            cùng bạn
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600">
            Đội ngũ mentor giàu kinh nghiệm, sẵn sàng hỗ trợ bạn trên hành trình học tập
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl border border-pink-100 bg-gradient-to-br from-violet-50/50 to-pink-50/50 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="relative w-24 h-24 mx-auto mb-4 overflow-hidden rounded-2xl ring-4 ring-slate-200 md:w-28 md:h-28">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 96px, 112px"
                />
              </div>
              <h3 className="text-base font-semibold text-gray-800 md:text-lg">
                {member.name}
              </h3>
              <p className="text-sm text-slate-600">
                {member.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
