// ========== CUSTOMERS ==========
export const mockCustomers = [
  { id: 'C001', name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 9876543210', password: 'pass123', avatar: 'PS' },
  { id: 'C002', name: 'Rahul Mehta', email: 'rahul@example.com', phone: '+91 9123456789', password: 'pass123', avatar: 'RM' },
  { id: 'C003', name: 'Ananya Gupta', email: 'ananya@example.com', phone: '+91 9988776655', password: 'pass123', avatar: 'AG' },
  { id: 'C004', name: 'Vikram Patel', email: 'vikram@example.com', phone: '+91 8877665544', password: 'pass123', avatar: 'VP' },
  { id: 'C005', name: 'Sara Khan', email: 'sara@example.com', phone: '+91 7766554433', password: 'pass123', avatar: 'SK' },
];

// ========== AGENTS ==========
export const mockAgents = [
  { id: 'A001', name: 'Arjun Reddy', email: 'arjun@smartticket.ai', empId: 'EMP001', password: 'agent123', role: 'Senior Agent', team: 'Payment Operations', avatar: 'AR' },
  { id: 'A002', name: 'Neha Singh', email: 'neha@smartticket.ai', empId: 'EMP002', password: 'agent123', role: 'Agent', team: 'Technical Support', avatar: 'NS' },
  { id: 'A003', name: 'Deepak Kumar', email: 'deepak@smartticket.ai', empId: 'EMP003', password: 'agent123', role: 'Team Lead', team: 'Customer Care', avatar: 'DK' },
];

// ========== CATEGORIES ==========
export const categories = ['Payment', 'Delivery', 'Account', 'Technical', 'Refund', 'Product'];

// ========== AI ANALYSIS TEMPLATES ==========
const aiAnalysisTemplates = {
  'Payment': {
    rootCause: 'Possible payment-order synchronization issue',
    recommendedTeam: 'Payment Operations Team',
    keywords: [
      { word: 'payment', reason: 'Payment category indicator' },
      { word: 'deducted', reason: 'Financial impact detected' },
      { word: 'charged', reason: 'Billing issue indicator' },
      { word: 'refund', reason: 'Refund-related keyword' },
    ]
  },
  'Delivery': {
    rootCause: 'Logistics or courier partner delay',
    recommendedTeam: 'Logistics Team',
    keywords: [
      { word: 'delivery', reason: 'Delivery category indicator' },
      { word: 'shipping', reason: 'Shipping process issue' },
      { word: 'track', reason: 'Tracking information needed' },
      { word: 'delayed', reason: 'Timeline issue detected' },
    ]
  },
  'Account': {
    rootCause: 'Account authentication or access control issue',
    recommendedTeam: 'Account Security Team',
    keywords: [
      { word: 'password', reason: 'Authentication issue' },
      { word: 'login', reason: 'Access control indicator' },
      { word: 'account', reason: 'Account management issue' },
      { word: 'locked', reason: 'Account lockout detected' },
    ]
  },
  'Technical': {
    rootCause: 'Application or system technical failure',
    recommendedTeam: 'Technical Support Team',
    keywords: [
      { word: 'error', reason: 'Technical error detected' },
      { word: 'crash', reason: 'Application failure indicator' },
      { word: 'bug', reason: 'Software defect' },
      { word: 'loading', reason: 'Performance issue' },
    ]
  },
  'Refund': {
    rootCause: 'Refund processing delay or failure',
    recommendedTeam: 'Refund Processing Team',
    keywords: [
      { word: 'refund', reason: 'Refund category indicator' },
      { word: 'money', reason: 'Financial concern' },
      { word: 'return', reason: 'Return process issue' },
      { word: 'credit', reason: 'Credit processing' },
    ]
  },
  'Product': {
    rootCause: 'Product quality or fulfillment issue',
    recommendedTeam: 'Product Quality Team',
    keywords: [
      { word: 'damaged', reason: 'Product damage detected' },
      { word: 'wrong', reason: 'Wrong item delivered' },
      { word: 'defective', reason: 'Product quality issue' },
      { word: 'broken', reason: 'Physical damage indicator' },
    ]
  }
};

// ========== EMOTION DETECTION ==========
const emotionKeywords = {
  angry: ['angry', 'furious', 'outraged', 'ridiculous', 'unacceptable', 'worst', 'terrible', 'horrible', 'disgusted'],
  frustrated: ['frustrated', 'annoyed', 'disappointed', 'upset', 'fed up', 'still not', 'twice', 'multiple times', 'again'],
  urgent: ['urgent', 'immediately', 'asap', 'emergency', 'critical', 'right now', 'cannot wait'],
  neutral: ['wondering', 'would like', 'could you', 'please', 'inquiry', 'question'],
  happy: ['thank', 'appreciate', 'great', 'excellent', 'wonderful', 'happy', 'satisfied'],
};

export function detectEmotion(text) {
  const lower = text.toLowerCase();
  let scores = { angry: 0, frustrated: 0, urgent: 0, neutral: 0, happy: 0 };
  for (const [emotion, words] of Object.entries(emotionKeywords)) {
    for (const word of words) {
      if (lower.includes(word)) scores[emotion]++;
    }
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] === 0) return 'Neutral';
  return sorted[0][0].charAt(0).toUpperCase() + sorted[0][0].slice(1);
}

