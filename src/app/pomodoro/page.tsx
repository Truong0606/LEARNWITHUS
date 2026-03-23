'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/shared';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  Sparkles,
  Timer,
  Target,
  Flame,
  Crown,
  TrendingUp,
  Lock,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface TimerConfig {
  focus: number;
  shortBreak: number;
  longBreak: number;
}

const DEFAULT_TIMES: TimerConfig = {
  focus: 25 * 60, // 25 minutes in seconds
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const MODE_LABELS: Record<TimerMode, string> = {
  focus: 'Táº­p trung',
  shortBreak: 'Nghá»‰ ngáº¯n',
  longBreak: 'Nghá»‰ dÃ i',
};

const MODE_ICONS: Record<TimerMode, React.ReactNode> = {
  focus: <Brain size={20} />,
  shortBreak: <Coffee size={20} />,
  longBreak: <Sparkles size={20} />,
};

interface VipStats {
  totalSessions: number;
  totalMinutes: number;
  streak: number;
  weeklyData: { date: string; sessions: number; minutes: number }[];
  monthlyData: { week: string; sessions: number; minutes: number }[];
  subjectBreakdown: { subject: string; count: number }[];
}

// Focus duration in minutes for display
const FOCUS_MINUTES = DEFAULT_TIMES.focus / 60;

export default function PomodoroPage() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMES.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [vipStats, setVipStats] = useState<VipStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [currentSubject, setCurrentSubject] = useState('');

  // Ref to prevent double-firing completion (guards against stale closure re-runs)
  const completionFiredRef = useRef(false);
  // Ref to always have the latest saveSession without adding it to timer effect deps
  const saveSessionRef = useRef<(duration: number) => Promise<void>>(() => Promise.resolve());

  // Load token and VIP status on mount
  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (t) {
      fetch('/api/upgrade', { headers: { Authorization: `Bearer ${t}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((json) => {
          if (json?.data?.isVip) setIsVip(true);
        })
        .catch(() => {});
    }
  }, []);

  // Load VIP stats
  const loadVipStats = useCallback(async (t: string) => {
    setStatsLoading(true);
    setStatsError(false);
    try {
      const res = await fetch('/api/pomodoro/stats', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const json = await res.json();
        setVipStats(json.data);
      } else {
        setStatsError(true);
      }
    } catch {
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isVip && token) {
      loadVipStats(token);
    }
  }, [isVip, token, loadVipStats]);

  // Save completed session to API
  const saveSession = useCallback(async (duration: number) => {
    if (!token) return;
    try {
      await fetch('/api/pomodoro/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          duration,
          subject: currentSubject || null,
          completedAt: new Date().toISOString(),
        }),
      });
      if (isVip) loadVipStats(token);
    } catch {
      // Bá» qua
    }
  }, [token, currentSubject, isVip, loadVipStats]);

  // Cáº­p nháº­t ref saveSession
  useEffect(() => {
    saveSessionRef.current = saveSession;
  }, [saveSession]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const getProgress = (): number => {
    const total = DEFAULT_TIMES[mode];
    return ((total - timeLeft) / total) * 100;
  };

  // Äá»•i cháº¿ Ä‘á»™
  const handleModeChange = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(DEFAULT_TIMES[newMode]);
    setIsRunning(false);
    completionFiredRef.current = false;
  }, []);

  // Handle Start/Pause
  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  // Reset timer
  const resetTimer = useCallback(() => {
    setTimeLeft(DEFAULT_TIMES[mode]);
    setIsRunning(false);
    completionFiredRef.current = false;
  }, [mode]);

  // Äáº¿m giÃ¢y
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Reset completion guard khi timeLeft > 0
  useEffect(() => {
    if (timeLeft > 0) {
      completionFiredRef.current = false;
    }
  }, [timeLeft]);

  // PhÃ¡t hiá»‡n hoÃ n thÃ nh 1 chu ká»³
  useEffect(() => {
    if (timeLeft !== 0 || completionFiredRef.current) return;
    completionFiredRef.current = true;
    setIsRunning(false);

    if (mode === 'focus') {
      setCompletedSessions((prev) => prev + 1);
      saveSessionRef.current(FOCUS_MINUTES); // use ref â€” no dep on saveSession
      if (typeof window !== 'undefined') {
        new Audio('/notification.mp3').play().catch(() => {});
      }
    }

    // Auto-reset so the user can press Start for the next session immediately
    setTimeLeft(DEFAULT_TIMES[mode]);
  }, [timeLeft, mode]); // intentionally excludes saveSession

  // Update document title with timer
  useEffect(() => {
    document.title = isRunning
      ? `${formatTime(timeLeft)} - ${MODE_LABELS[mode]} | Learn With Us`
      : 'Pomodoro Timer | Learn With Us';
  }, [timeLeft, isRunning, mode]);

  // Get colors based on mode
  const getModeColors = () => {
    switch (mode) {
      case 'focus':
        return {
          bg: 'from-slate-800 via-slate-900 to-slate-950',
          ring: 'stroke-slate-600',
          button: 'from-slate-800 via-slate-900 to-slate-950',
          light: 'from-slate-100 to-slate-200',
        };
      case 'shortBreak':
        return {
          bg: 'from-emerald-500 via-teal-500 to-cyan-500',
          ring: 'stroke-emerald-500',
          button: 'from-emerald-500 to-cyan-500',
          light: 'from-emerald-100 to-cyan-100',
        };
      case 'longBreak':
        return {
          bg: 'from-amber-500 via-orange-500 to-rose-500',
          ring: 'stroke-amber-500',
          button: 'from-amber-500 to-rose-500',
          light: 'from-amber-100 to-rose-100',
        };
    }
  };

  const colors = getModeColors();
  const realStreak = vipStats?.streak ?? 0;
  const totalFocusMinutes = completedSessions * FOCUS_MINUTES;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.light} transition-all duration-500`}>
      <Header />

      {/* Session Counter */}
      <div className="flex justify-center py-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-amber-100">
          <Flame size={18} className="text-amber-600" />
          <span className="font-semibold text-amber-700">{completedSessions} phiÃªn hoÃ n thÃ nh</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-8 mx-auto max-w-4xl sm:px-6 lg:px-8">
        {/* Mode Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 bg-white rounded-2xl shadow-lg">
            {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                  mode === m
                    ? `bg-gradient-to-r ${colors.button} text-white shadow-md`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {MODE_ICONS[m]}
                <span className="hidden sm:inline">{MODE_LABELS[m]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Subject Input (saved with session) */}
        {token && (
          <div className="flex justify-center mb-6">
            <input
              type="text"
              value={currentSubject}
              onChange={(e) => setCurrentSubject(e.target.value)}
              placeholder="Äang há»c gÃ¬? (tÃ¹y chá»n)"
              className="w-full max-w-xs px-4 py-2 text-sm text-gray-700 bg-white rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        )}

        {/* Timer Display */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="relative">
            {/* Progress Ring */}
            <svg className="w-72 h-72 sm:w-80 sm:h-80 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="white"
                strokeWidth="8"
                className="opacity-50"
              />
              {/* Progress circle */}
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={`${colors.ring} transition-all duration-500`}
                style={{
                  strokeDasharray: `${2 * Math.PI * 45}%`,
                  strokeDashoffset: `${2 * Math.PI * 45 * (1 - getProgress() / 100)}%`,
                }}
              />
            </svg>

            {/* Timer Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl sm:text-7xl font-bold text-gray-800 tabular-nums tracking-tight">
                {formatTime(timeLeft)}
              </span>
              <span className="mt-2 text-lg font-medium text-gray-500">
                {MODE_LABELS[mode]}
              </span>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mb-12">
          {/* Reset Button */}
          <button
            onClick={resetTimer}
            className="flex items-center justify-center w-14 h-14 text-gray-600 bg-white rounded-2xl shadow-lg hover:bg-gray-50 hover:text-gray-900 transition-all hover:scale-105"
            title="Äáº·t láº¡i"
          >
            <RotateCcw size={24} />
          </button>

          {/* Start/Pause Button */}
          <button
            onClick={toggleTimer}
            className={`flex items-center justify-center gap-3 px-10 py-4 text-xl font-semibold text-white bg-gradient-to-r ${colors.button} rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95`}
          >
            {isRunning ? (
              <>
                <Pause size={28} />
                <span>Táº¡m dá»«ng</span>
              </>
            ) : (
              <>
                <Play size={28} />
                <span>Báº¯t Ä‘áº§u</span>
              </>
            )}
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-6 bg-white rounded-2xl shadow-lg border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100">
                <Target size={20} className="text-slate-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Má»¥c tiÃªu hÃ´m nay</h3>
            </div>
            <p className="text-3xl font-bold text-slate-600">{completedSessions} / 8</p>
            <p className="mt-1 text-sm text-gray-500">phiÃªn táº­p trung</p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-lg border border-emerald-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100">
                <Timer size={20} className="text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Thá»i gian há»c</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
            </p>
            <p className="mt-1 text-sm text-gray-500">hÃ´m nay</p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-lg border border-amber-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
                <Flame size={20} className="text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Chuá»—i ngÃ y</h3>
            </div>
            {isVip ? (
              <>
                <p className="text-3xl font-bold text-amber-600">{realStreak} ngÃ y</p>
                <p className="mt-1 text-sm text-gray-500">liÃªn tiáº¿p há»c táº­p</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <Lock size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-400">VIP only</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  <Link href="/upgrade" className="text-amber-600 font-medium hover:underline">NÃ¢ng cáº¥p VIP</Link> Ä‘á»ƒ xem
                </p>
              </>
            )}
          </div>
        </div>

        {/* VIP Stats Section */}
        {isVip && (
          <div className="mt-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown size={20} className="text-amber-500" />
                <h2 className="text-lg font-bold text-gray-800">Thá»‘ng kÃª nÃ¢ng cao (VIP)</h2>
              </div>
              {token && (
                <button
                  onClick={() => loadVipStats(token)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <RefreshCw size={14} />
                  LÃ m má»›i
                </button>
              )}
            </div>

            {statsLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              </div>
            ) : statsError ? (
              <div className="flex flex-col items-center py-10 gap-3 bg-white rounded-2xl border border-red-100">
                <p className="text-sm text-red-500 font-medium">KhÃ´ng thá»ƒ táº£i thá»‘ng kÃª</p>
                {token && (
                  <button
                    onClick={() => loadVipStats(token)}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    <RefreshCw size={13} /> Thá»­ láº¡i
                  </button>
                )}
              </div>
            ) : vipStats ? (
              <>
                {/* Summary row */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
                    <p className="text-2xl font-bold text-slate-700">{vipStats.totalSessions}</p>
                    <p className="text-sm text-gray-500 mt-0.5">Tá»•ng phiÃªn há»c</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      {Math.floor(vipStats.totalMinutes / 60)}h {vipStats.totalMinutes % 60}m
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">Tá»•ng thá»i gian</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
                    <p className="text-2xl font-bold text-amber-600">{vipStats.streak} ngÃ y</p>
                    <p className="text-sm text-gray-500 mt-0.5">Chuá»—i ngÃ y hiá»‡n táº¡i</p>
                  </div>
                </div>

                {/* Weekly Chart */}
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={18} className="text-slate-600" />
                    <h3 className="font-semibold text-gray-800">7 ngÃ y gáº§n nháº¥t</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={vipStats.weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        formatter={(value) => [`${value ?? 0} phiÃªn`, 'Pomodoro']}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="sessions" fill="#475569" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly Chart */}
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={18} className="text-emerald-600" />
                    <h3 className="font-semibold text-gray-800">4 tuáº§n gáº§n nháº¥t</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={vipStats.monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        formatter={(value) => [`${value ?? 0} phiÃªn`, 'Pomodoro']}
                        contentStyle={{ borderRadius: 8, border: '1px solid #d1fae5' }}
                      />
                      <Bar dataKey="sessions" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Subject Breakdown */}
                {vipStats.subjectBreakdown.length > 0 && (
                  <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4">MÃ´n há»c nhiá»u nháº¥t</h3>
                    <div className="space-y-2.5">
                      {vipStats.subjectBreakdown.map(({ subject, count }) => {
                        const max = vipStats.subjectBreakdown[0].count;
                        return (
                          <div key={subject} className="flex items-center gap-3">
                            <span className="w-32 text-sm text-gray-600 truncate">{subject}</span>
                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-600 rounded-full"
                                style={{ width: `${(count / max) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-slate-700 w-12 text-right">{count} phiÃªn</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty state when no sessions yet */}
                {vipStats.totalSessions === 0 && (
                  <div className="p-8 bg-white rounded-2xl border border-gray-100 text-center">
                    <p className="text-gray-400 text-sm">ChÆ°a cÃ³ phiÃªn há»c nÃ o. HoÃ n thÃ nh phiÃªn Pomodoro Ä‘áº§u tiÃªn Ä‘á»ƒ tháº¥y thá»‘ng kÃª!</p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Non-VIP stats teaser */}
        {!isVip && token && (
          <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <Crown size={20} className="text-amber-500" />
              <h3 className="font-semibold text-amber-800">Thá»‘ng kÃª Pomodoro nÃ¢ng cao</h3>
            </div>
            <p className="text-sm text-amber-700 mb-4">
              Xem lá»‹ch sá»­, biá»ƒu Ä‘á»“ theo tuáº§n/thÃ¡ng, chuá»—i ngÃ y há»c táº­p vÃ  phÃ¢n tÃ­ch mÃ´n há»c vá»›i tÃ i khoáº£n VIP.
            </p>
            <Link
              href="/upgrade"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:shadow-lg transition-all"
            >
              <Crown size={15} />
              NÃ¢ng cáº¥p VIP ngay
            </Link>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
            <Sparkles size={20} className="text-amber-500" />
            Máº¹o há»c hiá»‡u quáº£ vá»›i Pomodoro
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-slate-500">â€¢</span>
              <span><strong>25 phÃºt táº­p trung</strong> - Táº¯t thÃ´ng bÃ¡o, táº­p trung hoÃ n toÃ n vÃ o cÃ´ng viá»‡c</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">â€¢</span>
              <span><strong>5 phÃºt nghá»‰ ngáº¯n</strong> - Äá»©ng dáº­y, vÆ°Æ¡n vai, uá»‘ng nÆ°á»›c</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">â€¢</span>
              <span><strong>15 phÃºt nghá»‰ dÃ i</strong> - Sau 4 phiÃªn, nghá»‰ dÃ i Ä‘á»ƒ nÃ£o bá»™ phá»¥c há»“i</span>
            </li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}

