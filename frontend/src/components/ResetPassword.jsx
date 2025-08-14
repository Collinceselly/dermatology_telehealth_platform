// /home/collince/Dermatology_telehealth_platform/frontend/src/components/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaExclamationCircle, FaCheckCircle, FaLock, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_new_password: '',
  });
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false)
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
      reset_otp: sessionStorage.getItem('reset_otp'),
    });
    if (!sessionStorage.getItem('reset_email') || !sessionStorage.getItem('reset_otp')) {
      setError('Session expired. Please start the password reset process again.');
      setTimeout(() => navigate('/forgot-password'), 2000);
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !csrfToken) return;
    if (!sessionStorage.getItem('reset_email') || !sessionStorage.getItem('reset_otp')) {
      setError('Session expired. Please start the password reset process again.');
      setTimeout(() => navigate('/forgot-password'), 2000);
      return;
    }

    // Client-side password validation
    if (formData.new_password !== formData.confirm_new_password) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.new_password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const requestData = {
      email: sessionStorage.getItem('reset_email').toLowerCase(),
      otp: sessionStorage.getItem('reset_otp'),
      new_password: formData.new_password,
      confirm_new_password: formData.confirm_new_password,
    };
    console.log('Sending password reset data:', {
      email: requestData.email,
      otp: '****', // Mask OTP in logs
      new_password: '****',
      confirm_new_password: '****',
    });

    try {
      const response = await axios.post('http://localhost:8000/user/password-reset-confirm/', requestData, {
        headers: { 'X-CSRFToken': csrfToken },
        withCredentials: true,
      });
      setSuccess('Password reset successfully.');
      sessionStorage.removeItem('reset_email');
      sessionStorage.removeItem('reset_otp');
      setTimeout(() => {
        navigate('/login');
        setIsSubmitting(false);
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to reset password.';
      setError(errorMsg);
      console.error('Password reset error:', err.response?.data);
      setIsSubmitting(false);
    }
  };

  // Show password functionality that toggles between hide password and hide password
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-cyan-800">Reset Password</h2>
        <p className="text-center text-gray-600">Enter your new password.</p>
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
            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="new_password"
                id="new_password"
                value={formData.new_password}
                onChange={handleChange}
                placeholder="Enter new password"
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
                aria-required="true"
              />
              <button
                type='button'
                onClick={toggleShowPassword}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              {/* <FaLock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" /> */}
            </div>
          </div>
          <div>
            <label htmlFor="confirm_new_password" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirm_new_password"
                id="confirm_new_password"
                value={formData.confirm_new_password}
                onChange={handleChange}
                placeholder="Confirm new password"
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
                aria-required="true"
              />
              <button
                type='button'
                onClick={toggleShowPassword}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              {/* <FaLock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" /> */}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !csrfToken}
            className={`w-full flex items-center justify-center py-3 px-4 bg-cyan-600 text-white cursor-pointer rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition duration-200 ${isSubmitting || !csrfToken ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Resetting...
              </>
            ) : (
              <>
                <FaArrowRight className="mr-2" />
                Reset Password
              </>
            )}
          </button>
        </form>
        {/* <p className="text-center text-sm text-gray-600">
          Need a new OTP?{' '}
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-cyan-600 hover:underline focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Request a new OTP"
          >
            Resend OTP
          </button>
        </p> */}
      </div>
    </div>
  );
};

export default ResetPassword;