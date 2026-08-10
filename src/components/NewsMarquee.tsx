import React from 'react';
import { Radio, MousePointer2 } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsMarqueeProps {
  news: NewsItem[];
  lastNewsTime: string;
}

export const NewsMarquee: React.FC<NewsMarqueeProps> = ({ news, lastNewsTime }) => {
  const displayNews = news.length > 0 ? [...news, ...news] : [];

  return (
    <div className="glass-card p-5 md:p-6 rounded-3xl space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 tracking-wide">
          <Radio className="w-5 h-5 text-rose-500 animate-pulse" /> 雅虎財經即時頭條
          <span className="text-[10px] text-slate-500 font-mono ml-2 border-l border-white/10 pl-3 tabular-nums">
            {lastNewsTime}
          </span>
        </h3>
        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase tracking-widest">
          <MousePointer2 className="w-3 h-3 text-sky-400" /> Click to read
        </span>
      </div>

      <div className="overflow-hidden whitespace-nowrap relative bg-black/40 py-3.5 px-4 rounded-xl border border-white/5 pointer-events-auto shadow-inner">
        <div className="inline-flex gap-10 animate-marquee text-sm text-slate-100 font-medium">
          {displayNews.length > 0 ? (
            displayNews.map((n, idx) => (
              <a
                key={idx}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto cursor-pointer hover:text-sky-400 transition inline-flex items-center gap-2 group"
              >
                <span className="bg-sky-500/10 text-sky-400 px-2 py-1 rounded text-[10px] font-bold tracking-widest border border-sky-500/20">
                  Yahoo 財經
                </span>
                <span className="group-hover:text-white transition">{n.title}</span>
                <span className="text-white/10 mx-3">|</span>
              </a>
            ))
          ) : (
            <span className="text-slate-400 flex items-center gap-2">
              即時財經新聞連線中...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
