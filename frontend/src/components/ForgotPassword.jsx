// /home/collince/Dermatology_telehealth_platform/frontend/src/components/ForgotPassword.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaExclamationCircle, FaCheckCircle, FaArrowRight } from 'react-icons/fa';

const ForgotPassword = () => {
  const [formData, setFormData] = useState({ email: '' });
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Fetch CSRF token
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
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !csrfToken) return;
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // Validate email existence
    try {
      await axios.post('http://localhost:8000/user/check-email/', {
        email: formData.email.toLowerCase(),
      }, {
        headers: { 'X-CSRFToken': csrfToken },
        withCredentials: true,
      });
      // Email exists, proceed to send OTP
      try {
        const response = await axios.post('http://localhost:8000/user/password-reset-request/', {
          email: formData.email.toLowerCase(),
        }, {
          headers: { 'X-CSRFToken': csrfToken },
          withCredentials: true,
        });
        sessionStorage.setItem('reset_email', formData.email.toLowerCase());
        setSuccess('OTP sent to your email and phone (if registered).');
        setTimeout(() => {
          navigate('/reset-otp');
          setIsSubmitting(false);
        }, 1500);
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Failed to send OTP.';
        setError(errorMsg);
        console.error('Password reset request error:', err.response?.data);
        setIsSubmitting(false);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to validate email.';
      setError(errorMsg);
      console.error('Email check error:', err.response?.data);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-cyan-800">Forgot Password</h2>
        <p className="text-center text-gray-600">Enter your email to receive a one-time code.</p>
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
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
              aria-required="true"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !csrfToken}
            className={`w-full flex items-center justify-center py-3 px-4 bg-cyan-600 text-white rounded-lg cursor-pointer hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition duration-200 ${isSubmitting || !csrfToken ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Checking...
              </>
            ) : (
              <>
                <FaArrowRight className="mr-2" />
                Next
              </>
            )}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          Remember your password?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-cyan-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Return to login page"
          >
            Log in
          </button>
        </p>
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-cyan-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Return to login page"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;