'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/shared';
import {
  Check,
  Sparkles,
  GraduationCap,
  MessageSquare,
  Crown,
  Zap,
  ArrowRight,
  Loader2,
  QrCode,
  Copy,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { VIP_PLANS, type VipPlanId } from '@/types';

const vipBenefits = [
  { icon: GraduationCap, text: '2 buổi Mentor miễn phí mỗi tháng' },
  { icon: Crown, text: 'Badge VIP trên profile và bài viết' },
  { icon: MessageSquare, text: 'Ưu tiên hỗ trợ từ đội ngũ' },
  { icon: Zap, text: 'Truy cập nhóm học premium' },
  { icon: Sparkles, text: 'Thống kê Pomodoro nâng cao' },
];

const plans = [
  { id: 'monthly' as const, name: VIP_PLANS.monthly.name, price: VIP_PLANS.monthly.price, period: 'tháng', popular: false, savings: null as string | null },
  { id: 'quarterly' as const, name: VIP_PLANS.quarterly.name, price: VIP_PLANS.quarterly.price, period: '3 tháng', popular: true, savings: 'Tiết kiệm 16%' },
  { id: 'yearly' as const, name: VIP_PLANS.yearly.name, price: VIP_PLANS.yearly.price, period: 'năm', popular: false, savings: 'Tiết kiệm 33%' },
] as const;

type PlanId = VipPlanId;

export default function UpgradePage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('quarterly');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userVipStatus, setUserVipStatus] = useState<{ isVip: boolean; expiry: string | null } | null>(null);

  const fetchVipStatus = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/upgrade', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const json = await res.json();
        setUserVipStatus({
          isVip: json.data?.isVip === true,
          expiry: json.data?.vipExpiresAt,
        });
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (t) fetchVipStatus(t);
  }, [fetchVipStatus]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const selectedPlanData = plans.find((p) => p.id === selectedPlan)!;

  const handleUpgrade = async () => {
    if (!token) {
      toast.error('Vui lòng đăng nhập để nâng cấp VIP');
      router.push('/login?redirect=/upgrade');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: selectedPlan }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.message || 'Không thể tạo thanh toán');
        return;
      }

      const { checkoutUrl } = json.data;
      if (!checkoutUrl) {
        toast.error('Không nhận được link thanh toán');
        return;
      }

      // Chuyển hướng đến trang thanh toán PayOS
      window.location.href = checkoutUrl;
    } catch {
      toast.error('Lỗi kết nối, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép');
  };

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
            VIP giúp bạn tận dụng tối đa Learn With Us với mentor miễn phí, nhóm học đặc biệt và nhiều ưu đãi khác.
          </p>

          {userVipStatus?.isVip && (
            <div className="mt-6 flex justify-center">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                <Crown size={24} className="text-amber-500" />
                <div className="text-left">
                  <p className="text-sm font-bold text-amber-800">Bạn hiện đã là thành viên VIP</p>
                  <p className="text-xs text-amber-700">
                    Hết hạn vào: {new Date(userVipStatus.expiry!).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>
          )}
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
                className={`relative rounded-2xl border-2 p-6 text-left transition-all ${selectedPlan === plan.id
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
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${selectedPlan === plan.id ? 'border-slate-600 bg-slate-600' : 'border-gray-300'
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
        <div className="text-center mb-16">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                {userVipStatus?.isVip ? 'Gia hạn' : 'Nâng cấp'} {selectedPlanData.name} — {formatPrice(selectedPlanData.price)}
              </>
            )}
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Thanh toán an toàn qua PayOS (Hỗ trợ VietQR, ATM, Thẻ quốc tế)
          </p>
          {!token && (
            <p className="mt-2 text-sm text-amber-600 font-medium">
              Bạn cần đăng nhập trước khi nâng cấp
            </p>
          )}
        </div>

        {/* Manual Bank Transfer Section */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <QrCode className="text-slate-600" />
            <h3 className="font-semibold text-xl text-gray-800">Hoặc chuyển khoản trực tiếp</h3>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col items-center justify-center">
              <div className="relative group">
                <img
                  src={`https://img.vietqr.io/image/MB-123456789-compact2.png?amount=${selectedPlanData.price}&addTag=0&area=0`}
                  alt="VietQR Payment"
                  className="w-64 h-64 grayscale group-hover:grayscale-0 transition-all duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-[2px]">
                  <span className="bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-gray-100">QUÉT ĐỂ THANH TOÁN</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500 italic">Quét mã VietQR để thanh toán nhanh</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                  <span className="text-sm text-gray-500 uppercase tracking-wider">Ngân hàng</span>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">MB Bank (Quân Đội)</p>
                  </div>
                </div>

                <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                  <span className="text-sm text-gray-500 uppercase tracking-wider">Số tài khoản</span>
                  <div className="text-right flex items-center gap-2">
                    <p className="font-bold text-gray-800">123456789</p>
                    <button onClick={() => copyToClipboard('123456789')} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                  <span className="text-sm text-gray-500 uppercase tracking-wider">Chủ tài khoản</span>
                  <div className="text-right">
                    <p className="font-bold text-gray-800 uppercase">STUDYHUB VIETNAM</p>
                  </div>
                </div>

                <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                  <span className="text-sm text-gray-500 uppercase tracking-wider">Số tiền</span>
                  <div className="text-right text-emerald-600">
                    <p className="font-bold">{formatPrice(selectedPlanData.price)}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-slate-300">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Nội dung chuyển khoản</p>
                  <div className="flex justify-between items-center">
                    <p className="font-mono font-bold text-slate-800">VIP {selectedPlan.toUpperCase()} {token ? "USER" : "GUEST"}</p>
                    <button onClick={() => copyToClipboard(`VIP ${selectedPlan.toUpperCase()}`)} className="p-1 hover:bg-white rounded text-slate-400">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100">
                <Info size={20} className="text-amber-500 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Sau khi chuyển khoản, vui lòng đợi 5-10 phút để hệ thống xác nhận. Nếu quá thời gian trên chưa thấy kích hoạt, hãy liên hệ fanpage hoặc hotline.
                </p>
              </div>
            </div>
          </div>
        </div>

>>>>>>> 08c089195523f5e41188fdbe21e477891476814d
        {/* FAQ */}
        <div className="mt-16 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h3 className="mb-6 font-semibold text-gray-800">Câu hỏi thường gặp</h3>
          <div className="space-y-4">
            </div>
              <p className="mt-1 text-sm text-gray-600">
                Mỗi tháng bạn được đặt 2 buổi tư vấn với bất kỳ mentor nào mà không mất phí. Không dùng hết sẽ không chuyển sang tháng sau.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
