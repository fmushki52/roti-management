'use client';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  target: number;
  committed: number;
  size?: number;
}

export function ProgressDonut({ target, committed, size = 200 }: Props) {
  const pct = target > 0 ? Math.min((committed / target) * 100, 100) : 0;
  const remaining = Math.max(target - committed, 0);
  const data = [
    { name: 'committed', value: committed },
    { name: 'remaining', value: remaining },
  ];
  if (committed === 0 && remaining === 0) {
    data[1].value = 1;
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
            <Cell fill="#FFD700" />
            <Cell fill="#FFF3B0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-bold text-[var(--brand-brown)]" style={{ fontFamily: 'Amiri, serif' }}>
          {committed}
        </span>
        <span className="text-xs text-[var(--text-muted)]">/ {target}</span>
        <span className="text-xs font-semibold text-[var(--brand-gold-deep)]">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}
