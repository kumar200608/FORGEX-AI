import { useApp } from '../../context/AppContext';
import { BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from 'recharts';

const COLORS = ['#7c3aed', '#06b6d4', '#ec4899', '#f97316', '#10b981', '#ef4444', '#3b82f6', '#eab308'];
const PRIO_COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#10b981' };
const STATUS_COLORS = { Open: '#3b82f6', 'In Progress': '#f59e0b', Escalated: '#8b5cf6', Resolved: '#10b981', Closed: '#6b7280' };

export default function AnalyticsPage() {
  const { tickets } = useApp();

  // Category data
  const categoryData = {};
  tickets.forEach(t => { const c = t.category || 'Other'; categoryData[c] = (categoryData[c] || 0) + 1; });
  const catChartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  // Priority data
  const prioData = {};
  tickets.forEach(t => { const p = t.priority || 'Medium'; prioData[p] = (prioData[p] || 0) + 1; });
  const prioChartData = Object.entries(prioData).map(([name, value]) => ({ name, value }));

  // Status data
  const statusData = {};
  tickets.forEach(t => { statusData[t.status] = (statusData[t.status] || 0) + 1; });
  const statusChartData = Object.entries(statusData).map(([name, value]) => ({ name, value }));

  // Risk distribution
  const riskBuckets = { 'Low (0-30)': 0, 'Medium (31-60)': 0, 'High (61-80)': 0, 'Critical (81-100)': 0 };
  tickets.forEach(t => {
    const r = t.aiAnalysis?.riskScore?.total || 0;
    if (r <= 30) riskBuckets['Low (0-30)']++;
    else if (r <= 60) riskBuckets['Medium (31-60)']++;
    else if (r <= 80) riskBuckets['High (61-80)']++;
    else riskBuckets['Critical (81-100)']++;
  });
  const riskChartData = Object.entries(riskBuckets).map(([name, value]) => ({ name, value }));

  // Emotion data
  const emotionData = {};
  tickets.forEach(t => { const e = t.aiAnalysis?.emotion || 'Neutral'; emotionData[e] = (emotionData[e] || 0) + 1; });
  const emotionChartData = Object.entries(emotionData).map(([name, value]) => ({ name, value }));
  const emotionEmojis = { Angry: '😡', Frustrated: '😤', Urgent: '⚡', Neutral: '😐', Happy: '😊' };

  // Daily volume (simulated)
  const dailyData = [
    { day: 'Mon', tickets: 23, resolved: 18 },
    { day: 'Tue', tickets: 31, resolved: 22 },
    { day: 'Wed', tickets: 28, resolved: 25 },
    { day: 'Thu', tickets: 42, resolved: 30 },
    { day: 'Fri', tickets: 38, resolved: 33 },
    { day: 'Sat', tickets: 15, resolved: 14 },
    { day: 'Sun', tickets: 11, resolved: 10 },
  ];

  // Resolution time by category (simulated)
  const resolutionData = [
    { category: 'Payment', hours: 4.2 },
    { category: 'Delivery', hours: 12.5 },
    { category: 'Account', hours: 2.1 },
    { category: 'Technical', hours: 8.3 },
    { category: 'Refund', hours: 18.7 },
    { category: 'Product', hours: 24.1 },
  ];

  // Repeat complaint trend (simulated)
  const repeatTrend = [
    { week: 'W1', repeat: 8, new: 32 },
    { week: 'W2', repeat: 12, new: 28 },
    { week: 'W3', repeat: 15, new: 35 },
    { week: 'W4', repeat: 9, new: 41 },
  ];

  const ChartCard = ({ title, children, className = '' }) => (
    <div className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-card ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-500" /> Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-1">Comprehensive insights into your support operations</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Tickets by Category - Bar */}
        <ChartCard title="Tickets by Category">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {catChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Priority Distribution - Donut */}
        <ChartCard title="Tickets by Priority">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={prioChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {prioChartData.map((entry) => <Cell key={entry.name} fill={PRIO_COLORS[entry.name] || '#7c3aed'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Status Distribution - Donut */}
        <ChartCard title="Ticket Status Distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusChartData.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#7c3aed'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Risk Score Distribution */}
        <ChartCard title="Risk Score Distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {riskChartData.map((_, i) => <Cell key={i} fill={['#10b981', '#eab308', '#f97316', '#ef4444'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Daily Volume */}
        <ChartCard title="Daily Ticket Volume">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Area type="monotone" dataKey="tickets" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Customer Emotion */}
        <ChartCard title="Customer Emotion Analysis">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {emotionChartData.map((entry, i) => <Cell key={i} fill={
                    entry.name === 'Angry' ? '#ef4444' :
                    entry.name === 'Frustrated' ? '#f97316' :
                    entry.name === 'Urgent' ? '#eab308' :
                    entry.name === 'Happy' ? '#10b981' : '#6b7280'
                  } />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Repeat Complaint Trend */}
        <ChartCard title="Repeat Complaint Trend">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={repeatTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Line type="monotone" dataKey="repeat" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="new" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Resolution Time */}
        <ChartCard title="Avg Resolution Time by Category (hours)" className="md:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} formatter={(v) => `${v} hrs`} />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {resolutionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
