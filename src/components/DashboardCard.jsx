export default function DashboardCard({ icon, title, value, subtitle, gradient, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-card card-interactive ${onClick ? 'cursor-pointer' : ''}`}
      style={{ background: gradient }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 -translate-y-6 translate-x-6" style={{ background: 'rgba(255,255,255,0.3)' }} />
      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full opacity-10 translate-y-6 -translate-x-4" style={{ background: 'rgba(255,255,255,0.3)' }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-sm font-medium opacity-90">{title}</div>
        {subtitle && <div className="text-xs opacity-70 mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}
