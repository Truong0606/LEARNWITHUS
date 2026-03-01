import { type LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo';
  change?: string;
  changeType?: 'increase' | 'decrease';
}

const iconBgMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-emerald-100 text-emerald-600',
  orange: 'bg-amber-100 text-amber-600',
  purple: 'bg-violet-100 text-violet-600',
  red: 'bg-rose-100 text-rose-600',
  indigo: 'bg-indigo-100 text-indigo-600',
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  change,
  changeType,
}: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBgMap[color]}`}>
          <Icon size={24} />
        </div>
        {change && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              changeType === 'increase'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {changeType === 'increase' ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <p className="mt-4 text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

