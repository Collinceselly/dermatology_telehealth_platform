// /home/collince/Dermatology_telehealth_platform/frontend/src/components/LogoutPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaExclamationCircle, FaCheckCircle, FaSignOutAlt, FaArrowLeft } from 'react-icons/fa';

const LogoutPage = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post('http://localhost:8000/user/logout/', {}, {
        withCredentials: true,
      });
      setSuccess(response.data.message || 'Logged out successfully.');
      // Clear sessionStorage for security
      sessionStorage.removeItem('verify_email');
      sessionStorage.removeItem('verify_phone_number');
      console.log('Session Storage after logout:', {
        verify_email: sessionStorage.getItem('verify_email'),
        verify_phone_number: sessionStorage.getItem('verify_phone_number'),
      });
      setTimeout(() => {
        navigate('/login');
        setIsLoading(false);
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to log out. Please try again.';
      setError(errorMsg);
      console.error('Logout error:', err.response?.data);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-cyan-800">Log Out</h2>
        <p className="text-center text-gray-600">Are you sure you want to log out of your account?</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className={`flex items-center justify-center bg-red-500 cursor-pointer text-white py-3 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Confirm logout"
            aria-busy={isLoading}
          >
            <FaSignOutAlt className="mr-2" />
            {isLoading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Logging out...
              </>
            ) : (
              'Confirm Logout'
            )}
          </button>
          <button
            onClick={() => navigate('/patient-dashboard')}
            disabled={isLoading}
            className={`flex items-center justify-center cursor-pointer bg-cyan-600 text-white py-3 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Return to dashboard"
          >
            <FaArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;