'use client';

import { useState } from 'react';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';

export default function MentorForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !subject.trim()) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/mentor-bookings', { // Updated to actual endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          subject: subject.trim(),
          goal: goal.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-lg text-center">
        <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
        <h3 className="mb-2 text-lg font-bold text-gray-800">Gửi yêu cầu thành công!</h3>
        <p className="text-sm text-gray-600 mb-6">
          Chúng tôi đã nhận được yêu cầu của bạn và sẽ liên hệ trong thời gian sớm nhất.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setFullName('');
            setEmail('');
            setSubject('');
            setGoal('');
          }}
          className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
        >
          Gửi yêu cầu khác
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-lg">
      <h2 className="mb-6 text-xl font-semibold text-gray-800">
        Gửi yêu cầu mentor
      </h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">
            Họ và tên <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">
            Môn học quan tâm <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            placeholder="VD: Lập trình Web"
          />
        </div>
        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">
            Mục tiêu học tập
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent min-h-[120px] resize-none"
            placeholder="Mô tả mục tiêu của bạn..."
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-all disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Đang gửi...
            </>
          ) : (
            <>
              <Send size={18} />
              Gửi yêu cầu
            </>
          )}
        </button>
      </form>
    </div>
  );
}
