import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge, PriorityBadge, EmotionBadge } from '../../components/Badges';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, ChevronDown, Eye, ArrowUpDown, User, Hash, Layers, Calendar, ShieldAlert } from 'lucide-react';

export default function AllTickets() {
  const { tickets } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [prioFilter, setPrioFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['All', 'Payment', 'Delivery', 'Account', 'Technical', 'Refund', 'Product'];
  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const statuses = ['All', 'Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'];

  const filtered = useMemo(() => {
    let result = tickets.filter(t => {
      const matchSearch = search === '' || t.subject.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()) || t.customerName.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === 'All' || t.category === catFilter;
      const matchPrio = prioFilter === 'All' || t.priority === prioFilter;
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;
      return matchSearch && matchCat && matchPrio && matchStatus;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'risk-high': return (b.aiAnalysis?.riskScore?.total || 0) - (a.aiAnalysis?.riskScore?.total || 0);
        case 'risk-low': return (a.aiAnalysis?.riskScore?.total || 0) - (b.aiAnalysis?.riskScore?.total || 0);
        default: return 0;
      }
    });

    return result;
  }, [tickets, search, catFilter, prioFilter, statusFilter, sortBy]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tickets</h1>
          <p className="text-sm text-gray-500">{filtered.length} of {tickets.length} tickets</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card mb-6 space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID, subject, or customer..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="risk-high">Risk: High to Low</option>
            <option value="risk-low">Risk: Low to High</option>
          </select>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100 animate-slide-up">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <div className="flex flex-wrap gap-1">
                {categories.map(c => (
                  <button key={c} onClick={() => setCatFilter(c)} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${catFilter === c ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
              <div className="flex flex-wrap gap-1">
                {priorities.map(p => (
                  <button key={p} onClick={() => setPrioFilter(p)} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${prioFilter === p ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <div className="flex flex-wrap gap-1">
                {statuses.map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${statusFilter === s ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table (desktop) / Cards (mobile) */}
      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="table-responsive">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ticket ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Risk</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Emotion</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ticket => (
                <tr key={ticket.id} className="border-b border-gray-50 hover:bg-brand-50/30 transition-colors cursor-pointer" onClick={() => navigate(`/company/ticket/${ticket.id}`)}>
                  <td className="px-4 py-3 text-sm font-semibold text-brand-600">{ticket.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{ticket.customerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{ticket.subject}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-600">{ticket.category}</span></td>
                  <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                  <td className="px-4 py-3 text-sm font-bold">
                    <span className={ticket.aiAnalysis?.riskScore?.total >= 81 ? 'text-red-600' : ticket.aiAnalysis?.riskScore?.total >= 61 ? 'text-orange-600' : ticket.aiAnalysis?.riskScore?.total >= 31 ? 'text-yellow-600' : 'text-green-600'}>
                      {ticket.aiAnalysis?.riskScore?.total || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{ticket.aiAnalysis?.emotion && <EmotionBadge emotion={ticket.aiAnalysis.emotion} />}</td>
                  <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(ticket.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden grid sm:grid-cols-2 gap-4">
        {filtered.map(ticket => (
          <div key={ticket.id} onClick={() => navigate(`/company/ticket/${ticket.id}`)} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card cursor-pointer card-interactive">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-semibold text-brand-600">{ticket.id}</span>
              <StatusBadge status={ticket.status} />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{ticket.subject}</h3>
            <div className="text-xs text-gray-500 mb-2">{ticket.customerName}</div>
            <div className="flex flex-wrap gap-1.5">
              <PriorityBadge priority={ticket.priority} />
              {ticket.aiAnalysis?.emotion && <EmotionBadge emotion={ticket.aiAnalysis.emotion} />}
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ticket.aiAnalysis?.riskScore?.total >= 81 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                Risk: {ticket.aiAnalysis?.riskScore?.total || '-'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
