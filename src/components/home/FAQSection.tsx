'use client';

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import type { FAQ } from "@/types/home.types";

const faqs: FAQ[] = [
  {
    key: "1",
    question: "Làm sao tạo hồ sơ học tập?",
    answer:
      "Bạn đăng ký tài khoản, nhập môn học, sở thích và mục tiêu. Hệ thống sẽ gợi ý nhóm học phù hợp.",
  },
  {
    key: "2",
    question: "Tham gia nhóm học như thế nào?",
    answer:
      "Chọn môn học, xem danh sách nhóm và bấm tham gia. Bạn có thể tạo nhóm riêng nếu chưa có nhóm phù hợp.",
  },
  {
    key: "3",
    question: "Diễn đàn có quy định gì không?",
    answer:
      "Khuyến khích thảo luận tích cực và tôn trọng lẫn nhau. Nội dung vi phạm sẽ bị kiểm duyệt.",
  },
  {
    key: "4",
    question: "Pomodoro hoạt động ra sao?",
    answer:
      "Thiết lập phiên học 25 phút, nghỉ 5 phút. Bạn có thể tùy chỉnh thời gian theo thói quen.",
  },
  {
    key: "5",
    question: "Đăng ký mentor có mất phí không?",
    answer:
      "Tùy mentor và gói hỗ trợ. Bạn có thể xem chi tiết giá và lịch mentor trước khi đăng ký.",
  },
];

export default function FAQSection() {
  const [openKey, setOpenKey] = useState<string | null>("1");

  const toggleFAQ = (key: string) => {
    setOpenKey(openKey === key ? null : key);
  };

  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl">
            Câu hỏi{" "}
            <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              thường gặp
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600">
            Giải đáp những thắc mắc phổ biến về StudyHub
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq) => (
            <div
              key={faq.key}
              className={`mb-4 rounded-2xl border transition-all ${
                openKey === faq.key
                  ? "border-slate-200 bg-white shadow-lg shadow-slate-100/50"
                  : "border-gray-200 bg-white/50 hover:border-slate-200"
              }`}
            >
              <button
                onClick={() => toggleFAQ(faq.key)}
                className="flex items-center justify-between w-full p-5 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${openKey === faq.key ? "bg-slate-100" : "bg-gray-100"}`}>
                    <HelpCircle
                      size={18}
                      className={openKey === faq.key ? "text-slate-600" : "text-gray-500"}
                    />
                  </div>
                  <span className="font-medium text-gray-800">
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-gray-500 transition-transform ${
                    openKey === faq.key ? "rotate-180 text-slate-600" : ""
                  }`}
                />
              </button>
              {openKey === faq.key && (
                <div className="px-5 pb-5 pl-16">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
