import { useEffect, useState, useRef } from 'react';

export default function RiskScore({ score, size = 'lg', showBreakdown = false, breakdown = null }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [score]);

  const getColor = (s) => {
    if (s >= 81) return { stroke: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Critical Risk', textColor: 'text-red-600' };
    if (s >= 61) return { stroke: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', label: 'High Risk', textColor: 'text-orange-600' };
    if (s >= 31) return { stroke: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', label: 'Medium Risk', textColor: 'text-yellow-600' };
    return { stroke: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Low Risk', textColor: 'text-green-600' };
  };

  const sizeMap = {
    sm: { width: 80, strokeWidth: 6, fontSize: 'text-lg', labelSize: 'text-[10px]' },
    md: { width: 120, strokeWidth: 8, fontSize: 'text-2xl', labelSize: 'text-xs' },
    lg: { width: 160, strokeWidth: 10, fontSize: 'text-4xl', labelSize: 'text-sm' },
  };

  const s = sizeMap[size];
  const radius = (s.width - s.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animatedScore / 100) * circumference;
  const color = getColor(score);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: s.width, height: s.width }}>
        <svg className="risk-ring" width={s.width} height={s.width}>
          <circle className="risk-ring-bg" cx={s.width/2} cy={s.width/2} r={radius} strokeWidth={s.strokeWidth} />
          <circle
            className="risk-ring-fill"
            cx={s.width/2} cy={s.width/2} r={radius}
            strokeWidth={s.strokeWidth}
            stroke={color.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${s.fontSize} font-bold ${color.textColor}`}>{animatedScore}</span>
          <span className={`${s.labelSize} text-gray-500`}>/100</span>
        </div>
      </div>
      <span className={`text-sm font-semibold ${color.textColor} px-3 py-1 rounded-full`} style={{ background: color.bg }}>
        {color.label}
      </span>

      {showBreakdown && breakdown && (
        <div className="w-full max-w-xs space-y-2 mt-2">
          {[
            { label: 'Financial Impact', value: breakdown.financial, max: 30, color: 'bg-red-400' },
            { label: 'Urgency', value: breakdown.urgency, max: 25, color: 'bg-orange-400' },
            { label: 'Customer Frustration', value: breakdown.frustration, max: 20, color: 'bg-amber-400' },
            { label: 'Repeat Complaint', value: breakdown.repeat, max: 15, color: 'bg-purple-400' },
            { label: 'Business Impact', value: breakdown.business, max: 10, color: 'bg-cyan-400' },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-semibold text-gray-800">{item.value}/{item.max}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                  style={{ width: `${(item.value / item.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
