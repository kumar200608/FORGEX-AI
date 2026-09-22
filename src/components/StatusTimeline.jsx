import { CheckCircle, Circle } from 'lucide-react';

const stages = ['Submitted', 'AI Analyzed', 'Assigned', 'In Progress', 'Resolved'];

function getStageIndex(status) {
  switch (status) {
    case 'Open': return 0;
    case 'AI Analyzed': return 1;
    case 'Assigned': return 2;
    case 'In Progress': return 3;
    case 'Resolved': case 'Closed': return 4;
    case 'Escalated': return 3;
    default: return 0;
  }
}

export default function StatusTimeline({ status }) {
  const current = getStageIndex(status);
  // If AI analysis exists, at least stage 1 is done
  const effectiveStage = Math.max(current, 1);

  return (
    <div className="flex items-center w-full justify-between">
      {stages.map((stage, i) => {
        const isDone = i <= effectiveStage;
        const isCurrent = i === effectiveStage;
        const isActive = i < effectiveStage;

        return (
          <div key={stage} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                isDone
                  ? 'bg-gradient-to-r from-brand-500 to-accent-cyan text-white'
                  : 'bg-gray-100 text-gray-400'
              } ${isCurrent ? 'timeline-active ring-4 ring-brand-100' : ''}`}>
                {isActive ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              <span className={`text-[10px] mt-1.5 font-medium text-center leading-tight ${isDone ? 'text-brand-600' : 'text-gray-400'}`}>
                {stage}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mt-[-16px] transition-all duration-500 ${
                isActive ? 'bg-gradient-to-r from-brand-500 to-accent-cyan' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
