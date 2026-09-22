import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import RiskScore from '../../components/RiskScore';
import { PriorityBadge } from '../../components/Badges';
import { AlertTriangle, Eye, Users, ArrowUpCircle, Zap, ShieldAlert, TrendingUp } from 'lucide-react';

export default function EmergencyAlerts() {
  const { emergencyAlerts, massIssues, tickets } = useApp();
  const navigate = useNavigate();

  const criticalTickets = tickets.filter(t =>
    t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed'
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-500" /> Emergency Alerts
        </h1>
        <p className="text-sm text-gray-500 mt-1">Critical issues requiring immediate attention</p>
      </div>

      {/* Mass Issue Alerts */}
      {massIssues.length > 0 && (
        <div className="space-y-4 mb-8">
          {massIssues.map(issue => (
            <div key={issue.category} className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-6 text-white pulse-glow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">🚨 {issue.category.toUpperCase()} SYSTEM ALERT</h3>
                    <p className="text-sm opacity-90 mt-1">
                      {issue.ticketCount} customers are reporting {issue.category.toLowerCase()} related issues.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      <div>
                        <span className="opacity-70">Risk Score:</span>
                        <span className="font-bold ml-1">{issue.avgRisk}/100</span>
                      </div>
                      <div>
                        <span className="opacity-70">Affected:</span>
                        <span className="font-bold ml-1">{issue.ticketCount} tickets</span>
                      </div>
                      <div>
                        <span className="opacity-70">Critical:</span>
                        <span className="font-bold ml-1">{issue.criticalCount}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs opacity-70">
                      Recommended: Investigate {issue.category} system immediately.
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => navigate('/company/tickets')} className="px-4 py-2 rounded-xl bg-white text-red-600 text-sm font-semibold hover:bg-red-50 flex items-center gap-2 transition-all">
                    <Eye className="w-4 h-4" /> View Tickets
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold hover:bg-white/30 flex items-center gap-2 transition-all">
                    <Users className="w-4 h-4" /> Assign Team
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold hover:bg-white/30 flex items-center gap-2 transition-all">
                    <ArrowUpCircle className="w-4 h-4" /> Escalate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Individual Critical Alerts */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-red-500" /> High-Risk Tickets ({emergencyAlerts.length})
      </h2>

      {emergencyAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-card">
          <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No emergency alerts</h3>
          <p className="text-sm text-gray-400 mt-1">All tickets are within normal risk levels</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {emergencyAlerts.map(alert => {
            const ticket = alert.ticket;
            const analysis = ticket.aiAnalysis;
            return (
              <div key={ticket.id} className="bg-white rounded-2xl border border-red-100 p-5 shadow-card card-interactive cursor-pointer" onClick={() => navigate(`/company/ticket/${ticket.id}`)}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-brand-600">{ticket.id}</span>
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">{ticket.subject}</h3>
                <div className="text-xs text-gray-500 mb-3">{ticket.customerName}</div>

                <div className="flex items-center justify-between mb-3">
                  <RiskScore score={analysis?.riskScore?.total || 0} size="sm" />
                  <div className="text-right text-xs space-y-1">
                    <div className="text-gray-500">Emotion: <span className="font-medium">{analysis?.emotion}</span></div>
                    <div className="text-gray-500">Impact: <span className={`font-semibold ${analysis?.businessImpact === 'High' ? 'text-red-600' : 'text-gray-700'}`}>{analysis?.businessImpact}</span></div>
                    {analysis?.isRepeat && <div className="text-amber-600 font-medium">⚠ Repeat</div>}
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-2 text-xs text-red-700">
                  <span className="font-semibold">Action: </span>{analysis?.recommendedAction}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
