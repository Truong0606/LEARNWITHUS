'use client';

import { Star } from "lucide-react";
import type { Testimonial } from "@/types/home.types";

const testimonials: Testimonial[] = [
  {
    content:
      "Nhờ StudyHub mình tìm được nhóm học Giải tích rất hợp, cùng luyện đề nên tiến bộ nhanh.",
    name: "Phương Linh",
    location: "Đại học Bách Khoa",
    rating: 5,
  },
  {
    content:
      "Diễn đàn hoạt động sôi nổi, câu hỏi mình đăng đều được phản hồi nhanh và hữu ích.",
    name: "Minh Khang",
    location: "ĐH Kinh tế",
    rating: 5,
  },
  {
    content:
      "Pomodoro tích hợp sẵn giúp mình tập trung hơn, không bị xao nhãng như trước.",
    name: "Thúy Hằng",
    location: "ĐH Công nghệ",
    rating: 5,
  },
  {
    content:
      "Mentor hướng dẫn học thuật rất bài bản, mình định hướng được lộ trình học rõ ràng.",
    name: "Quốc Việt",
    location: "ĐH FPT",
    rating: 5,
  },
  {
    content:
      "Tạo lịch học và chia nhiệm vụ trong nhóm cực tiện, cả nhóm học đều hơn hẳn.",
    name: "Ngọc Ánh",
    location: "ĐH Sư phạm",
    rating: 5,
  },
];

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
  <div className="flex-shrink-0 w-80 p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
    <div className="flex mb-3 gap-0.5">
      {Array.from({ length: Math.floor(testimonial.rating) }).map((_, i) => (
        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
      ))}
    </div>
    <p className="mb-4 text-sm leading-relaxed text-white/90">
      &ldquo;{testimonial.content}&rdquo;
    </p>
    <div className="pt-4 border-t border-white/10">
      <p className="font-semibold text-white">{testimonial.name}</p>
      <p className="text-sm text-white/70">{testimonial.location}</p>
    </div>
  </div>
);

export default function TestimonialsSection() {
  return (
    <section className="py-16 text-white md:py-20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 overflow-hidden">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">
            Sinh viên nói gì về StudyHub
          </h2>
          <p className="text-white/80">
            Hơn 25.000 sinh viên đã tin tưởng và sử dụng
          </p>
        </div>
        <div className="testimonial-container">
          <div className="auto-scroll-container gap-6">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`first-${index}`}
                testimonial={testimonial}
              />
            ))}
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`second-${index}`}
                testimonial={testimonial}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
