// /home/collince/Dermatology_telehealth_platform/frontend/src/components/RegisterForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaExclamationCircle, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/user/register/', formData);
      setSuccess(response.data.message);
      setTimeout(() => {
        navigate(`/verify?email=${encodeURIComponent(response.data.email)}`);
      }, 1500);
    } catch (err) {
      // setError(err.response?.data?.email?.[0] || err.response?.data?.phone_number?.[0] || 'Registration failed');
      // setIsSubmitting(false);
      // Handle specific field errors
      const errors = err.response?.data || {};
      let errorMsg = '';
      if (errors.password && Array.isArray(errors.password)) {
        errorMsg = errors.password[0]; // e.g., "Password must contain at least one uppercase letter."
      } else if (errors.email && Array.isArray(errors.email)) {
        errorMsg = errors.email[0];
      } else if (errors.phone_number && Array.isArray(errors.phone_number)) {
        errorMsg = errors.phone_number[0];
      } else if (errors.non_field_errors && Array.isArray(errors.non_field_errors)) {
        errorMsg = errors.non_field_errors[0]; // e.g., "Passwords do not match."
      } else if (errors.error) {
        errorMsg = typeof errors.error === 'string' ? errors.error : errors.error.password || 'Registration failed.';
      } else {
        errorMsg = 'Registration failed. Please check your input.';
      }
      setError(errorMsg);
      console.error('Registration error:', err.response?.data);
      setIsSubmitting(false);
    }
  };

  // Show password functionality that toggles between hide password and hide password
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-cyan-800">Create Your Account</h2>
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
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="first_name"
                id="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="John"
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
                aria-required="true"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="last_name"
                id="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
                aria-required="true"
              />
            </div>
          </div>
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
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              id="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="+254..."
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
              aria-required="true"
              pattern="\+254[0-9]{9}"
              title="Phone number must start with +254 followed by 9 digits"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <div className='relative'>
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
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <div className='relative'>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm_password"
                id="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Confirm your password"
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
                aria-required="true"
              />
              <button
                  type='button'
                  onClick={toggleShowConfirmPassword}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none'
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 bg-cyan-600 text-white rounded-lg cursor-pointer hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;