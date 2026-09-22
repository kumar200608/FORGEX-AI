import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Send, Paperclip, Mail, Phone, MessageSquare, CheckCircle, Brain, Sparkles } from 'lucide-react';

export default function SubmitTicket() {
  const { addTicket, addToast } = useApp();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    description: '',
    orderId: '',
    category: '',
    contactMethod: 'email',
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const ticket = addTicket(form);
      setLoading(false);
      setSubmitted(ticket);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-20 h-20 rounded-2xl ai-gradient-animate flex items-center justify-center mb-6">
          <Brain className="w-10 h-10 text-white animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">AI is analyzing your complaint...</h2>
        <p className="text-gray-500 text-sm">Classifying category, priority, emotion, and risk score</p>
        <div className="mt-6 flex gap-2">
          {['Category', 'Priority', 'Emotion', 'Risk'].map((label, i) => (
            <div key={label} className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 text-xs font-medium animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
              <Sparkles className="w-3 h-3 inline mr-1" />{label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Submitted Successfully!</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card mt-6 text-left">
          <div className="text-center mb-4">
            <span className="text-sm text-gray-500">Your Ticket ID</span>
            <div className="text-2xl font-bold text-brand-600 mt-1">{submitted.id}</div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subject</span><span className="font-medium text-gray-900">{submitted.subject}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium text-gray-900">{submitted.category}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Priority</span><span className={`font-semibold ${submitted.priority === 'Critical' ? 'text-red-600' : submitted.priority === 'High' ? 'text-orange-600' : 'text-gray-900'}`}>{submitted.priority}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Risk Score</span><span className="font-semibold">{submitted.aiAnalysis?.riskScore?.total}/100</span></div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">Your complaint has been sent to our support system and is being analyzed by SmartTicket AI.</p>
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={() => navigate(`/customer/ticket/${submitted.id}`)} className="px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:shadow-glow transition-all">
            View Ticket
          </button>
          <button onClick={() => { setSubmitted(null); setForm({ subject: '', description: '', orderId: '', category: '', contactMethod: 'email' }); }} className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-all">
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit a Complaint</h1>
      <p className="text-gray-500 mb-8">Describe your issue and our AI will automatically analyze and route it to the right team.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
          <input type="text" value={form.subject} onChange={(e) => update('subject', e.target.value)} placeholder="Brief summary of your issue" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Complaint / Query *</label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="My payment was deducted but my order was cancelled..." rows={5} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none" required />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Order ID (optional)</label>
            <input type="text" value={form.orderId} onChange={(e) => update('orderId', e.target.value)} placeholder="ORD-XXXXX" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category (optional)</label>
            <select value={form.category} onChange={(e) => update('category', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white">
              <option value="">Auto-detect by AI</option>
              <option value="Payment">Payment</option>
              <option value="Delivery">Delivery</option>
              <option value="Account">Account</option>
              <option value="Technical">Technical</option>
              <option value="Refund">Refund</option>
              <option value="Product">Product</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Contact Method</label>
          <div className="flex gap-3">
            {[
              { value: 'email', icon: <Mail className="w-4 h-4" />, label: 'Email' },
              { value: 'phone', icon: <Phone className="w-4 h-4" />, label: 'Phone' },
              { value: 'chat', icon: <MessageSquare className="w-4 h-4" />, label: 'Chat' },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => update('contactMethod', opt.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  form.contactMethod === opt.value ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-glow transition-all hover:translate-y-[-1px] flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Submit Complaint
          </button>
        </div>
      </form>
    </div>
  );
}