// ========== CONFIDENCE CALCULATION ==========
export function calculateCategoryConfidence(text, category) {
  const lower = text.toLowerCase();
  const keywords = categoryKeywords[category] || [];
  if (keywords.length === 0) return 40;
  let matched = 0;
  for (const word of keywords) {
    if (lower.includes(word)) matched++;
  }
  // Base confidence from keyword density
  const density = matched / keywords.length;
  // Also check if second best category is close
  let scores = {};
  for (const [cat, words] of Object.entries(categoryKeywords)) {
    scores[cat] = 0;
    for (const word of words) {
      if (lower.includes(word)) scores[cat]++;
    }
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topScore = sorted[0][1];
  const secondScore = sorted.length > 1 ? sorted[1][1] : 0;
  // If top and second are close, confidence drops
  const separation = topScore > 0 ? (topScore - secondScore) / topScore : 0;
  const rawConfidence = (density * 60) + (separation * 30) + (matched > 0 ? 10 : 0);
  return Math.min(Math.round(Math.max(rawConfidence, matched > 0 ? 45 : 25)), 99);
}

export function calculateEmotionConfidence(text) {
  const lower = text.toLowerCase();
  let scores = { angry: 0, frustrated: 0, urgent: 0, neutral: 0, happy: 0 };
  let totalMatches = 0;
  for (const [emotion, words] of Object.entries(emotionKeywords)) {
    for (const word of words) {
      if (lower.includes(word)) {
        scores[emotion]++;
        totalMatches++;
      }
    }
  }
  if (totalMatches === 0) return 35; // default low confidence for neutral
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topScore = sorted[0][1];
  const secondScore = sorted.length > 1 ? sorted[1][1] : 0;
  const dominance = topScore / Math.max(totalMatches, 1);
  const separation = topScore > 0 ? (topScore - secondScore) / topScore : 0;
  const rawConfidence = (dominance * 50) + (separation * 35) + (topScore >= 2 ? 15 : topScore >= 1 ? 8 : 0);
  return Math.min(Math.round(Math.max(rawConfidence, 30)), 99);
}

export function calculatePriorityConfidence(riskScore) {
  // Confidence is higher when score is clearly in a bucket center, lower near boundaries
  const boundaries = [0, 31, 61, 81, 100];
  let minDist = 100;
  for (const b of boundaries) {
    const dist = Math.abs(riskScore - b);
    if (dist < minDist) minDist = dist;
  }
  // farther from boundary = more confident
  const rawConfidence = 55 + (minDist / 20) * 40;
  return Math.min(Math.round(rawConfidence), 99);
}

export function calculateOverallConfidence(catConf, emotionConf, prioConf) {
  // Weighted average: category is most important
  return Math.round(catConf * 0.45 + prioConf * 0.30 + emotionConf * 0.25);
}

// ========== CATEGORY DETECTION ==========
const categoryKeywords = {
  Payment: ['payment', 'paid', 'charged', 'deducted', 'billing', 'transaction', 'money taken', 'amount', 'twice charged', 'double charge'],
  Delivery: ['delivery', 'shipping', 'shipped', 'track', 'courier', 'package', 'arrived', 'delayed', 'not received', 'dispatch'],
  Account: ['account', 'password', 'login', 'sign in', 'locked', 'access', 'profile', 'forgot', 'email change', 'username'],
  Technical: ['error', 'bug', 'crash', 'not working', 'loading', 'app crash', 'technical', 'glitch', 'freeze', 'slow'],
  Refund: ['refund', 'return', 'money back', 'credit', 'reimburse', 'cashback', 'reversal'],
  Product: ['damaged', 'wrong product', 'defective', 'broken', 'quality', 'size', 'color wrong', 'missing part'],
};

export function detectCategory(text) {
  const lower = text.toLowerCase();
  let scores = {};
  for (const [cat, words] of Object.entries(categoryKeywords)) {
    scores[cat] = 0;
    for (const word of words) {
      if (lower.includes(word)) scores[cat]++;
    }
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] === 0) return 'Technical';
  return sorted[0][0];
}

