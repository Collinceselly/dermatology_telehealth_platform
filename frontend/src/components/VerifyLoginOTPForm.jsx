// /home/collince/Dermatology_telehealth_platform/frontend/src/components/VerifyLoginOTPForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

// Utility function to mask email and phone number
const maskSensitiveData = (type, value) => {
  if (!value || value === 'Not provided') return 'Not provided';
  
  if (type === 'email') {
    const [localPart, domain] = value.split('@');
    if (localPart.length <= 2) return `${localPart}@****`;
    const visiblePart = localPart.slice(0, 2);
    const maskedPart = localPart.slice(2).replace(/./g, '*');
    const domainParts = domain.split('.');
    const maskedDomain = domainParts[0].slice(0, 1) + '****' + '.' + domainParts.slice(1).join('.');
    return `${visiblePart}${maskedPart}@${maskedDomain}`;
  }
  
  if (type === 'phone_number') {
    if (value.length <= 6) return value.replace(/./g, '*');
    return value.slice(0, 4) + '****' + value.slice(-4);
  }
  
  return value;
};

const VerifyLoginOTPForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: sessionStorage.getItem('verify_email') || 'Not provided',
    phone_number: sessionStorage.getItem('verify_phone_number') || 'Not provided',
    code: '',
  });
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch CSRF token on component mount
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
        setError('Failed to initialize OTP verification. Please refresh.');
      }
    };
    fetchCsrfToken();
    // Debug sessionStorage
    console.log('Session Storage:', {
      verify_email: sessionStorage.getItem('verify_email'),
      verify_phone_number: sessionStorage.getItem('verify_phone_number'),
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    if (!csrfToken) {
      setError('CSRF token not available. Please try again.');
      setIsSubmitting(false);
      return;
    }

    console.log('Sending OTP verification data:', { email: formData.email, phone_number: formData.phone_number, code: formData.code });
    try {
      const response = await axios.post('http://localhost:8000/user/login-otp/', {
        email: formData.email === 'Not provided' ? '' : formData.email,
        phone_number: formData.phone_number === 'Not provided' ? '' : formData.phone_number,
        code: formData.code,
      }, {
        headers: {
          'X-CSRFToken': csrfToken,
        },
        withCredentials: true,
      });
      setSuccess('Login successful! Redirecting to dashboard...');
      // Clear sessionStorage
      sessionStorage.removeItem('verify_email');
      sessionStorage.removeItem('verify_phone_number');
      console.log('Session Storage after clear:', {
        verify_email: sessionStorage.getItem('verify_email'),
        verify_phone_number: sessionStorage.getItem('verify_phone_number'),
      });
      setTimeout(() => {
        navigate(response.data.redirect);
        setIsSubmitting(false);
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Invalid OTP';
      setError(errorMsg);
      console.error('OTP verification error:', err.response?.data);
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:8000/user/resend-otp/', {
        email: formData.email === 'Not provided' ? '' : formData.email,
        phone_number: formData.phone_number === 'Not provided' ? '' : formData.phone_number,
      }, {
        headers: {
          'X-CSRFToken': csrfToken,
        },
        withCredentials: true,
      });
      setSuccess('OTP resent! Check your email or phone.');
      setIsSubmitting(false);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to resend OTP';
      setError(errorMsg);
      console.error('Resend OTP error:', err.response?.data);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-cyan-800">Verify Your OTP</h2>
        {error && (
          <div className="flex items-center bg-red-100 text-red-700 p-4 rounded-lg" role="alert">
            <FaExclamationCircle className="mr-2" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center bg-green-100 text-green-700 p-4 rounded-lg animate-fade-in" role="alert">
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
              value={maskSensitiveData('email', formData.email)}
              readOnly
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              aria-describedby="email-info"
              placeholder="Email not available"
            />
          </div>
          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              id="phone_number"
              value={maskSensitiveData('phone_number', formData.phone_number)}
              readOnly
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              aria-describedby="phone-info"
              placeholder="Phone number not available"
            />
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">OTP Code</label>
            <input
              type="text"
              name="code"
              id="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Enter 6-digit OTP"
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
              aria-required="true"
              aria-describedby="otp-error"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 bg-cyan-600 text-white rounded-lg cursor-pointer hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          Didn’t receive an OTP?{' '}
          <button
            onClick={handleResendOTP}
            disabled={isSubmitting}
            className={`text-cyan-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyLoginOTPForm;