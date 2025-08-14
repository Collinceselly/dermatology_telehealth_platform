// /home/collince/Dermatology_telehealth_platform/frontend/src/components/VerifyRegistrationOTPForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaExclamationCircle, FaCheckCircle, FaArrowRight, FaRedo } from 'react-icons/fa';

const VerifyRegistrationOTPForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: new URLSearchParams(location.search).get('email')?.toLowerCase() || '',
    code: '',
  });
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [showRestart, setShowRestart] = useState(false);

  // Mask email for HIPAA compliance
  const maskEmail = (email) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    const [domainName, tld] = domain?.split('.') || ['', ''];
    return `${local.slice(0, 2)}${'*'.repeat(Math.max(0, local.length - 4))}${local.slice(-2)}@${domainName[0]}${'*'.repeat(Math.max(0, domainName.length - 2))}.${tld}`;
  };

  // Fetch CSRF token on mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await axios.get('http://localhost:8000/user/get-csrf/', {
          withCredentials: true,
        });
        setCsrfToken(response.data.csrfToken);
        console.log('Fetched CSRF token:', response.data.csrfToken);
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
        setError('Failed to initialize verification. Please refresh.');
      }
    };
    fetchCsrfToken();
  }, []);

  // Handle resend cooldown
  useEffect(() => {
    const savedTimestamp = sessionStorage.getItem('resend_timestamp');
    const savedAttempts = parseInt(sessionStorage.getItem('resend_attempts') || '0', 10);
    setResendAttempts(savedAttempts);

    if (savedTimestamp) {
      const elapsed = (Date.now() - parseInt(savedTimestamp, 10)) / 1000;
      const initialCooldown = Math.max(0, 60 - elapsed);
      setResendCooldown(initialCooldown);
      setIsResendDisabled(initialCooldown > 0 || savedAttempts >= 3);
      if (savedAttempts >= 3) setShowRestart(true);
    }

    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          const newCooldown = prev - 1;
          if (newCooldown <= 0) {
            setIsResendDisabled(resendAttempts >= 3);
            clearInterval(timer);
          }
          return newCooldown;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown, resendAttempts]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !csrfToken) return;
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    console.log('Sending verification data:', { email: formData.email, code: '****' });
    try {
      const response = await axios.post('http://localhost:8000/user/verify-code/', formData, {
        headers: { 'X-CSRFToken': csrfToken },
        withCredentials: true,
      });
      setSuccess('Verification successful! Redirecting to login...');
      sessionStorage.removeItem('resend_timestamp');
      sessionStorage.removeItem('resend_attempts');
      setTimeout(() => {
        navigate(response.data.redirect || '/login');
        setIsSubmitting(false);
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.code?.[0] || err.response?.data?.error || 'Invalid verification code.';
      setError(errorMsg);
      console.error('Verification error:', err.response?.data);
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendAttempts >= 3 || isResendDisabled) return;
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:8000/user/resend-registration-otp/', { email: formData.email }, {
        headers: { 'X-CSRFToken': csrfToken },
        withCredentials: true,
      });
      setSuccess(`OTP resent successfully (${resendAttempts + 1}/3).`);
      setFormData({ ...formData, code: '' });
      setResendAttempts((prev) => {
        const newAttempts = prev + 1;
        sessionStorage.setItem('resend_attempts', newAttempts);
        if (newAttempts >= 3) {
          setShowRestart(true);
          setIsResendDisabled(true);
        } else {
          setResendCooldown(60);
          setIsResendDisabled(true);
          sessionStorage.setItem('resend_timestamp', Date.now());
        }
        return newAttempts;
      });
      setIsSubmitting(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
      console.error('Resend OTP error:', err.response?.data);
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    sessionStorage.removeItem('resend_timestamp');
    sessionStorage.removeItem('resend_attempts');
    navigate('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-cyan-800">Verify Your Account</h2>
        <p className="text-center text-gray-600">
          Enter the 6-digit code sent to {maskEmail(formData.email)}.
        </p>
        {error && (
          <div className="flex items-center bg-red-100 text-red-700 p-4 rounded-lg animate-fade-in" role="alert" aria-live="assertive">
            <FaExclamationCircle className="mr-2" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center bg-green-100 text-green-700 p-4 rounded-lg animate-fade-in" role="alert" aria-live="assertive">
            <FaCheckCircle className="mr-2" />
            <p>{success}</p>
          </div>
        )}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={maskEmail(formData.email)}
              readOnly
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed focus:outline-none"
              aria-describedby="email-description"
            />
            <p id="email-description" className="text-sm text-gray-500 mt-1">
              OTP was sent to your registered email.
            </p>
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">Verification Code</label>
            <input
              type="text"
              name="code"
              id="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Enter 6-digit code"
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
              aria-required="true"
              maxLength="6"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !csrfToken}
            className={`w-full flex items-center justify-center py-3 px-4 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition duration-200 ${isSubmitting || !csrfToken ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-busy={isSubmitting}
            aria-label="Verify OTP code"
          >
            {isSubmitting ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Verifying...
              </>
            ) : (
              <>
                <FaArrowRight className="mr-2" />
                Verify
              </>
            )}
          </button>
        </form>
        <div className="flex justify-between items-center">
          <button
            onClick={handleResendOTP}
            disabled={isResendDisabled || isSubmitting}
            className={`flex items-center text-cyan-600 hover:underline focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200 ${isResendDisabled || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Resend OTP code"
          >
            Resend OTP {resendAttempts > 0 && `(${resendAttempts}/3)`}
            {resendCooldown > 0 && ` (${Math.ceil(resendCooldown)}s)`}
          </button>
          {showRestart && (
            <button
              onClick={handleRestart}
              className="flex items-center text-cyan-600 hover:underline focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200"
              aria-label="Restart registration process"
            >
              <FaRedo className="mr-1" />
              Start Over
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyRegistrationOTPForm;