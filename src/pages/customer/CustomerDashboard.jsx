import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import DashboardCard from '../../components/DashboardCard';
import TicketCard from '../../components/TicketCard';
import { FileText, Clock, Loader, CheckCircle, PlusCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CustomerDashboard() {
  const { user, getCustomerTickets } = useApp();
  const navigate = useNavigate();
  const tickets = getCustomerTickets(user?.data?.id);

  const open = tickets.filter(t => t.status === 'Open').length;
  const inProgress = tickets.filter(t => t.status === 'In Progress' || t.status === 'Escalated').length;
  const resolved = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Welcome, <span className="gradient-text">{user?.data?.name}</span>
        </h1>
        <p className="text-gray-500 mt-1">Here's an overview of your support tickets</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard icon={<FileText className="w-5 h-5" />} title="Total Tickets" value={tickets.length} gradient="linear-gradient(135deg, #7c3aed, #6d28d9)" />
        <DashboardCard icon={<Clock className="w-5 h-5" />} title="Open" value={open} gradient="linear-gradient(135deg, #3b82f6, #2563eb)" />
        <DashboardCard icon={<Loader className="w-5 h-5" />} title="In Progress" value={inProgress} gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
        <DashboardCard icon={<CheckCircle className="w-5 h-5" />} title="Resolved" value={resolved} gradient="linear-gradient(135deg, #10b981, #059669)" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Link to="/customer/submit" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-glow transition-all hover:translate-y-[-1px]">
          <PlusCircle className="w-5 h-5" /> Submit New Complaint
        </Link>
        <Link to="/customer/tickets" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-brand-200 text-brand-600 font-semibold hover:bg-brand-50 transition-all">
          <FileText className="w-5 h-5" /> My Tickets
        </Link>
      </div>

      {/* Recent Tickets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
          {tickets.length > 3 && (
            <Link to="/customer/tickets" className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-card">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No tickets yet</h3>
            <p className="text-gray-500 mb-4">Submit your first support complaint to get started.</p>
            <Link to="/customer/submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold">
              <PlusCircle className="w-4 h-4" /> Submit Ticket
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.slice(0, 6).map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} onClick={() => navigate(`/customer/ticket/${ticket.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