// ========== PRIORITY DETECTION ==========
export function detectPriority(riskScore) {
  if (riskScore >= 81) return 'Critical';
  if (riskScore >= 61) return 'High';
  if (riskScore >= 31) return 'Medium';
  return 'Low';
}

// ========== RISK SCORE CALCULATION ==========
export function calculateRiskScore(text, category, isRepeat) {
  let financial = 0, urgency = 0, frustration = 0, repeat = 0, business = 0;
  const lower = text.toLowerCase();

  // Financial Impact (max 30)
  if (['Payment', 'Refund'].includes(category)) financial += 15;
  if (lower.includes('deducted') || lower.includes('charged') || lower.includes('money')) financial += 8;
  if (lower.includes('twice') || lower.includes('double')) financial += 7;
  financial = Math.min(financial, 30);

  // Urgency (max 25)
  if (lower.includes('urgent') || lower.includes('immediately') || lower.includes('asap')) urgency += 12;
  if (lower.includes('not resolved') || lower.includes('still')) urgency += 8;
  if (lower.includes('cancel')) urgency += 5;
  urgency = Math.min(urgency, 25);

  // Frustration (max 20)
  const emotion = detectEmotion(text);
  if (emotion === 'Angry') frustration = 18;
  else if (emotion === 'Frustrated') frustration = 14;
  else if (emotion === 'Urgent') frustration = 10;
  else frustration = 4;
  frustration = Math.min(frustration, 20);

  // Repeat (max 15)
  repeat = isRepeat ? 15 : 0;

  // Business Impact (max 10)
  if (['Payment', 'Refund'].includes(category)) business += 5;
  if (lower.includes('cancel') || lower.includes('leave') || lower.includes('switch')) business += 3;
  if (isRepeat) business += 2;
  business = Math.min(business, 10);

  const total = financial + urgency + frustration + repeat + business;
  return { total: Math.min(total, 100), financial, urgency, frustration, repeat, business };
}

// ========== RECOMMENDED ACTION ==========
export function getRecommendedAction(priority) {
  switch (priority) {
    case 'Critical': return 'Immediately escalate to specialized team.';
    case 'High': return 'Prioritize within the current support cycle.';
    case 'Medium': return 'Assign to relevant support team.';
    case 'Low': return 'Handle through normal support queue.';
    default: return 'Assign to relevant support team.';
  }
}

// ========== KEYWORD EXTRACTION ==========
export function extractKeywords(text, category) {
  const lower = text.toLowerCase();
  const template = aiAnalysisTemplates[category] || aiAnalysisTemplates['Technical'];
  const allKeywords = [
    ...template.keywords,
    { word: 'cancelled', reason: 'Order failure indicator' },
    { word: 'not resolved', reason: 'Escalation indicator' },
    { word: 'twice', reason: 'Repeat complaint indicator' },
    { word: 'still', reason: 'Ongoing issue indicator' },
    { word: 'urgent', reason: 'Priority escalation' },
    { word: 'immediately', reason: 'High urgency indicator' },
  ];
  return allKeywords.filter(k => lower.includes(k.word));
}

// ========== ROOT CAUSE ==========
export function getRootCause(category) {
  return aiAnalysisTemplates[category]?.rootCause || 'System issue requiring investigation';
}

export function getRecommendedTeam(category) {
  return aiAnalysisTemplates[category]?.recommendedTeam || 'General Support Team';
}

