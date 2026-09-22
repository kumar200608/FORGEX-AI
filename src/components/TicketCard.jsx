import { StatusBadge, PriorityBadge, EmotionBadge } from './Badges';
import { Clock, Hash, Layers, User } from 'lucide-react';

export default function TicketCard({ ticket, onClick, showCustomer = false }) {
  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card card-interactive cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-semibold text-brand-600">{ticket.id}</span>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">{ticket.subject}</h3>

      {showCustomer && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <User className="w-3.5 h-3.5" />
          {ticket.customerName}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 text-xs text-gray-600">
          <Layers className="w-3 h-3" />
          {ticket.category}
        </span>
        <PriorityBadge priority={ticket.priority} />
        {ticket.aiAnalysis?.emotion && <EmotionBadge emotion={ticket.aiAnalysis.emotion} />}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(ticket.createdAt)}
        </div>
        {ticket.aiAnalysis?.riskScore && (
          <span className={`font-bold ${ticket.aiAnalysis.riskScore.total >= 81 ? 'text-red-500' : ticket.aiAnalysis.riskScore.total >= 61 ? 'text-orange-500' : ticket.aiAnalysis.riskScore.total >= 31 ? 'text-yellow-500' : 'text-green-500'}`}>
            Risk: {ticket.aiAnalysis.riskScore.total}/100
          </span>
        )}
      </div>
    </div>
  );
}
