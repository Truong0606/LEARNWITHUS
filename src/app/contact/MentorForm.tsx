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
      setError('Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin báº¯t buá»™c');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/mentor', {
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
        setError(data.message || 'CÃ³ lá»—i xáº£y ra. Vui lÃ²ng thá»­ láº¡i.');
      }
    } catch {
      setError('Lá»—i káº¿t ná»‘i. Vui lÃ²ng thá»­ láº¡i.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-lg text-center">
        <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
        <h3 className="mb-2 text-lg font-bold text-gray-800">Gá»­i yÃªu cáº§u thÃ nh cÃ´ng!</h3>
        <p className="text-sm text-gray-600 mb-6">
          ChÃºng tÃ´i Ä‘Ã£ nháº­n Ä‘Æ°á»£c yÃªu cáº§u cá»§a báº¡n vÃ  sáº½ liÃªn há»‡ trong thá»i gian sá»›m nháº¥t.
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
          Gá»­i yÃªu cáº§u khÃ¡c
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-lg">
      <h2 className="mb-6 text-xl font-semibold text-gray-800">
        Gá»­i yÃªu cáº§u mentor
      </h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">
            Há» vÃ  tÃªn <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="Nguyá»…n VÄƒn A"
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
            className="w-full px-4 py-3 text-sm border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="email@Learn With Us.vn"
          />
        </div>
        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">
            MÃ´n há»c quan tÃ¢m <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="VD: Láº­p trÃ¬nh Web"
          />
        </div>
        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">
            Má»¥c tiÃªu há»c táº­p
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent min-h-[120px] resize-none"
            placeholder="MÃ´ táº£ má»¥c tiÃªu cá»§a báº¡n..."
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl hover:shadow-lg hover:shadow-pink-200 transition-all disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Äang gá»­i...
            </>
          ) : (
            <>
              <Send size={18} />
              Gá»­i yÃªu cáº§u
            </>
          )}
        </button>
      </form>
    </div>
  );
}

