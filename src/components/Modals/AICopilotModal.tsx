import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  X,
  Loader2,
  Copy,
  Check,
  MessageSquare,
  Send,
  FileText,
  User,
  Bot,
} from 'lucide-react';
import { AIAnalysisResult, StockPosition, MarketIndex } from '../../types';
import { playClickSound } from '../../utils/audio';
import { apiRunAIChat } from '../../utils/apiClient';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

interface AICopilotModalProps {
  isOpen: boolean;
  isLoading: boolean;
  analysis: AIAnalysisResult | null;
  error: string | null;
  portfolio: StockPosition[];
  totalValue: number;
  totalProfit: number;
  totalROI: number;
  indices: MarketIndex[];
  onClose: () => void;
  onReanalyze: () => void;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  isOpen,
  isLoading,
  analysis,
  error,
  portfolio,
  totalValue,
  totalProfit,
  totalROI,
  indices,
  onClose,
  onReanalyze,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'chat'>('report');
  const [copied, setCopied] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: '您好！我是您的 Gemini AI 戰情操盤顧問。我可以針對您目前的持股組合、台美股個股走勢、避險防禦策略或股息再投資進行即時分析解答。請問今天想了解什麼呢？',
      time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  if (!isOpen) return null;

  const getRiskBadgeColor = (rating?: string) => {
    switch (rating) {
      case '低風險':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case '中等風險':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case '高風險':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case '極高風險':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  const handleCopyReport = () => {
    if (!analysis) return;
    const text = `【Gemini AI 資產戰情報告】\n時間：${analysis.timestamp}\n風控評級：${
      analysis.riskRating
    }\n總評：${analysis.summary}\n配置講評：${analysis.allocationComment}\n操盤建議：${
      analysis.actionAdvice
    }`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMsg).trim();
    if (!text || isSending) return;

    playClickSound();
    const userMsgObj: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsgObj]);
    if (!textToSend) setInputMsg('');
    setIsSending(true);

    try {
      const reply = await apiRunAIChat({
        message: text,
        history: chatMessages.map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          content: m.text,
        })),
        portfolio,
        totalValue,
        totalProfit,
        totalROI,
        indices,
      });

      const aiMsgObj: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, aiMsgObj]);
    } catch {
      const errorMsgObj: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: '非常抱歉，連線分析超時。請稍後再試或點擊「重新診斷」。',
        time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsgObj]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    '💡 分析我持股中風險最高的標的',
    '🚀 台積電與美股科技股下週操作建議',
    '🛡️ 若大盤拉回，我的組合防禦力如何？',
    '💰 如何最佳化未來的股息與現金流配置？',
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="glass-card rounded-t-3xl sm:rounded-3xl p-5 md:p-8 w-full max-w-2xl shadow-[0_0_50px_rgba(168,85,247,0.25)] space-y-4 max-h-[92vh] sm:max-h-[88vh] overflow-y-auto border border-purple-500/30 animate-in slide-in-from-bottom duration-300 flex flex-col">
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto sm:hidden mb-1 shrink-0" />

        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
                AI 戰情操盤顧問 (Gemini Copilot)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                全盤持股診斷 ｜ 即時一對一對問諮詢
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 p-2 rounded-full transition btn-interact shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('report');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'report'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> 📊 全盤戰情報告
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('chat');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> 💬 即時問答諮詢
            {chatMessages.length > 1 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>
        </div>

        {/* Tab 1: Diagnostic Report */}
        {activeTab === 'report' && (
          <div className="space-y-4">
            {/* Loading state */}
            {isLoading && (
              <div className="py-12 sm:py-16 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                <div className="text-slate-300 text-sm font-semibold tracking-wide animate-pulse text-center">
                  Gemini AI 正在分析你的資產組合與市場指標...
                </div>
                <p className="text-xs text-slate-500 text-center">計算台美股集中度、產業分佈與短中線風險點</p>
              </div>
            )}

            {/* Error state */}
            {!isLoading && error && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-2xl text-rose-300 text-sm space-y-3">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <AlertTriangle className="w-5 h-5" /> 分析產生失敗
                </div>
                <p className="text-xs leading-relaxed">{error}</p>
                <button
                  onClick={onReanalyze}
                  className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-xl text-xs transition"
                >
                  重新重試
                </button>
              </div>
            )}

            {/* Content state */}
            {!isLoading && !error && analysis && (
              <div className="space-y-4 text-xs sm:text-sm">
                {/* Header Rating */}
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block">診斷分析時間</span>
                    <span className="text-xs font-mono text-slate-200">{analysis.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-slate-300 font-semibold">風控評級:</span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-xl border ${getRiskBadgeColor(
                        analysis.riskRating
                      )}`}
                    >
                      {analysis.riskRating}
                    </span>
                  </div>
                </div>

                {/* Overall Summary */}
                <div className="bg-purple-900/15 border border-purple-500/30 p-4 rounded-2xl space-y-1.5">
                  <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" /> 總評摘要
                  </div>
                  <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-medium">
                    {analysis.summary}
                  </p>
                </div>

                {/* Asset Allocation Comment */}
                <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl space-y-1.5">
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> 持股佈局與配置講評
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{analysis.allocationComment}</p>
                </div>

                {/* Grid: Opportunities & Warnings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-3.5 rounded-2xl space-y-1.5">
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" /> 潛力亮點與利多
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {analysis.topOpportunities?.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-500/5 border border-rose-500/20 p-3.5 rounded-2xl space-y-1.5">
                    <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> 風控提醒與觀測點
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {analysis.riskWarnings?.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Advice */}
                <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 p-4 rounded-2xl space-y-1.5">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-400" /> 操盤策略具體建議
                  </div>
                  <p className="text-amber-100 text-xs leading-relaxed">{analysis.actionAdvice}</p>
                </div>

                {/* Actions Row */}
                <div className="pt-2 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={onReanalyze}
                      className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 btn-interact"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> 重新診斷
                    </button>
                    <button
                      onClick={handleCopyReport}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 btn-interact"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? '已複製' : '複製報告'}
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveTab('chat')}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition btn-interact flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> 對 AI 提出問題 ➔
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Interactive Real-time Q&A Chat */}
        {activeTab === 'chat' && (
          <div className="flex flex-col space-y-3 min-h-[360px] max-h-[500px]">
            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5 pb-2 border-b border-white/5 shrink-0">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp)}
                  disabled={isSending}
                  className="text-[11px] bg-slate-800/80 hover:bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-xl transition hover:border-purple-400/60 text-left disabled:opacity-50"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Chat Messages Scroll Window */}
            <div className="flex-1 overflow-y-auto space-y-3 p-1 pr-2">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 items-start ${
                    msg.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                      msg.sender === 'user'
                        ? 'bg-sky-500 text-white'
                        : 'bg-purple-600 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-sky-600 text-white rounded-tr-none'
                        : 'bg-slate-900/90 text-slate-100 border border-white/10 rounded-tl-none whitespace-pre-wrap'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="text-[9px] opacity-60 block text-right mt-1 font-mono">
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex gap-2.5 items-center text-purple-400 text-xs py-2 animate-pulse">
                  <div className="w-7 h-7 rounded-xl bg-purple-600/30 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <span>Gemini AI 思考與分析持股數據中...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2 pt-2 border-t border-white/10 shrink-0"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="對持股有疑問？即時詢問 Gemini AI..."
                disabled={isSending}
                className="flex-1 bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400 transition"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim() || isSending}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 btn-interact shrink-0"
              >
                <Send className="w-3.5 h-3.5" /> 發送
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
