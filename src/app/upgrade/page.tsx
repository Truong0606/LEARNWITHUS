'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/shared';
import {
  Check,
  Sparkles,
  GraduationCap,
  MessageSquare,
  Crown,
  Zap,
  ArrowRight,
} from 'lucide-react';

const vipBenefits = [
  { icon: GraduationCap, text: '2 buổi Mentor miễn phí mỗi tháng' },
  { icon: Crown, text: 'Badge VIP trên profile và bài viết' },
  { icon: MessageSquare, text: 'Ưu tiên hỗ trợ từ đội ngũ' },
  { icon: Zap, text: 'Truy cập nhóm học premium' },
  { icon: Sparkles, text: 'Thống kê Pomodoro nâng cao' },
];

const plans = [
  {
    id: 'monthly',
    name: 'Hàng tháng',
    price: 99000,
    period: 'tháng',
    popular: false,
    savings: null,
  },
  {
    id: 'quarterly',
    name: '3 tháng',
    price: 249000,
    period: '3 tháng',
    popular: true,
    savings: 'Tiết kiệm 16%',
  },
  {
    id: 'yearly',
    name: '1 năm',
    price: 799000,
    period: 'năm',
    popular: false,
    savings: 'Tiết kiệm 33%',
  },
];

export default function UpgradePage() {
  const [selectedPlan, setSelectedPlan] = useState('quarterly');

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="px-4 py-12 mx-auto max-w-5xl sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm font-medium text-amber-700 bg-amber-100 rounded-full">
            <Crown size={16} className="text-amber-600" />
            Nâng cấp VIP
          </div>
          <h1 className="mb-3 text-3xl font-bold text-gray-800 md:text-4xl">
            Mở khóa toàn bộ tiềm năng học tập
          </h1>
          <p className="max-w-2xl mx-auto text-gray-600">
            VIP giúp bạn tận dụng tối đa StudyHub với mentor miễn phí, nhóm học đặc biệt và nhiều ưu đãi khác.
          </p>
        </section>

        {/* Benefits */}
        <div className="mb-12 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h3 className="mb-6 text-center font-semibold text-gray-800">
            Quyền lợi thành viên VIP
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vipBenefits.map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-4 rounded-xl border border-gray-100 p-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                  <item.icon size={24} className="text-slate-600" />
                </div>
                <span className="font-medium text-gray-800">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-12">
          <h3 className="mb-6 text-center font-semibold text-gray-800">
            Chọn gói phù hợp
          </h3>
          <div className="grid gap-6 sm:grid-cols-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl border-2 p-6 text-left transition-all ${
                  selectedPlan === plan.id
                    ? 'border-slate-600 bg-slate-50 shadow-lg shadow-slate-200'
                    : 'border-gray-200 bg-white hover:border-slate-300'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-600 px-3 py-1 text-xs font-semibold text-white">
                    Phổ biến
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      selectedPlan === plan.id ? 'border-slate-600 bg-slate-600' : 'border-gray-300'
                    }`}
                  >
                    {selectedPlan === plan.id && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-semibold text-gray-800">{plan.name}</span>
                </div>
                <p className="mt-4 text-2xl font-bold text-slate-600">
                  {formatPrice(plan.price)}
                </p>
                <p className="text-sm text-gray-500">/ {plan.period}</p>
                {plan.savings && (
                  <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                    {plan.savings}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl">
            Nâng cấp ngay
            <ArrowRight size={20} />
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Thanh toán an toàn qua PayOS / VNPay
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h3 className="mb-6 font-semibold text-gray-800">Câu hỏi thường gặp</h3>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-800">2 buổi Mentor miễn phí được tính thế nào?</p>
              <p className="mt-1 text-sm text-gray-600">
                Mỗi tháng bạn được đặt 2 buổi tư vấn với bất kỳ mentor nào mà không mất phí. Không dùng hết sẽ không chuyển sang tháng sau.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Có thể hủy gói VIP không?</p>
              <p className="mt-1 text-sm text-gray-600">
                Có. Bạn có thể hủy bất kỳ lúc nào. Quyền lợi VIP sẽ duy trì đến hết kỳ đã thanh toán.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
