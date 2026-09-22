import { Link } from 'react-router-dom';
import { Brain, ShieldCheck, BarChart3, Heart, TrendingUp, AlertTriangle, Zap, Target, ArrowRight, Sparkles, CheckCircle, Menu, X } from 'lucide-react';
import { useState } from 'react';

const features = [
  { icon: <Brain className="w-6 h-6" />, title: 'AI Ticket Classification', desc: 'Automatically categorize tickets using natural language understanding.', gradient: 'from-purple-500 to-indigo-600' },
  { icon: <Target className="w-6 h-6" />, title: 'Priority Prediction', desc: 'Predict ticket priority based on content analysis and historical patterns.', gradient: 'from-cyan-500 to-blue-600' },
  { icon: <Sparkles className="w-6 h-6" />, title: 'Explainable AI', desc: 'Understand why AI made each prediction with highlighted keyword analysis.', gradient: 'from-pink-500 to-rose-600' },
  { icon: <Heart className="w-6 h-6" />, title: 'Customer Emotion Analysis', desc: 'Detect customer emotions from complaint text for empathetic responses.', gradient: 'from-orange-500 to-amber-600' },
  { icon: <TrendingUp className="w-6 h-6" />, title: 'Business Impact Analysis', desc: 'Assess financial and operational impact of each support ticket.', gradient: 'from-emerald-500 to-teal-600' },
  { icon: <AlertTriangle className="w-6 h-6" />, title: 'Repeat Complaint Detection', desc: 'Identify returning customers with similar complaints for proactive resolution.', gradient: 'from-violet-500 to-purple-600' },
  { icon: <Zap className="w-6 h-6" />, title: 'Emergency Alerts', desc: 'Real-time alerts for critical tickets and mass complaint clusters.', gradient: 'from-red-500 to-pink-600' },
  { icon: <ShieldCheck className="w-6 h-6" />, title: 'Risk Score', desc: 'Comprehensive 0-100 risk scoring with detailed breakdown per ticket.', gradient: 'from-blue-500 to-cyan-600' },
];

const stats = [
  { value: '99.2%', label: 'Classification Accuracy' },
  { value: '<2s', label: 'Analysis Time' },
  { value: '47%', label: 'Faster Resolution' },
  { value: '10K+', label: 'Tickets Analyzed' },
];

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-brand-500 to-accent-cyan flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">SmartTicket AI</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">How It Works</a>
              <a href="#features" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">Features</a>
              <a href="#stats" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">About</a>
              <Link to="/login" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">Login</Link>
              <Link to="/login" className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-cyan text-white text-sm font-semibold hover:shadow-glow transition-all">
                Get Started
              </Link>
            </nav>

            <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 animate-slide-up">
            <div className="flex flex-col gap-3">
              <a href="#how-it-works" className="text-sm text-gray-600 py-2" onClick={() => setMobileMenu(false)}>How It Works</a>
              <a href="#features" className="text-sm text-gray-600 py-2" onClick={() => setMobileMenu(false)}>Features</a>
              <a href="#stats" className="text-sm text-gray-600 py-2" onClick={() => setMobileMenu(false)}>About</a>
              <Link to="/login" className="text-sm text-brand-600 font-semibold py-2" onClick={() => setMobileMenu(false)}>Login</Link>
              <Link to="/login" className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-cyan text-white text-sm font-semibold text-center" onClick={() => setMobileMenu(false)}>
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                AI-Powered Support Intelligence
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Turn Customer Complaints into{' '}
                <span className="gradient-text">Smart Actions</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
                AI-powered support ticket analysis with explainable predictions, impact scoring, repeat complaint detection and intelligent escalation.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-glow transition-all hover:translate-y-[-2px]">
                  Submit a Ticket <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-brand-200 text-brand-600 font-semibold hover:bg-brand-50 transition-all">
                  <BarChart3 className="w-4 h-4" />
                  Support Dashboard
                </Link>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative animate-float hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-accent-cyan/20 rounded-3xl blur-3xl" />
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                {/* Mock dashboard preview */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-400 ml-2">SmartTicket AI Dashboard</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Total', value: '1,248', bg: 'from-brand-500 to-indigo-500' },
                    { label: 'Critical', value: '42', bg: 'from-red-500 to-pink-500' },
                    { label: 'Resolved', value: '876', bg: 'from-emerald-500 to-teal-500' },
                  ].map(s => (
                    <div key={s.label} className={`bg-gradient-to-r ${s.bg} text-white rounded-xl p-3`}>
                      <div className="text-lg font-bold">{s.value}</div>
                      <div className="text-[10px] opacity-80">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'ST-1024', status: 'Critical', color: 'red' },
                    { id: 'ST-1025', status: 'In Progress', color: 'amber' },
                    { id: 'ST-1026', status: 'Resolved', color: 'emerald' },
                  ].map(row => (
                    <div key={row.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-xs font-medium text-gray-700">{row.id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${row.color}-100 text-${row.color}-700 font-medium`}>{row.status}</span>
                    </div>
                  ))}
                </div>
                {/* Risk Score Mini */}
                <div className="absolute -right-8 -bottom-6 bg-white rounded-xl shadow-lg border p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-4 border-red-400 flex items-center justify-center">
                    <span className="text-sm font-bold text-red-600">92</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">Risk Score</div>
                    <div className="text-xs font-bold text-red-600">Critical</div>
                  </div>
                </div>
                {/* AI Chip */}
                <div className="absolute -left-6 top-16 bg-white rounded-xl shadow-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-brand-500" />
                    <span className="text-[10px] font-medium text-gray-700">AI Analyzed</span>
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-gradient-to-b from-brand-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">From complaint to resolution — powered by AI every step of the way.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Submit Ticket', desc: 'Customer submits a support complaint or query.', icon: '📝' },
              { step: '2', title: 'AI Analysis', desc: 'AI analyzes category, priority, emotion and risk.', icon: '🤖' },
              { step: '3', title: 'Smart Routing', desc: 'Ticket routed to the right team with context.', icon: '🎯' },
              { step: '4', title: 'Resolve', desc: 'Support team resolves with AI recommendations.', icon: '✅' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-card flex items-center justify-center text-2xl mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brand-500 to-accent-cyan text-white text-sm font-bold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Everything you need to transform customer support with AI intelligence.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-card card-interactive">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${f.gradient} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 bg-gradient-to-r from-brand-600 via-brand-500 to-accent-cyan">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center text-white">
                <div className="text-4xl font-bold mb-2">{s.value}</div>
                <div className="text-sm opacity-80">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Transform Your Support?</h2>
          <p className="text-gray-600 mb-8">Start analyzing tickets with AI today. No credit card required.</p>
          <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold text-lg hover:shadow-glow transition-all hover:translate-y-[-2px]">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-r from-brand-500 to-accent-cyan flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold gradient-text">SmartTicket AI</span>
            </div>
            <p className="text-sm text-gray-500">© 2026 SmartTicket AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
