import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import RiskScore from '../../components/RiskScore';
import { StatusBadge, PriorityBadge, EmotionBadge } from '../../components/Badges';
import { Brain, Sparkles, Search, ChevronRight, Target, Repeat, AlertTriangle, Zap, Shield, TrendingUp, Gauge, BarChart3, CheckCircle } from 'lucide-react';

// Animated confidence bar
function ConfidenceBar({ label, value, color, icon }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const getBarColor = (v) => {
    if (v >= 80) return 'from-emerald-400 to-emerald-500';
    if (v >= 60) return 'from-blue-400 to-blue-500';
    if (v >= 40) return 'from-amber-400 to-amber-500';
    return 'from-red-400 to-red-500';
  };

  const getTextColor = (v) => {
    if (v >= 80) return 'text-emerald-600';
    if (v >= 60) return 'text-blue-600';
    if (v >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          {icon} {label}
        </span>
        <span className={`text-sm font-bold ${getTextColor(value)}`}>{value}%</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color || getBarColor(value)} transition-all duration-1000 ease-out`}
          style={{ width: `${animated}%` }}
        />
      </div>
    </div>
  );
}

// Animated confidence ring (smaller version)
function ConfidenceRing({ score, size = 64 }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [score]);

  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animatedScore / 100) * circumference;

  const getColor = (s) => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#3b82f6';
    if (s >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getLabel = (s) => {
    if (s >= 80) return 'High';
    if (s >= 60) return 'Good';
    if (s >= 40) return 'Fair';
    return 'Low';
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} fill="none" stroke="#f3f4f6" />
          <circle
            cx={size/2} cy={size/2} r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            stroke={getColor(score)}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold" style={{ color: getColor(score) }}>{animatedScore}%</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold" style={{ color: getColor(score) }}>{getLabel(score)}</span>
    </div>
  );
}

export default function AIAnalysisPage() {
  const { tickets } = useApp();
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState(tickets[0] || null);
  const [search, setSearch] = useState('');

  const filtered = tickets.filter(t =>
    t.subject.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase())
  );

  const analysis = selectedTicket?.aiAnalysis;

  // Calculate overall model accuracy stats
  const ticketsWithConfidence = tickets.filter(t => t.aiAnalysis?.confidence);
  const avgOverall = ticketsWithConfidence.length > 0
    ? Math.round(ticketsWithConfidence.reduce((s, t) => s + t.aiAnalysis.confidence.overall, 0) / ticketsWithConfidence.length)
    : 0;
  const avgCategory = ticketsWithConfidence.length > 0
    ? Math.round(ticketsWithConfidence.reduce((s, t) => s + t.aiAnalysis.confidence.category, 0) / ticketsWithConfidence.length)
    : 0;
  const avgEmotion = ticketsWithConfidence.length > 0
    ? Math.round(ticketsWithConfidence.reduce((s, t) => s + t.aiAnalysis.confidence.emotion, 0) / ticketsWithConfidence.length)
    : 0;
  const avgPriority = ticketsWithConfidence.length > 0
    ? Math.round(ticketsWithConfidence.reduce((s, t) => s + t.aiAnalysis.confidence.priority, 0) / ticketsWithConfidence.length)
    : 0;
  const highConfCount = ticketsWithConfidence.filter(t => t.aiAnalysis.confidence.overall >= 70).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="w-6 h-6 text-brand-500" /> SmartTicket AI Analysis
        </h1>
        <p className="text-sm text-gray-500 mt-1">Deep-dive into AI predictions, confidence scores, and explainability for each ticket</p>
      </div>

      {/* Overall Model Accuracy Banner */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-5 mb-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="w-5 h-5" />
          <h2 className="font-bold text-lg">AI Model Accuracy Overview</h2>
          <span className="ml-auto text-xs opacity-80 bg-white/20 px-2 py-0.5 rounded-full">{ticketsWithConfidence.length} tickets analyzed</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
            <div className="text-3xl font-bold">{avgOverall}%</div>
            <div className="text-xs opacity-80">Overall Confidence</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
            <div className="text-3xl font-bold">{avgCategory}%</div>
            <div className="text-xs opacity-80">Category Accuracy</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
            <div className="text-3xl font-bold">{avgPriority}%</div>
            <div className="text-xs opacity-80">Priority Accuracy</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
            <div className="text-3xl font-bold">{avgEmotion}%</div>
            <div className="text-xs opacity-80">Emotion Accuracy</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
            <div className="text-3xl font-bold">{highConfCount}<span className="text-sm font-normal">/{ticketsWithConfidence.length}</span></div>
            <div className="text-xs opacity-80">High Confidence</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Ticket Selector */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card overflow-hidden">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div className="space-y-1.5 max-h-[calc(100vh-400px)] overflow-y-auto">
            {filtered.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-3 rounded-xl cursor-pointer transition-all text-sm ${
                  selectedTicket?.id === ticket.id
                    ? 'bg-gradient-to-r from-brand-50 to-cyan-50 border border-brand-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-brand-600 text-xs">{ticket.id}</span>
                  <div className="flex items-center gap-1.5">
                    {ticket.aiAnalysis?.confidence && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        ticket.aiAnalysis.confidence.overall >= 70 ? 'bg-emerald-100 text-emerald-700' :
                        ticket.aiAnalysis.confidence.overall >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {ticket.aiAnalysis.confidence.overall}%
                      </span>
                    )}
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-800 line-clamp-1">{ticket.subject}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{ticket.customerName}</span>
                  <span className={`text-xs font-bold ${(ticket.aiAnalysis?.riskScore?.total || 0) >= 81 ? 'text-red-500' : 'text-gray-500'}`}>
                    Risk: {ticket.aiAnalysis?.riskScore?.total || '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Detail */}
        {selectedTicket && analysis ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-sm font-semibold text-brand-600">{selectedTicket.id}</span>
                  <h2 className="text-lg font-bold text-gray-900 mt-1">{selectedTicket.subject}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedTicket.customerName}</p>
                </div>
                <button onClick={() => navigate(`/company/ticket/${selectedTicket.id}`)} className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 text-xs font-medium hover:bg-brand-100 flex items-center gap-1">
                  View Full <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">{selectedTicket.description}</div>
            </div>

            {/* AI Confidence Card */}
            {analysis.confidence && (
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6 shadow-card">
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-indigo-500" /> AI Prediction Confidence
                </h3>
                <div className="grid sm:grid-cols-4 gap-4 items-center">
                  <div className="flex justify-center">
                    <ConfidenceRing score={analysis.confidence.overall} size={90} />
                  </div>
                  <div className="sm:col-span-3 space-y-3">
                    <ConfidenceBar
                      label="Category Detection"
                      value={analysis.confidence.category}
                      icon={<BarChart3 className="w-3 h-3" />}
                    />
                    <ConfidenceBar
                      label="Priority Assignment"
                      value={analysis.confidence.priority}
                      icon={<AlertTriangle className="w-3 h-3" />}
                    />
                    <ConfidenceBar
                      label="Emotion Detection"
                      value={analysis.confidence.emotion}
                      icon={<TrendingUp className="w-3 h-3" />}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AI Analysis Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card text-center">
                <RiskScore score={analysis.riskScore.total} size="md" showBreakdown breakdown={analysis.riskScore} />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Brain className="w-4 h-4 text-brand-500" /> Classification</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Category</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium px-2 py-0.5 rounded-md bg-gray-100">{analysis.category}</span>
                      {analysis.confidence && <span className="text-[10px] font-bold text-indigo-500">{analysis.confidence.category}%</span>}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Priority</span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={analysis.priority} />
                      {analysis.confidence && <span className="text-[10px] font-bold text-indigo-500">{analysis.confidence.priority}%</span>}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Emotion</span>
                    <div className="flex items-center gap-1.5">
                      <EmotionBadge emotion={analysis.emotion} />
                      {analysis.confidence && <span className="text-[10px] font-bold text-indigo-500">{analysis.confidence.emotion}%</span>}
                    </div>
                  </div>
                  <div className="flex justify-between"><span className="text-gray-500">Impact</span><span className={`font-semibold ${analysis.businessImpact === 'High' ? 'text-red-600' : 'text-green-600'}`}>{analysis.businessImpact}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Repeat</span><span className={analysis.isRepeat ? 'text-red-600 font-semibold' : 'text-green-600'}>{analysis.isRepeat ? '⚠ Yes' : '✓ No'}</span></div>
                </div>
              </div>
            </div>

            {/* Explainable AI */}
            <div className="bg-gradient-to-br from-brand-50 to-cyan-50 rounded-2xl border border-brand-100 p-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" /> Why did AI classify this ticket this way?
              </h3>
              <p className="text-sm text-gray-600 mb-4">Highlighted words from the customer complaint that influenced the AI prediction:</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {analysis.keywords.map((kw, i) => (
                  <div key={i} className="group relative">
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border-2 border-brand-200 text-brand-700 text-xs font-bold uppercase shadow-sm hover:shadow-md hover:border-brand-400 transition-all cursor-help">
                      {kw.word}
                    </span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs max-w-[220px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="font-semibold mb-0.5">"{kw.word}"</div>
                      {kw.reason}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 border border-brand-100">
                  <div className="text-xs text-gray-500 mb-1">Root Cause Clue</div>
                  <div className="text-sm font-medium text-gray-800">{analysis.rootCause}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-brand-100">
                  <div className="text-xs text-gray-500 mb-1">Recommended Action</div>
                  <div className="text-sm font-medium text-gray-800">{analysis.recommendedAction}</div>
                </div>
              </div>
            </div>

            {/* Repeat + Similar */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className={`rounded-2xl border p-5 ${analysis.isRepeat ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2" style={{ color: analysis.isRepeat ? '#92400e' : '#166534' }}>
                  <Repeat className="w-4 h-4" /> Repeat Complaint Detection
                </h3>
                {analysis.isRepeat ? (
                  <>
                    <p className="text-xs text-amber-700 mb-2">{analysis.relatedTickets.length} related complaint(s) detected</p>
                    {analysis.relatedTickets.map(t => (
                      <div key={t.id} className="text-xs text-amber-600 py-0.5">• {t.id} – {t.subject}</div>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-green-700">✓ No previous related complaint detected.</p>
                )}
              </div>

              <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
                <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4" /> Similar Ticket Detection
                </h3>
                <div className="text-3xl font-bold text-blue-700 mb-1">{analysis.similarTicketCount}</div>
                <p className="text-xs text-blue-600">similar tickets from different customers</p>
                {analysis.similarTicketCount >= 3 && (
                  <div className="mt-3 bg-white rounded-lg p-2 text-xs border border-blue-100">
                    <span className="font-semibold text-blue-700">Possible Mass Issue</span>
                    <div className="text-blue-600">{analysis.rootCause}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Action */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-6 text-white">
              <h3 className="font-semibold flex items-center gap-2 mb-2"><Zap className="w-4 h-4" /> AI Recommended Action</h3>
              <p className="text-sm opacity-95">{analysis.recommendedAction}</p>
              <p className="text-xs opacity-70 mt-2">Recommended Team: {analysis.recommendedTeam}</p>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center bg-white rounded-2xl border border-gray-100 p-12 shadow-card">
            <div className="text-center">
              <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500">Select a ticket to view AI analysis</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