// ========== GENERATE AI ANALYSIS ==========
export function generateAIAnalysis(ticket, allTickets) {
  const category = ticket.category || detectCategory(ticket.description);
  const emotion = detectEmotion(ticket.description);

  // Repeat complaint detection
  const customerTickets = allTickets.filter(t =>
    t.customerId === ticket.customerId && t.id !== ticket.id
  );
  const relatedTickets = customerTickets.filter(t => {
    const tCat = t.category || detectCategory(t.description);
    return tCat === category;
  });
  const isRepeat = relatedTickets.length > 0;

  const riskScore = calculateRiskScore(ticket.description, category, isRepeat);
  const priority = detectPriority(riskScore.total);

  // Similar tickets from ALL customers
  const similarTickets = allTickets.filter(t =>
    t.id !== ticket.id && (t.category || detectCategory(t.description)) === category
  );

  // Calculate confidence scores
  const categoryConfidence = calculateCategoryConfidence(ticket.description, category);
  const emotionConfidence = calculateEmotionConfidence(ticket.description);
  const priorityConfidence = calculatePriorityConfidence(riskScore.total);
  const overallConfidence = calculateOverallConfidence(categoryConfidence, emotionConfidence, priorityConfidence);

  return {
    category,
    priority,
    emotion,
    isRepeat,
    relatedTickets: relatedTickets.map(t => ({ id: t.id, subject: t.subject })),
    riskScore,
    rootCause: getRootCause(category),
    recommendedTeam: getRecommendedTeam(category),
    recommendedAction: getRecommendedAction(priority),
    keywords: extractKeywords(ticket.description, category),
    similarTicketCount: similarTickets.length,
    similarTickets: similarTickets.slice(0, 5).map(t => ({ id: t.id, subject: t.subject, customer: t.customerName })),
    businessImpact: riskScore.total >= 61 ? 'High' : riskScore.total >= 31 ? 'Medium' : 'Low',
    confidence: {
      category: categoryConfidence,
      emotion: emotionConfidence,
      priority: priorityConfidence,
      overall: overallConfidence,
    },
  };
}

