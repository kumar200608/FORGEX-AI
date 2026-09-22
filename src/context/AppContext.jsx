import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { initialMockTickets, mockCustomers, mockAgents, generateAIAnalysis } from '../data/mockData.js';

const AppContext = createContext(null);

const STORAGE_KEY = 'smartticket_state';

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: state.user,
      tickets: state.tickets,
      notifications: state.notifications,
      registeredCustomers: state.registeredCustomers,
    }));
  } catch { /* ignore */ }
}

export function AppProvider({ children }) {
  const saved = loadState();

  const [user, setUser] = useState(saved?.user || null); // { type: 'customer' | 'agent', data: {...} }

  const initTickets = (() => {
    let raw = saved?.tickets || initialMockTickets;
    
    // Add any missing mock tickets (for when we expand the mock dataset)
    if (raw.length < initialMockTickets.length) {
      const existingIds = new Set(raw.map(t => t.id));
      const newTickets = initialMockTickets.filter(t => !existingIds.has(t.id));
      raw = [...raw, ...newTickets];
    }

    const needsRegeneration = raw.some(t => t.aiAnalysis && !t.aiAnalysis.confidence);
    if (needsRegeneration) {
      raw.forEach(t => {
        t.aiAnalysis = generateAIAnalysis(t, raw);
      });
    }
    return raw;
  })();

  const [tickets, setTickets] = useState(initTickets);
  const [notifications, setNotifications] = useState(saved?.notifications || []);
  const [toasts, setToasts] = useState([]);
  const [registeredCustomers, setRegisteredCustomers] = useState(saved?.registeredCustomers || []);

  // Save state changes
  useEffect(() => {
    saveState({ user, tickets, notifications, registeredCustomers });
  }, [user, tickets, notifications, registeredCustomers]);

  // ========== AUTH ==========
  const login = useCallback((type, credentials) => {
    if (type === 'customer') {
      const customer = [...mockCustomers, ...registeredCustomers].find(
        c => c.email === credentials.email && c.password === credentials.password
      );
      if (customer) {
        setUser({ type: 'customer', data: customer });
        return { success: true };
      }
      return { success: false, error: 'Invalid email or password' };
    } else {
      const agent = mockAgents.find(
        a => (a.email === credentials.email || a.empId === credentials.email) && a.password === credentials.password
      );
      if (agent) {
        setUser({ type: 'agent', data: agent });
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials' };
    }
  }, [registeredCustomers]);

  const register = useCallback((data) => {
    const exists = [...mockCustomers, ...registeredCustomers].find(c => c.email === data.email);
    if (exists) return { success: false, error: 'Email already registered' };
    const newCustomer = {
      id: `C${String(mockCustomers.length + registeredCustomers.length + 1).padStart(3, '0')}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      avatar: data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    };
    setRegisteredCustomers(prev => [...prev, newCustomer]);
    setUser({ type: 'customer', data: newCustomer });
    return { success: true };
  }, [registeredCustomers]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  // ========== TICKETS ==========
  const addTicket = useCallback((ticketData) => {
    const ticketNum = tickets.length + 1;
    const newTicket = {
      id: `ST-2026-${String(1000 + ticketNum).padStart(4, '0')}`,
      customerId: user.data.id,
      customerName: user.data.name,
      subject: ticketData.subject,
      description: ticketData.description,
      category: ticketData.category || null,
      orderId: ticketData.orderId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Open',
      assignedTeam: null,
      assignedAgent: null,
      agentResponse: null,
      resolution: null,
      contactMethod: ticketData.contactMethod || 'email',
      priority: null,
      aiAnalysis: null,
    };

    // Generate AI analysis
    const analysis = generateAIAnalysis(newTicket, tickets);
    newTicket.aiAnalysis = analysis;
    newTicket.category = analysis.category;
    newTicket.priority = analysis.priority;

    setTickets(prev => [newTicket, ...prev]);
    addToast(`Ticket ${newTicket.id} created successfully!`, 'success');

    // Auto-assign if critical
    if (analysis.priority === 'Critical') {
      addNotification({
        type: 'emergency',
        title: 'Critical Ticket Alert',
        message: `New critical ticket ${newTicket.id}: "${newTicket.subject}"`,
        ticketId: newTicket.id,
      });
    }

    return newTicket;
  }, [tickets, user]);

  const updateTicket = useCallback((ticketId, updates) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, ...updates, updatedAt: new Date().toISOString() };
      }
      return t;
    }));
  }, []);

  // ========== NOTIFICATIONS ==========
  const addNotification = useCallback((notification) => {
    const n = {
      id: `N${Date.now()}`,
      ...notification,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [n, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  // ========== TOASTS ==========
  const addToast = useCallback((message, type = 'info') => {
    const toast = { id: Date.now(), message, type };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 4000);
  }, []);

  // ========== COMPUTED ==========
  const getCustomerTickets = useCallback((customerId) => {
    return tickets.filter(t => t.customerId === customerId);
  }, [tickets]);

  const getTicketById = useCallback((id) => {
    return tickets.find(t => t.id === id);
  }, [tickets]);

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
    escalated: tickets.filter(t => t.status === 'Escalated').length,
    closed: tickets.filter(t => t.status === 'Closed').length,
    critical: tickets.filter(t => t.priority === 'Critical').length,
    repeatComplaints: tickets.filter(t => t.aiAnalysis?.isRepeat).length,
    emergencies: tickets.filter(t => t.aiAnalysis?.riskScore?.total >= 80).length,
  };

  // Emergency alerts
  const emergencyAlerts = tickets
    .filter(t => t.aiAnalysis?.riskScore?.total >= 80 && t.status !== 'Resolved' && t.status !== 'Closed')
    .map(t => ({
      ticket: t,
      riskScore: t.aiAnalysis.riskScore.total,
      similarCount: t.aiAnalysis.similarTicketCount,
    }));

  // Category-based mass issues
  const categoryGroups = {};
  tickets.forEach(t => {
    const cat = t.category || 'Other';
    if (!categoryGroups[cat]) categoryGroups[cat] = [];
    categoryGroups[cat].push(t);
  });
  const massIssues = Object.entries(categoryGroups)
    .filter(([, tix]) => tix.filter(t => t.aiAnalysis?.riskScore?.total >= 60).length >= 3)
    .map(([category, tix]) => ({
      category,
      ticketCount: tix.length,
      criticalCount: tix.filter(t => t.priority === 'Critical').length,
      avgRisk: Math.round(tix.reduce((sum, t) => sum + (t.aiAnalysis?.riskScore?.total || 0), 0) / tix.length),
    }));

  const value = {
    user, login, register, logout,
    tickets, addTicket, updateTicket, getCustomerTickets, getTicketById,
    notifications, addNotification, markNotificationRead,
    toasts, addToast,
    stats, emergencyAlerts, massIssues,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
