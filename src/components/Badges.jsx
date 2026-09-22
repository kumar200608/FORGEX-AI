export function StatusBadge({ status }) {
  const styles = {
    'Open': 'bg-blue-100 text-blue-700 border-blue-200',
    'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
    'Escalated': 'bg-purple-100 text-purple-700 border-purple-200',
    'Resolved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Closed': 'bg-gray-100 text-gray-600 border-gray-200',
    'AI Analyzed': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Assigned': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Submitted': 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || styles['Open']}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    'Critical': 'bg-red-100 text-red-700 border-red-300',
    'High': 'bg-orange-100 text-orange-700 border-orange-300',
    'Medium': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'Low': 'bg-green-100 text-green-700 border-green-300',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[priority] || styles['Medium']}`}>
      {priority === 'Critical' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 blink" />}
      {priority}
    </span>
  );
}

export function EmotionBadge({ emotion }) {
  const styles = {
    'Angry': 'bg-red-100 text-red-700',
    'Frustrated': 'bg-orange-100 text-orange-700',
    'Urgent': 'bg-amber-100 text-amber-700',
    'Neutral': 'bg-gray-100 text-gray-700',
    'Happy': 'bg-green-100 text-green-700',
  };
  const emojis = {
    'Angry': '😡',
    'Frustrated': '😤',
    'Urgent': '⚡',
    'Neutral': '😐',
    'Happy': '😊',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[emotion] || styles['Neutral']}`}>
      {emojis[emotion]} {emotion}
    </span>
  );
}