// ========== INITIAL MOCK TICKETS ==========
export const initialMockTickets = [
  {
    id: 'ST-2026-1001',
    customerId: 'C001',
    customerName: 'Priya Sharma',
    subject: 'Payment deducted but order cancelled',
    description: 'My payment was deducted but my order was cancelled. I contacted support twice but the issue is still not resolved. This is very frustrating.',
    category: 'Payment',
    orderId: 'ORD-90219',
    createdAt: '2026-09-18T10:30:00',
    updatedAt: '2026-09-20T14:00:00',
    status: 'In Progress',
    assignedTeam: 'Payment Operations',
    assignedAgent: 'Arjun Reddy',
    agentResponse: 'We are investigating your payment issue. Our team is working with the payment gateway to trace the transaction.',
    resolution: null,
    contactMethod: 'email',
    priority: 'Critical',
    aiAnalysis: null,
  },
  {
    id: 'ST-2026-1002',
    customerId: 'C002',
    customerName: 'Rahul Mehta',
    subject: 'Forgot my password and cannot login',
    description: 'I forgot my password and cannot login to my account. Could you please help me reset it?',
    category: 'Account',
    orderId: null,
    createdAt: '2026-09-19T08:15:00',
    updatedAt: '2026-09-19T09:30:00',
    status: 'Resolved',
    assignedTeam: 'Account Security',
    assignedAgent: 'Neha Singh',
    agentResponse: 'Password reset link has been sent to your registered email.',
    resolution: 'Password reset link sent to registered email. Customer confirmed access restored.',
    contactMethod: 'email',
    priority: 'Medium',
    aiAnalysis: null,
  },
  {
    id: 'ST-2026-1003',
    customerId: 'C003',
    customerName: 'Ananya Gupta',
    subject: 'Product arrived damaged',
    description: 'My product arrived damaged. The box was crushed and the item inside is broken. I am very disappointed with the packaging quality.',
    category: 'Product',
    orderId: 'ORD-87432',
    createdAt: '2026-09-20T11:00:00',
    updatedAt: '2026-09-21T16:00:00',
    status: 'In Progress',
    assignedTeam: 'Product Quality',
    assignedAgent: 'Deepak Kumar',
    agentResponse: 'We apologize for the damaged product. We are arranging a replacement for you.',
    resolution: null,
    contactMethod: 'phone',
    priority: 'High',
    aiAnalysis: null,
  },
  {
    id: 'ST-2026-1004',
    customerId: 'C004',
    customerName: 'Vikram Patel',
    subject: 'Where can I track my order?',
    description: 'I placed an order 3 days ago but I cannot find the tracking link anywhere. Where can I track my order?',
    category: 'Delivery',
    orderId: 'ORD-91003',
    createdAt: '2026-09-21T09:45:00',
    updatedAt: '2026-09-21T09:45:00',
    status: 'Open',
    assignedTeam: null,
    assignedAgent: null,
    agentResponse: null,
    resolution: null,
    contactMethod: 'email',
    priority: 'Low',
    aiAnalysis: null,
  },
  {
    id: 'ST-2026-1005',
    customerId: 'C001',
    customerName: 'Priya Sharma',
    subject: 'Charged twice for the same order',
    description: 'I was charged twice for the same order. This is unacceptable. I want an immediate refund for the extra charge. I am furious about this.',
    category: 'Payment',
    orderId: 'ORD-89777',
    createdAt: '2026-09-15T14:20:00',
    updatedAt: '2026-09-17T11:00:00',
    status: 'Resolved',
    assignedTeam: 'Payment Operations',
    assignedAgent: 'Arjun Reddy',
    agentResponse: 'We have identified the duplicate charge and initiated a refund.',
    resolution: 'Duplicate charge of ₹2,499 has been refunded. Amount will reflect in 3-5 business days.',
    contactMethod: 'email',
    priority: 'Critical',
    aiAnalysis: null,
  },
  {
    id: 'ST-2026-1006',
    customerId: 'C005',
    customerName: 'Sara Khan',
    subject: 'App keeps crashing on checkout',
    description: 'The app keeps crashing whenever I try to checkout. I have tried multiple times but it gives an error every time. Very frustrating experience.',
    category: 'Technical',
    orderId: null,
    createdAt: '2026-09-20T16:30:00',
    updatedAt: '2026-09-21T10:00:00',
    status: 'In Progress',
    assignedTeam: 'Technical Support',
    assignedAgent: 'Neha Singh',
    agentResponse: 'Our engineering team is looking into the checkout crash issue. We have identified a potential fix.',
    resolution: null,
    contactMethod: 'email',
    priority: 'High',
    aiAnalysis: null,
  },
  {
    id: 'ST-2026-1007',
    customerId: 'C002',
    customerName: 'Rahul Mehta',
    subject: 'Refund not received after 15 days',
    description: 'I returned my product 15 days ago but still have not received my refund. The tracking shows the return was delivered. I want my money back immediately.',
    category: 'Refund',
    orderId: 'ORD-86001',
    createdAt: '2026-09-19T13:00:00',
    updatedAt: '2026-09-21T09:00:00',
    status: 'Escalated',
    assignedTeam: 'Refund Processing',
    assignedAgent: 'Arjun Reddy',
    agentResponse: 'We have escalated this to our finance team for immediate resolution.',
    resolution: null,
    contactMethod: 'phone',
    priority: 'Critical',
    aiAnalysis: null,
  },
  {
    id: 'ST-2026-1008',
    customerId: 'C003',
    customerName: 'Ananya Gupta',
    subject: 'Received wrong product',
    description: 'I ordered a blue dress but received a red one. The size is also wrong. Very disappointed.',
    category: 'Product',
    orderId: 'ORD-90555',
    createdAt: '2026-09-21T14:00:00',
    updatedAt: '2026-09-21T14:00:00',
    status: 'Open',
    assignedTeam: null,
    assignedAgent: null,
    agentResponse: null,
    resolution: null,
    contactMethod: 'email',
    priority: 'High',
    aiAnalysis: null,
  },
  {
    id: 'ST-2026-1009',
    customerId: 'C004',
    customerName: 'Vikram Patel',
    subject: 'Payment failed but amount deducted',
    description: 'My payment failed during checkout but the amount was deducted from my bank account. I need this resolved urgently.',
    category: 'Payment',
    orderId: 'ORD-91200',
    createdAt: '2026-09-22T08:00:00',
    updatedAt: '2026-09-22T08:00:00',
    status: 'Open',
    assignedTeam: null,
    assignedAgent: null,
    agentResponse: null,
    resolution: null,
    contactMethod: 'email',
    priority: 'Critical',
    aiAnalysis: null,
  },
  {
    id: 'ST-2026-1010',
    customerId: 'C005',
    customerName: 'Sara Khan',
    subject: 'Delivery delayed by 10 days',
    description: 'My order was supposed to arrive 10 days ago but it is still showing in transit. This is very annoying. I need my order delivered immediately.',
    category: 'Delivery',
    orderId: 'ORD-88900',
    createdAt: '2026-09-18T11:30:00',
    updatedAt: '2026-09-20T15:00:00',
    status: 'In Progress',
    assignedTeam: 'Logistics Team',
    assignedAgent: 'Deepak Kumar',
    agentResponse: 'We have contacted the courier partner and your order is being prioritized for delivery.',
    resolution: null,
    contactMethod: 'phone',
    priority: 'High',
    aiAnalysis: null,
  },
  {
    id: 'ST-2026-1011',
    customerId: 'C001',
    customerName: 'Priya Sharma',
    subject: 'Payment failed and order cancelled',
    description: 'My payment failed and the order got cancelled automatically. I was charged but the order shows cancelled. This has happened before with your payment system.',
    category: 'Payment',
    orderId: 'ORD-91350',
    createdAt: '2026-09-22T07:00:00',
    updatedAt: '2026-09-22T07:00:00',
    status: 'Open',
    assignedTeam: null,
    assignedAgent: null,
    agentResponse: null,
    resolution: null,
    contactMethod: 'email',
    priority: 'Critical',
    aiAnalysis: null,
  },
  {
    id: 'ST-2026-1012',
    customerId: 'C002',
    customerName: 'Rahul Mehta',
    subject: 'Cannot update my phone number',
    description: 'I want to update my phone number in my account but the option is greyed out. Please help.',
    category: 'Account',
    orderId: null,
    createdAt: '2026-09-21T16:00:00',
    updatedAt: '2026-09-21T16:00:00',
    status: 'Open',
    assignedTeam: null,
    assignedAgent: null,
    agentResponse: null,
    resolution: null,
    contactMethod: 'email',
    priority: 'Low',
    aiAnalysis: null,
  },
];

