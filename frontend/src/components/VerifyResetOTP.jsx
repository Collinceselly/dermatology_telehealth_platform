// /home/collince/Dermatology_telehealth_platform/frontend/src/components/VerifyResetOTP.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaExclamationCircle, FaCheckCircle, FaArrowRight, FaRedo } from 'react-icons/fa';

// Reuse masking function
// const maskSensitiveData = (type, value) => {
//   if (!value || value === 'Not provided') return 'Not provided';
//   if (type === 'email') {
//     const [localPart, domain] = value.split('@');
//     if (localPart.length <= 2) return `${localPart}@****`;
//     const visiblePart = localPart.slice(0, 2);
//     const maskedPart = localPart.slice(2).replace(/./g, '*');
//     const domainParts = domain.split('.');
//     const maskedDomain = domainParts[0].slice(0, 1) + '****' + '.' + domainParts.slice(1).join('.');
//     return `${visiblePart}${maskedPart}@${maskedDomain}`;
//   }
//   return value;
// };

const VerifyResetOTP = () => {
  const [formData, setFormData] = useState({
    email: sessionStorage.getItem('reset_email') || 'Not provided',
    otp: '',
  });
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);  // Start with initial cooldown
  const [resendAttempts, setResendAttempts] = useState(
    parseInt(sessionStorage.getItem('resend_attempts')) || 0
  );
  const maxResendAttempts = 3;
  const cooldownDuration = 30; // 60 seconds
  const attemptResetTimeout = 1800000; // 30 minutes in ms
  const navigate = useNavigate();

  // Fetch CSRF token and validate session storage
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
        setError('Failed to initialize. Please refresh.');
      }
    };
    fetchCsrfToken();
    console.log('Session Storage:', {
      reset_email: sessionStorage.getItem('reset_email'),
      resend_attempts: sessionStorage.getItem('resend_attempts'),
      resend_timestamp: sessionStorage.getItem('resend_timestamp'),
    });

    // Reset attempts if 30 minutes have passed
    const timestamp = parseInt(sessionStorage.getItem('resend_timestamp')) || 0;
    if (timestamp && Date.now() - timestamp > attemptResetTimeout) {
      sessionStorage.setItem('resend_attempts', '0');
      sessionStorage.removeItem('resend_timestamp');
      setResendAttempts(0);
    }

    if (!sessionStorage.getItem('reset_email')) {
      setError('No email found. Please start the password reset process again.');
      setTimeout(() => navigate('/forgot-password'), 2000);
    }

    // Set initial cooldown message
    setSuccess('Initial OTP sent. Resend available after cooldown.');
  }, [navigate]);

  // Handle resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !csrfToken) return;
    if (formData.email === 'Not provided') {
      setError('Email is required. Please start the password reset process again.');
      setTimeout(() => navigate('/forgot-password'), 2000);
      return;
    }
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const requestData = {
      email: formData.email.toLowerCase(),
      otp: formData.otp,
    };
    console.log('Sending OTP verification data:', { email: requestData.email, otp: '****' });

    try {
      const response = await axios.post('http://localhost:8000/user/password-reset-confirm/', requestData, {
        headers: { 'X-CSRFToken': csrfToken },
        withCredentials: true,
      });
      sessionStorage.setItem('reset_otp', formData.otp); // Store OTP
      sessionStorage.setItem('resend_attempts', '0'); // Reset attempts
      sessionStorage.removeItem('resend_timestamp');
      setResendAttempts(0);
      setSuccess('OTP verified. Proceed to reset password.');
      setTimeout(() => {
        navigate('/reset-password');
        setIsSubmitting(false);
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Invalid OTP or request expired.';
      setError(errorMsg);
      console.error('OTP verification error:', err.response?.data);
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || resendAttempts >= maxResendAttempts || !csrfToken) return;
    if (formData.email === 'Not provided') {
      setError('Email is required. Please start the password reset process again.');
      setTimeout(() => navigate('/forgot-password'), 2000);
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:8000/user/password-reset-request/', {
        email: formData.email.toLowerCase(),
      }, {
        headers: { 'X-CSRFToken': csrfToken },
        withCredentials: true,
      });
      const newAttempts = resendAttempts + 1;
      setResendAttempts(newAttempts);
      sessionStorage.setItem('resend_attempts', newAttempts);
      sessionStorage.setItem('resend_timestamp', Date.now().toString());
      setResendCooldown(cooldownDuration);
      setSuccess('New OTP sent to your email and phone (if registered).');
      setFormData({ ...formData, otp: '' }); // Clear OTP input
      setIsSubmitting(false);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to send OTP.';
      setError(errorMsg);
      console.error('Resend OTP error:', err.response?.data);
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    sessionStorage.removeItem('reset_email');
    sessionStorage.removeItem('reset_otp');
    sessionStorage.setItem('resend_attempts', '0');
    sessionStorage.removeItem('resend_timestamp');
    setResendAttempts(0);
    navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-cyan-800">Verify OTP</h2>
        <p className="text-center text-gray-600">Enter the one-time code sent to your email and phone.</p>
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
        {resendAttempts >= maxResendAttempts && (
          <div className="flex items-center bg-yellow-100 text-yellow-700 p-4 rounded-lg animate-fade-in" role="alert" aria-live="assertive">
            <FaExclamationCircle className="mr-2" />
            <p>Resend limit reached. Try entering a previously sent OTP or restart the process.</p>
          </div>
        )}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={maskSensitiveData('email', formData.email)}
              readOnly
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              aria-describedby="email-info"
            />
          </div> */}
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">OTP Code</label>
            <input
              type="text"
              name="otp"
              id="otp"
              value={formData.otp}
              onChange={handleChange}
              placeholder="Enter 6-digit OTP"
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
              aria-required="true"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !csrfToken || formData.email === 'Not provided'}
            className={`w-full flex items-center justify-center py-3 px-4 bg-cyan-600 text-white rounded-lg cursor-pointer hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition duration-200 ${isSubmitting || !csrfToken || formData.email === 'Not provided' ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Verifying...
              </>
            ) : (
              <>
                <FaArrowRight className="mr-2" />
                Next
              </>
            )}
          </button>
        </form>
        <div className="text-center text-sm text-gray-600 space-y-2">
          <p>
            Didn't receive OTP?{' '}
            <button
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || resendAttempts >= maxResendAttempts || !csrfToken}
              className={`text-cyan-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 ${resendCooldown > 0 || resendAttempts >= maxResendAttempts || !csrfToken ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Request a new OTP"
              aria-disabled={resendCooldown > 0 || resendAttempts >= maxResendAttempts || !csrfToken}
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : resendAttempts >= maxResendAttempts
                ? 'Resend limit reached'
                : 'Resend OTP'}
            </button>
            {resendAttempts > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({resendAttempts}/{maxResendAttempts} attempts used)
              </span>
            )}
          </p>
          {resendAttempts >= maxResendAttempts && (
            <p>
              <button
                onClick={handleRestart}
                className="text-cyan-600 hover:underline focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label="Restart password reset process"
              >
                <FaRedo className="inline mr-1" />
                Restart Password Reset
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyResetOTP;