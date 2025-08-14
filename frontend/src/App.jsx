// /home/collince/Dermatology_telehealth_platform/frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterForm from './components/RegisterForm';
import VerifyCodeForm from './components/VerifyCodeForm';
import LoginForm from './components/LoginForm';
import VerifyLoginOTPForm from './components/VerifyLoginOTPForm';
import PatientDashboard from './components/PatientDashboard';
import LogoutPage from './components/LogoutPage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import VerifyResetOTP from './components/VerifyResetOTP';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/verify" element={<VerifyCodeForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/login-otp" element={<VerifyLoginOTPForm />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-otp" element={<VerifyResetOTP />} />
      </Routes>
    </Router>
  );
}

export default App;