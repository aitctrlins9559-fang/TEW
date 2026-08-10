import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatMoney } from '../../utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AssetTrendChartProps {
  labels: string[];
  data: number[];
  currentVal: number;
  isPrivacy: boolean;
  isRedUp: boolean;
}

export const AssetTrendChart: React.FC<AssetTrendChartProps> = ({
  labels,
  data,
  currentVal,
  isPrivacy,
  isRedUp,
}) => {
  const isTrendUp = data.length > 0 ? data[data.length - 1] >= data[0] : true;
  const trendColorHex = isTrendUp
    ? isRedUp
      ? '244,63,94'
      : '52,211,153'
    : isRedUp
    ? '52,211,153'
    : '244,63,94';
  const trendColorRgb = isTrendUp
    ? isRedUp
      ? '#f43f5e'
      : '#34d399'
    : isRedUp
    ? '#34d399'
    : '#f43f5e';

  const startVal = data.length > 0 ? data[0] : 0;
  const endVal = data.length > 0 ? data[data.length - 1] : 0;
  const diff = endVal - startVal;
  const diffPct = startVal > 0 ? (diff / startVal) * 100 : 0;

  const chartData = useMemo(() => {
    return {
      labels,
      datasets: [
        {
          data,
          borderColor: trendColorRgb,
          borderWidth: 2.5,
          fill: true,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHitRadius: 30,
          pointBackgroundColor: '#0B1120',
          pointBorderWidth: 2.5,
          pointHoverBackgroundColor: trendColorRgb,
          pointHoverBorderColor: '#ffffff',
          backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { bottom: number; top: number } } }) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return `rgba(${trendColorHex}, 0.1)`;
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, `rgba(${trendColorHex}, 0.00)`);
            gradient.addColorStop(1, `rgba(${trendColorHex}, 0.35)`);
            return gradient;
          },
        },
      ],
    };
  }, [labels, data, trendColorRgb, trendColorHex]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, axis: 'x' as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#38bdf8',
          bodyColor: '#f8fafc',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: (items: Array<{ label: string }>) => `時間: ${items[0]?.label || ''}`,
            label: (item: { raw: unknown; dataIndex: number; dataset: { data: unknown[] } }) => {
              if (isPrivacy) return [`總市值: **** NT$`, `較前日: ****`];
              const val = Number(item.raw) || 0;
              const prev = item.dataIndex > 0 ? Number(item.dataset.data[item.dataIndex - 1]) : val;
              const d = val - prev;
              return [
                `總市值: $${Math.round(val).toLocaleString()} NT$`,
                `較前日: ${d >= 0 ? '+' : '-'}$${Math.abs(Math.round(d)).toLocaleString()}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.02)' },
          ticks: { color: '#64748b', font: { size: 11, family: 'monospace' }, maxTicksLimit: 8, maxRotation: 0, padding: 10 },
        },
        y: {
          position: 'right' as const,
          grid: { color: 'rgba(255,255,255,0.05)', borderDash: [5, 5] },
          ticks: {
            color: '#64748b',
            font: { size: 11, family: 'monospace' },
            padding: 15,
            callback: (value: string | number) => (isPrivacy ? '****' : `${(Number(value) / 10000).toFixed(0)} 萬`),
          },
        },
      },
    };
  }, [isPrivacy]);

  return (
    <div className="lg:col-span-3 glass-card p-5 md:p-6 rounded-3xl space-y-4 border border-white/10 shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="text-[10px] text-sky-400 font-bold tracking-widest uppercase mb-0.5">
            TOTAL ASSET TREND
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
            全資產總市值走勢
          </h2>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mb-0.5">
            目前總市值 (NT$)
          </div>
          <div className="flex flex-col sm:items-end gap-1">
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-white font-mono tabular-nums leading-none tracking-tight">
              {formatMoney(currentVal, isPrivacy)}
            </span>
            <span
              className={`text-xs font-bold font-mono px-2 py-0.5 rounded border tabular-nums mt-0.5 inline-block ${
                diff >= 0
                  ? (isRedUp ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20')
                  : (isRedUp ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20')
              }`}
            >
              {isPrivacy
                ? '--'
                : `${diff >= 0 ? '+' : ''}$${Math.abs(Math.round(diff)).toLocaleString()} (${diff >= 0 ? '+' : ''}${diffPct.toFixed(2)}%)`}
            </span>
          </div>
        </div>
      </div>

      <div className="h-[320px] relative w-full pt-1">
        <Line data={chartData} options={options} />
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-wider font-mono border-t border-white/5 pt-2">
        <span>起始: {labels.length > 0 ? labels[0].replace(' (現價)', '') : '--'}</span>
        <span>資料以新台幣估算</span>
        <span>最新: {labels.length > 0 ? labels[labels.length - 1].replace(' (現價)', '') : '--'}</span>
      </div>
    </div>
  );
};
