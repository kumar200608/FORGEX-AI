import { useApp } from '../../context/AppContext';
import DashboardCard from '../../components/DashboardCard';
import TicketCard from '../../components/TicketCard';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, AlertTriangle, CheckCircle, Repeat, Zap, ArrowRight, TrendingUp, Brain } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#7c3aed', '#06b6d4', '#ec4899', '#f97316', '#10b981', '#ef4444'];

export default function CompanyDashboard() {
  const { tickets, stats, emergencyAlerts, massIssues } = useApp();
  const navigate = useNavigate();

  const categoryData = {};
  tickets.forEach(t => {
    const cat = t.category || 'Other';
    categoryData[cat] = (categoryData[cat] || 0) + 1;
  });
  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time overview of customer support operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <DashboardCard icon={<FileText className="w-5 h-5" />} title="Total Tickets" value={stats.total.toLocaleString()} gradient="linear-gradient(135deg, #7c3aed, #6d28d9)" onClick={() => navigate('/company/tickets')} />
        <DashboardCard icon={<Clock className="w-5 h-5" />} title="Open" value={stats.open} gradient="linear-gradient(135deg, #3b82f6, #2563eb)" onClick={() => navigate('/company/tickets')} />
        <DashboardCard icon={<AlertTriangle className="w-5 h-5" />} title="Critical" value={stats.critical} gradient="linear-gradient(135deg, #ef4444, #dc2626)" onClick={() => navigate('/company/tickets')} />
        <DashboardCard icon={<CheckCircle className="w-5 h-5" />} title="Resolved" value={stats.resolved} gradient="linear-gradient(135deg, #10b981, #059669)" />
        <DashboardCard icon={<Repeat className="w-5 h-5" />} title="Repeat" value={stats.repeatComplaints} gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
        <DashboardCard icon={<Zap className="w-5 h-5" />} title="Emergencies" value={stats.emergencies} gradient="linear-gradient(135deg, #ef4444, #be123c)" onClick={() => navigate('/company/alerts')} />
      </div>

      {/* Emergency Alerts Banner */}
      {emergencyAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-5 mb-8 text-white pulse-glow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">🚨 {emergencyAlerts.length} Critical Alert{emergencyAlerts.length > 1 ? 's' : ''}</h3>
                <p className="text-sm opacity-90">{emergencyAlerts.length} ticket{emergencyAlerts.length > 1 ? 's' : ''} with risk score above 80 requiring immediate attention</p>
              </div>
            </div>
            <button onClick={() => navigate('/company/alerts')} className="px-4 py-2 rounded-xl bg-white text-red-600 text-sm font-semibold hover:bg-red-50 transition-all flex items-center gap-2">
              View Alerts <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Category Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Tickets by Category</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        {/* Mass Issues */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-brand-500" /> Possible Mass Issues
          </h2>
          {massIssues.length === 0 ? (
            <p className="text-sm text-gray-500">No mass issues detected.</p>
          ) : (
            <div className="space-y-3">
              {massIssues.map(issue => (
                <div key={issue.category} className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <div className="font-semibold text-red-800 text-sm mb-1">{issue.category}</div>
                  <div className="text-xs text-red-600 space-y-0.5">
                    <div>{issue.ticketCount} related tickets</div>
                    <div>{issue.criticalCount} critical</div>
                    <div>Avg Risk: {issue.avgRisk}/100</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-500" /> Quick Stats
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Avg Risk Score', value: Math.round(tickets.reduce((s, t) => s + (t.aiAnalysis?.riskScore?.total || 0), 0) / tickets.length), suffix: '/100' },
              { label: 'Escalated', value: stats.escalated },
              { label: 'In Progress', value: stats.inProgress },
              { label: 'Resolution Rate', value: `${Math.round((stats.resolved / stats.total) * 100)}%` },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{s.label}</span>
                <span className="text-sm font-bold text-gray-900">{s.value}{s.suffix || ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
          <button onClick={() => navigate('/company/tickets')} className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {recentTickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} showCustomer onClick={() => navigate(`/company/ticket/${ticket.id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}
