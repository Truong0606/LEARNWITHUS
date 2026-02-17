'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Flame
} from 'lucide-react';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface TimerConfig {
  focus: number;
  shortBreak: number;
  longBreak: number;
}

const DEFAULT_TIMES: TimerConfig = {
  focus: 25 * 60, // 25 minutes in seconds
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

const MODE_LABELS: Record<TimerMode, string> = {
  focus: 'Tập trung',
  shortBreak: 'Nghỉ ngắn',
  longBreak: 'Nghỉ dài',
};

const MODE_ICONS: Record<TimerMode, React.ReactNode> = {
  focus: <Brain size={20} />,
  shortBreak: <Coffee size={20} />,
  longBreak: <Sparkles size={20} />,
};

export default function PomodoroPage() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMES.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

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

  // Handle mode change
  const handleModeChange = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(DEFAULT_TIMES[newMode]);
    setIsRunning(false);
  }, []);

  // Handle Start/Pause
  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  // Handle Reset
  const resetTimer = () => {
    setTimeLeft(DEFAULT_TIMES[mode]);
    setIsRunning(false);
  };

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer completed
      setIsRunning(false);
      if (mode === 'focus') {
        setCompletedSessions((prev) => prev + 1);
        // Play notification sound (optional)
        if (typeof window !== 'undefined' && 'Notification' in window) {
          new Audio('/notification.mp3').play().catch(() => {});
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode]);

  // Update document title with timer
  useEffect(() => {
    document.title = isRunning 
      ? `${formatTime(timeLeft)} - ${MODE_LABELS[mode]} | StudyHub`
      : 'Pomodoro Timer | StudyHub';
  }, [timeLeft, isRunning, mode]);

  // Get colors based on mode
  const getModeColors = () => {
    switch (mode) {
      case 'focus':
        return {
          bg: 'from-violet-500 via-fuchsia-500 to-pink-500',
          ring: 'stroke-violet-500',
          button: 'from-violet-500 to-pink-500',
          light: 'from-violet-100 to-pink-100',
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

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.light} transition-all duration-500`}>
      <Header />

      {/* Session Counter */}
      <div className="flex justify-center py-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-amber-100">
          <Flame size={18} className="text-amber-600" />
          <span className="font-semibold text-amber-700">{completedSessions} phiên hoàn thành</span>
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
            title="Đặt lại"
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
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play size={28} />
                <span>Bắt đầu</span>
              </>
            )}
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-6 bg-white rounded-2xl shadow-lg border border-violet-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100">
                <Target size={20} className="text-violet-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Mục tiêu hôm nay</h3>
            </div>
            <p className="text-3xl font-bold text-violet-600">{completedSessions} / 8</p>
            <p className="mt-1 text-sm text-gray-500">phiên tập trung</p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-lg border border-emerald-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100">
                <Timer size={20} className="text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Thời gian học</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              {Math.floor((completedSessions * 25) / 60)}h {(completedSessions * 25) % 60}m
            </p>
            <p className="mt-1 text-sm text-gray-500">tổng thời gian</p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-lg border border-amber-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
                <Flame size={20} className="text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Chuỗi ngày</h3>
            </div>
            <p className="text-3xl font-bold text-amber-600">7 ngày</p>
            <p className="mt-1 text-sm text-gray-500">liên tiếp học tập</p>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
            <Sparkles size={20} className="text-amber-500" />
            Mẹo học hiệu quả với Pomodoro
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-violet-500">•</span>
              <span><strong>25 phút tập trung</strong> - Tắt thông báo, tập trung hoàn toàn vào công việc</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">•</span>
              <span><strong>5 phút nghỉ ngắn</strong> - Đứng dậy, vươn vai, uống nước</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span><strong>15 phút nghỉ dài</strong> - Sau 4 phiên, nghỉ dài để não bộ phục hồi</span>
            </li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
