'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { VIP_PLANS, type VipPlanId } from '@/types';

const vipBenefits = [
  { icon: GraduationCap, text: '2 buá»•i Mentor miá»…n phÃ­ má»—i thÃ¡ng' },
  { icon: Crown, text: 'Badge VIP trÃªn profile vÃ  bÃ i viáº¿t' },
  { icon: MessageSquare, text: 'Æ¯u tiÃªn há»— trá»£ tá»« Ä‘á»™i ngÅ©' },
  { icon: Zap, text: 'Truy cáº­p nhÃ³m há»c premium' },
  { icon: Sparkles, text: 'Thá»‘ng kÃª Pomodoro nÃ¢ng cao' },
];

const plans = [
  { id: 'monthly' as const, name: VIP_PLANS.monthly.name, price: VIP_PLANS.monthly.price, period: 'thÃ¡ng', popular: false, savings: null as string | null },
  { id: 'quarterly' as const, name: VIP_PLANS.quarterly.name, price: VIP_PLANS.quarterly.price, period: '3 thÃ¡ng', popular: true, savings: 'Tiáº¿t kiá»‡m 16%' },
  { id: 'yearly' as const, name: VIP_PLANS.yearly.name, price: VIP_PLANS.yearly.price, period: 'nÄƒm', popular: false, savings: 'Tiáº¿t kiá»‡m 33%' },
] as const;

type PlanId = VipPlanId;

export default function UpgradePage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('quarterly');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const selectedPlanData = plans.find((p) => p.id === selectedPlan)!;

  const handleUpgrade = async () => {
    if (!token) {
      toast.error('Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ nÃ¢ng cáº¥p VIP');
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
        toast.error(json.message || 'KhÃ´ng thá»ƒ táº¡o thanh toÃ¡n');
        return;
      }

      const { checkoutUrl } = json.data;
      if (!checkoutUrl) {
        toast.error('KhÃ´ng nháº­n Ä‘Æ°á»£c link thanh toÃ¡n');
        return;
      }

      // Chuyá»ƒn hÆ°á»›ng Ä‘áº¿n trang thanh toÃ¡n PayOS
      window.location.href = checkoutUrl;
    } catch {
      toast.error('Lá»—i káº¿t ná»‘i, vui lÃ²ng thá»­ láº¡i');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="px-4 py-12 mx-auto max-w-5xl sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm font-medium text-amber-700 bg-amber-100 rounded-full">
            <Crown size={16} className="text-amber-600" />
            NÃ¢ng cáº¥p VIP
          </div>
          <h1 className="mb-3 text-3xl font-bold text-gray-800 md:text-4xl">
            Má»Ÿ khÃ³a toÃ n bá»™ tiá»m nÄƒng há»c táº­p
          </h1>
          <p className="max-w-2xl mx-auto text-gray-600">
            VIP giÃºp báº¡n táº­n dá»¥ng tá»‘i Ä‘a Learn With Us vá»›i mentor miá»…n phÃ­, nhÃ³m há»c Ä‘áº·c biá»‡t vÃ  nhiá»u Æ°u Ä‘Ã£i khÃ¡c.
          </p>
        </section>

        {/* Benefits */}
        <div className="mb-12 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h3 className="mb-6 text-center font-semibold text-gray-800">
            Quyá»n lá»£i thÃ nh viÃªn VIP
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
            Chá»n gÃ³i phÃ¹ há»£p
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
                    Phá»• biáº¿n
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
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Äang xá»­ lÃ½...
              </>
            ) : (
              <>
                NÃ¢ng cáº¥p {selectedPlanData.name} â€” {formatPrice(selectedPlanData.price)}
                <ArrowRight size={20} />
              </>
            )}
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Thanh toÃ¡n an toÃ n qua PayOS
          </p>
          {!token && (
            <p className="mt-2 text-sm text-amber-600 font-medium">
              Báº¡n cáº§n Ä‘Äƒng nháº­p trÆ°á»›c khi nÃ¢ng cáº¥p
            </p>
          )}
        </div>

        {/* FAQ */}
        <div className="mt-16 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h3 className="mb-6 font-semibold text-gray-800">CÃ¢u há»i thÆ°á»ng gáº·p</h3>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-800">2 buá»•i Mentor miá»…n phÃ­ Ä‘Æ°á»£c tÃ­nh tháº¿ nÃ o?</p>
              <p className="mt-1 text-sm text-gray-600">
                Má»—i thÃ¡ng báº¡n Ä‘Æ°á»£c Ä‘áº·t 2 buá»•i tÆ° váº¥n vá»›i báº¥t ká»³ mentor nÃ o mÃ  khÃ´ng máº¥t phÃ­. KhÃ´ng dÃ¹ng háº¿t sáº½ khÃ´ng chuyá»ƒn sang thÃ¡ng sau.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800">CÃ³ thá»ƒ há»§y gÃ³i VIP khÃ´ng?</p>
              <p className="mt-1 text-sm text-gray-600">
                CÃ³. Báº¡n cÃ³ thá»ƒ há»§y báº¥t ká»³ lÃºc nÃ o. Quyá»n lá»£i VIP sáº½ duy trÃ¬ Ä‘áº¿n háº¿t ká»³ Ä‘Ã£ thanh toÃ¡n.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

