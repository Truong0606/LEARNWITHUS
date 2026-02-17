import { type LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo';
  change?: string;
  changeType?: 'increase' | 'decrease';
}

const colorMap: Record<string, string> = {
  blue: 'text-blue-600 bg-blue-100',
  green: 'text-green-600 bg-green-100',
  orange: 'text-orange-600 bg-orange-100',
  purple: 'text-purple-600 bg-purple-100',
  red: 'text-red-600 bg-red-100',
  indigo: 'text-indigo-600 bg-indigo-100',
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
    <div className={`rounded-2xl shadow-md p-6 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white/50 rounded-lg">
          <Icon size={24} />
        </div>
        {change && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              changeType === 'increase'
                ? 'bg-green-200 text-green-700'
                : 'bg-red-200 text-red-700'
            }`}
          >
            {changeType === 'increase' ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <p className="mb-1 text-sm text-gray-600">{title}</p>
      <p className="text-3xl font-extrabold">{value}</p>
    </div>
  );
}

