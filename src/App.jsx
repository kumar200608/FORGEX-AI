import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import ToastContainer from './components/ToastContainer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import SubmitTicket from './pages/customer/SubmitTicket';
import CustomerTickets from './pages/customer/CustomerTickets';
import CustomerTicketDetail from './pages/customer/CustomerTicketDetail';
import CompanyLayout from './pages/company/CompanyLayout';
import CompanyDashboard from './pages/company/CompanyDashboard';
import AllTickets from './pages/company/AllTickets';
import CompanyTicketDetail from './pages/company/CompanyTicketDetail';
import AIAnalysisPage from './pages/company/AIAnalysisPage';
import EmergencyAlerts from './pages/company/EmergencyAlerts';
import AnalyticsPage from './pages/company/AnalyticsPage';
import DatasetUpload from './pages/company/DatasetUpload';

function ProtectedRoute({ children, type }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (type && user.type !== type) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer Routes */}
        <Route path="/customer" element={<ProtectedRoute type="customer"><CustomerLayout /></ProtectedRoute>}>
          <Route index element={<CustomerDashboard />} />
          <Route path="submit" element={<SubmitTicket />} />
          <Route path="tickets" element={<CustomerTickets />} />
          <Route path="ticket/:id" element={<CustomerTicketDetail />} />
        </Route>

        {/* Company Routes */}
        <Route path="/company" element={<ProtectedRoute type="agent"><CompanyLayout /></ProtectedRoute>}>
          <Route index element={<CompanyDashboard />} />
          <Route path="tickets" element={<AllTickets />} />
          <Route path="ticket/:id" element={<CompanyTicketDetail />} />
          <Route path="ai-analysis" element={<AIAnalysisPage />} />
          <Route path="alerts" element={<EmergencyAlerts />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="dataset-upload" element={<DatasetUpload />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
