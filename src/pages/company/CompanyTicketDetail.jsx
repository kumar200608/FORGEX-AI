import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge, PriorityBadge, EmotionBadge } from '../../components/Badges';
import StatusTimeline from '../../components/StatusTimeline';
import RiskScore from '../../components/RiskScore';
import { ArrowLeft, User, Calendar, Hash, MessageSquare, Brain, Sparkles, AlertTriangle, Repeat, Target, Shield, ChevronRight, Send, CheckCircle, XCircle, ArrowUpCircle, Layers, Zap } from 'lucide-react';

export default function CompanyTicketDetail() {
  const { id } = useParams();
  const { getTicketById, updateTicket, addToast, tickets } = useApp();
  const navigate = useNavigate();
  const ticket = getTicketById(id);

  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolution, setResolution] = useState('');
  const [responseText, setResponseText] = useState('');
  const [showResponseForm, setShowResponseForm] = useState(false);

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ticket not found</h2>
        <Link to="/company/tickets" className="text-brand-600 hover:underline">Back to tickets</Link>
      </div>
    );
  }

  const analysis = ticket.aiAnalysis;
  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  const handleResolve = () => {
    updateTicket(ticket.id, { status: 'Resolved', resolution });
    addToast(`Ticket ${ticket.id} resolved successfully!`, 'success');
    setShowResolveForm(false);
  };

  const handleAddResponse = () => {
    updateTicket(ticket.id, { agentResponse: responseText, status: ticket.status === 'Open' ? 'In Progress' : ticket.status });
    addToast('Response added successfully!', 'success');
    setShowResponseForm(false);
    setResponseText('');
  };

  const handleStatusChange = (newStatus) => {
    updateTicket(ticket.id, { status: newStatus });
    addToast(`Ticket status changed to ${newStatus}`, 'success');
  };

  return (
    <div>
      <Link to="/company/tickets" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to tickets
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-semibold text-brand-600">{ticket.id}</span>
              {analysis?.isRepeat && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">⚠ Repeat</span>}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {analysis?.emotion && <EmotionBadge emotion={analysis.emotion} />}
          </div>
        </div>
        <StatusTimeline status={ticket.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-500" /> Customer Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Name:</span> <span className="font-medium ml-1">{ticket.customerName}</span></div>
              <div><span className="text-gray-500">Customer ID:</span> <span className="font-medium ml-1">{ticket.customerId}</span></div>
              <div><span className="text-gray-500">Created:</span> <span className="font-medium ml-1">{formatDate(ticket.createdAt)}</span></div>
              <div><span className="text-gray-500">Updated:</span> <span className="font-medium ml-1">{formatDate(ticket.updatedAt)}</span></div>
              {ticket.orderId && <div><span className="text-gray-500">Order ID:</span> <span className="font-medium ml-1">{ticket.orderId}</span></div>}
              <div><span className="text-gray-500">Contact:</span> <span className="font-medium ml-1 capitalize">{ticket.contactMethod}</span></div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Complaint Description</h2>
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">{ticket.description}</p>
          </div>

          {/* Explainable AI */}
          {analysis && (
            <div className="bg-gradient-to-br from-brand-50 to-cyan-50 rounded-2xl border border-brand-100 p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" /> Explainable AI – Why did AI classify this ticket this way?
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {analysis.keywords.map((kw, i) => (
                  <div key={i} className="group relative">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-brand-200 text-brand-700 text-xs font-semibold uppercase shadow-sm hover:shadow-md transition-all cursor-help">
                      {kw.word}
                    </span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                      {kw.reason}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-xl p-3 border border-brand-100">
                  <span className="text-gray-500 text-xs">Root Cause Clue</span>
                  <div className="font-medium text-gray-800 mt-1">{analysis.rootCause}</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-brand-100">
                  <span className="text-gray-500 text-xs">Recommended Action</span>
                  <div className="font-medium text-gray-800 mt-1">{analysis.recommendedAction}</div>
                </div>
              </div>
            </div>
          )}

          {/* Agent Response */}
          {ticket.agentResponse && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-500" /> Agent Response
              </h2>
              <div className="bg-brand-50 rounded-xl p-4">
                <p className="text-sm text-gray-700">{ticket.agentResponse}</p>
                {ticket.assignedAgent && <div className="text-xs text-brand-600 mt-2">— {ticket.assignedAgent}</div>}
              </div>
            </div>
          )}

          {/* Resolution */}
          {ticket.resolution && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
              <h2 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Resolution
              </h2>
              <p className="text-sm text-emerald-700">{ticket.resolution}</p>
            </div>
          )}

          {/* Action Buttons */}
          {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setShowResponseForm(!showResponseForm)} className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 flex items-center gap-2 transition-all">
                  <Send className="w-4 h-4" /> Respond
                </button>
                <button onClick={() => handleStatusChange('In Progress')} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 flex items-center gap-2 transition-all">
                  <Layers className="w-4 h-4" /> Mark In Progress
                </button>
                <button onClick={() => handleStatusChange('Escalated')} className="px-4 py-2 rounded-xl bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 flex items-center gap-2 transition-all">
                  <ArrowUpCircle className="w-4 h-4" /> Escalate
                </button>
                <button onClick={() => setShowResolveForm(!showResolveForm)} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 flex items-center gap-2 transition-all">
                  <CheckCircle className="w-4 h-4" /> Resolve
                </button>
                <button onClick={() => handleStatusChange('Closed')} className="px-4 py-2 rounded-xl bg-gray-400 text-white text-sm font-semibold hover:bg-gray-500 flex items-center gap-2 transition-all">
                  <XCircle className="w-4 h-4" /> Close
                </button>
              </div>

              {showResponseForm && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-slide-up">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Response to Customer</label>
                  <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" placeholder="Type your response..." />
                  <button onClick={handleAddResponse} disabled={!responseText} className="mt-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    Send Response
                  </button>
                </div>
              )}

              {showResolveForm && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-slide-up">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Resolution Message</label>
                  <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" placeholder="Describe how the issue was resolved..." />
                  <button onClick={handleResolve} disabled={!resolution} className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    Resolve Ticket
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - AI Sidebar */}
        <div className="space-y-6">
          {analysis && (
            <>
              {/* Risk Score */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-500" /> Risk Score
                </h2>
                <RiskScore score={analysis.riskScore.total} size="md" showBreakdown breakdown={analysis.riskScore} />
              </div>

              {/* AI Analysis Summary */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-brand-500" /> AI Analysis
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center"><span className="text-gray-500">Category</span><span className="font-medium px-2 py-0.5 rounded-md bg-gray-100">{analysis.category}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500">Priority</span><PriorityBadge priority={analysis.priority} /></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500">Emotion</span><EmotionBadge emotion={analysis.emotion} /></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500">Business Impact</span><span className={`font-semibold ${analysis.businessImpact === 'High' ? 'text-red-600' : analysis.businessImpact === 'Medium' ? 'text-orange-600' : 'text-green-600'}`}>{analysis.businessImpact}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500">Repeat</span><span className={`font-semibold ${analysis.isRepeat ? 'text-red-600' : 'text-green-600'}`}>{analysis.isRepeat ? '⚠ Yes' : '✓ No'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500">Team</span><span className="font-medium text-xs">{analysis.recommendedTeam}</span></div>
                </div>
              </div>

              {/* Repeat Complaint */}
              {analysis.isRepeat && (
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
                  <h2 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <Repeat className="w-4 h-4" /> Repeat Complaint Detection
                  </h2>
                  <p className="text-xs text-amber-700 mb-3">{analysis.relatedTickets.length} related complaint(s) from this customer</p>
                  <div className="space-y-2">
                    {analysis.relatedTickets.map(t => (
                      <div key={t.id} className="bg-white rounded-lg p-2 text-xs border border-amber-100 cursor-pointer hover:bg-amber-50" onClick={() => navigate(`/company/ticket/${t.id}`)}>
                        <span className="font-semibold text-amber-700">{t.id}</span> – {t.subject}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <span className="text-xs font-semibold text-amber-800">Possible Common Issue:</span>
                    <div className="text-xs text-amber-700 mt-1">{analysis.rootCause}</div>
                  </div>
                </div>
              )}

              {/* Similar Tickets */}
              {analysis.similarTicketCount > 0 && (
                <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
                  <h2 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Similar Ticket Detection
                  </h2>
                  <div className="text-2xl font-bold text-blue-700 mb-1">{analysis.similarTicketCount}</div>
                  <p className="text-xs text-blue-600 mb-3">similar tickets detected across all customers</p>
                  {analysis.similarTicketCount >= 5 && (
                    <div className="bg-white rounded-lg p-3 border border-blue-100 text-xs">
                      <span className="font-semibold text-blue-700">⚡ Possible Mass Issue Detected</span>
                      <div className="text-blue-600 mt-1">Affected system: {analysis.rootCause}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Recommended Action */}
              <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-5 text-white">
                <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Recommended Action
                </h2>
                <p className="text-sm opacity-95">{analysis.recommendedAction}</p>
                <div className="mt-3 pt-3 border-t border-white/20 text-xs opacity-80">
                  Assign to: {analysis.recommendedTeam}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