// Generate extra tickets to increase dataset availability to ~100
const extraSubjects = [
  { c: 'Delivery', s: 'Package marked delivered but not received', d: 'My tracking says delivered, but I have not received anything. I need this urgently.' },
  { c: 'Payment', s: 'Card declined repeatedly', d: 'I am trying to pay but my card keeps getting declined despite having sufficient funds.' },
  { c: 'Account', s: 'Email change request', d: 'I need to change my registered email address. The option is not working.' },
  { c: 'Technical', s: 'Website completely down', d: 'The website is not loading at all. I keep getting a 500 error.' },
  { c: 'Refund', s: 'Partial refund received', d: 'I returned two items but only received a refund for one.' },
  { c: 'Product', s: 'Missing parts in box', d: 'The product arrived but is missing the power adapter and cables.' },
  { c: 'Payment', s: 'Unrecognized charge', d: 'There is a charge on my bank statement that I do not recognize. Please refund this.' },
  { c: 'Delivery', s: 'Wrong address delivered', d: 'The courier delivered my package to the wrong building. Please find and deliver to correct address.' },
  { c: 'Technical', s: 'Cannot apply promo code', d: 'I am trying to use a discount code but the system keeps throwing an error message.' },
  { c: 'Account', s: 'Account suspended for no reason', d: 'My account was suddenly suspended and I dont know why. I have orders pending.' }
];

let extraCount = 13;
// Seeded PRNG for consistent mock data across reloads
function seededRandom(seed) {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

let seed = 42;
while (initialMockTickets.length < 100) {
  const r1 = seededRandom(seed++);
  const customer = mockCustomers[Math.floor(r1 * mockCustomers.length)];
  const r2 = seededRandom(seed++);
  const template = extraSubjects[Math.floor(r2 * extraSubjects.length)];
  const r3 = seededRandom(seed++);
  const daysAgo = Math.floor(r3 * 30);
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const r4 = seededRandom(seed++);
  const r5 = seededRandom(seed++);
  
  initialMockTickets.push({
    id: `ST-2026-${1000 + extraCount}`,
    customerId: customer.id,
    customerName: customer.name,
    subject: template.s,
    description: template.d,
    category: template.c,
    orderId: `ORD-${80000 + Math.floor(r4 * 10000)}`,
    createdAt: date,
    updatedAt: date,
    status: ['Open', 'In Progress', 'Resolved', 'Closed'][Math.floor(r5 * 4)],
    assignedTeam: null,
    assignedAgent: null,
    agentResponse: null,
    resolution: null,
    contactMethod: ['email', 'phone', 'chat'][Math.floor(seededRandom(seed++) * 3)],
    priority: null, 
    aiAnalysis: null,
  });
  extraCount++;
}

// Generate AI analysis for all initial tickets
initialMockTickets.forEach(ticket => {
  ticket.aiAnalysis = generateAIAnalysis(ticket, initialMockTickets);
});
