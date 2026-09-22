import { useParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StatusBadge, PriorityBadge, EmotionBadge } from '../../components/Badges';
import StatusTimeline from '../../components/StatusTimeline';
import RiskScore from '../../components/RiskScore';
import { ArrowLeft, Calendar, Hash, Layers, MessageSquare, User, Brain, AlertTriangle, Repeat, Sparkles } from 'lucide-react';

export default function CustomerTicketDetail() {
  const { id } = useParams();
  const { getTicketById } = useApp();
  const ticket = getTicketById(id);

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ticket not found</h2>
        <Link to="/customer/tickets" className="text-brand-600 hover:underline">Back to tickets</Link>
      </div>
    );
  }

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
  const analysis = ticket.aiAnalysis;

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/customer/tickets" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to tickets
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-semibold text-brand-600">{ticket.id}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-6 mb-2">
          <StatusTimeline status={ticket.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Complaint Description</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{ticket.description}</p>
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-50 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Created: {formatDate(ticket.createdAt)}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Updated: {formatDate(ticket.updatedAt)}</span>
              {ticket.orderId && <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> Order: {ticket.orderId}</span>}
            </div>
          </div>

          {/* Agent Response */}
          {ticket.agentResponse && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-500" /> Support Agent Response
              </h2>
              <div className="bg-brand-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-brand-200 flex items-center justify-center text-[10px] font-bold text-brand-700">
                    {ticket.assignedAgent?.split(' ').map(n => n[0]).join('') || 'SA'}
                  </div>
                  <span className="text-xs font-medium text-brand-700">{ticket.assignedAgent || 'Support Agent'}</span>
                </div>
                <p className="text-sm text-gray-700">{ticket.agentResponse}</p>
              </div>
            </div>
          )}

          {/* Resolution */}
          {ticket.resolution && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
              <h2 className="text-sm font-semibold text-emerald-800 mb-2">✅ Resolution</h2>
              <p className="text-sm text-emerald-700">{ticket.resolution}</p>
            </div>
          )}

          {!ticket.resolution && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <h2 className="text-sm font-semibold text-amber-800 mb-2">⏳ Pending Resolution</h2>
              <p className="text-sm text-amber-700">Your complaint is currently being handled by our support team.</p>
            </div>
          )}
        </div>

        {/* Right - AI Analysis */}
        <div className="space-y-6">
          {analysis && (
            <>
              {/* Risk Score */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-brand-500" /> AI Risk Score
                </h2>
                <RiskScore score={analysis.riskScore.total} size="md" />
              </div>

              {/* AI Details */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card space-y-3">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-500" /> AI Analysis
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium">{analysis.category}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Priority</span><PriorityBadge priority={analysis.priority} /></div>
                  <div className="flex justify-between"><span className="text-gray-500">Emotion</span><EmotionBadge emotion={analysis.emotion} /></div>
                  <div className="flex justify-between"><span className="text-gray-500">Impact</span><span className={`font-medium ${analysis.businessImpact === 'High' ? 'text-red-600' : analysis.businessImpact === 'Medium' ? 'text-orange-600' : 'text-green-600'}`}>{analysis.businessImpact}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Repeat</span><span className={`font-medium ${analysis.isRepeat ? 'text-red-600' : 'text-green-600'}`}>{analysis.isRepeat ? '⚠ Yes' : 'No'}</span></div>
                </div>
              </div>

              {/* Repeat Info */}
              {analysis.isRepeat && (
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Repeat className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">Repeat Complaint</span>
                  </div>
                  <p className="text-xs text-amber-700 mb-2">{analysis.relatedTickets.length} related complaint(s) detected</p>
                  <div className="space-y-1">
                    {analysis.relatedTickets.map(t => (
                      <div key={t.id} className="text-xs text-amber-600">• {t.id} – {t.subject}</div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
