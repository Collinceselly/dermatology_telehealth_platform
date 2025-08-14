// /home/collince/Dermatology_telehealth_platform/frontend/src/components/LoginForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaExclamationCircle, FaCheckCircle, FaLock, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

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
        setError('Failed to initialize login. Please refresh.');
      }
    };
    fetchCsrfToken();
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

    console.log('Sending login data:', { ...formData, csrfToken });
    try {
      const response = await axios.post('http://localhost:8000/user/login/', {
        email: formData.email.toLowerCase(),
        password: formData.password,
      }, {
        headers: {
          'X-CSRFToken': csrfToken,
        },
        withCredentials: true,
      });
      // Store email and phone_number in sessionStorage
      sessionStorage.setItem('verify_email', formData.email.toLowerCase());
      sessionStorage.setItem('verify_phone_number', response.data.phone_number || '');
      setSuccess('OTP sent! Redirecting to verify...');
      setTimeout(() => {
        navigate(response.data.redirect); // Navigate to /verify without query params
        setIsSubmitting(false);
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Invalid email or password';
      setError(errorMsg);
      console.error('Login error:', err.response?.data);
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
        <h2 className="text-3xl font-bold text-center text-cyan-800">Log In to Your Account</h2>
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
              value={formData.email}
              onChange={handleChange}
              placeholder="johndoe@example.com"
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
              aria-required="true"
              aria-describedby="email-error"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
                aria-required="true"
              />
              <FaLock className='absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400' />
              <button
                type='button'
                onClick={toggleShowPassword}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}

              </button>
            </div>
          </div>
          <p className="text-right text-sm text-gray-600">
          {/* Forgot your password?{' '} */}
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-cyan-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Go to forgot password page"
          >
            Forgot Password
          </button>
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-cyan-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;