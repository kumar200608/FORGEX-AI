import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { Inspection, SlaPolicy } from '@/types/db';

interface SlaCountdownBadgeProps {
  inspection: Inspection;
}

export default function SlaCountdownBadge({ inspection }: SlaCountdownBadgeProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Re-render every 15 seconds for live countdown
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const policies = useLiveQuery(() => db.slaPolicies.toArray(), []) as SlaPolicy[] | undefined;

  const isResolved = inspection.status === 'COMPLETED' || inspection.workflowStage === 'RESOLVED';
  if (isResolved) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
        <CheckCircle2 size={12} /> SLA Met
      </span>
    );
  }

  // Calculate resolution SLA based on policy from database
  const priority = inspection.priority || 'MEDIUM';
  const currentPolicy = policies?.find((p) => p.priority === priority);
  const resolutionMinutes = currentPolicy?.resolutionMinutes ?? (priority === 'CRITICAL' ? 240 : priority === 'HIGH' ? 480 : priority === 'LOW' ? 2880 : 1440);
  const durationHours = resolutionMinutes / 60;

  const createdAtMs = new Date(inspection.createdAt).getTime();
  const deadlineMs = inspection.resolutionDeadline
    ? new Date(inspection.resolutionDeadline).getTime()
    : createdAtMs + durationHours * 3600 * 1000;

  const diffMs = deadlineMs - nowMs;
  const isBreached = diffMs <= 0;

  const hoursRemaining = Math.max(0, Math.floor(Math.abs(diffMs) / (1000 * 60 * 60)));
  const minutesRemaining = Math.max(0, Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60)));

  if (isBreached) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse shadow-xs">
        <AlertTriangle size={12} className="text-rose-600" />
        SLA Breached ({hoursRemaining}h {minutesRemaining}m overdue)
      </span>
    );
  }

  // At risk if less than 25% or < 2 hours remaining
  const isAtRisk = diffMs < 2 * 3600 * 1000;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${
        isAtRisk
          ? 'bg-amber-50 text-amber-800 border-amber-300'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}
    >
      {isAtRisk ? <ShieldAlert size={12} className="text-amber-600" /> : <Clock size={12} className="text-emerald-600" />}
      <span>
        SLA: {hoursRemaining}h {minutesRemaining}m left
      </span>
    </span>
  );
}
