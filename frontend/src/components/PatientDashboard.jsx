// /home/collince/Dermatology_telehealth_platform/frontend/src/components/PatientDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaExclamationCircle, FaCheckCircle, FaCalendarAlt, FaUser, FaPlus } from 'react-icons/fa';

const PatientDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const refreshToken = useCallback(async () => {
    if (isRefreshing) {
      console.log('Refresh already in progress, skipping');
      return false;
    }
    setIsRefreshing(true);
    try {
      console.log('Cookies before refresh:', document.cookie);
      const response = await axios.post('http://localhost:8000/user/refresh/', {}, {
        withCredentials: true,
      });
      console.log('Token refreshed:', response.data);
      console.log('Cookies after refresh:', document.cookie);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced delay
      setIsRefreshing(false);
      setSuccess('Session refreshed successfully.');
      return true;
    } catch (err) {
      console.error('Token refresh failed:', {
        status: err.response?.status,
        data: err.response?.data,
      });
      setIsRefreshing(false);
      return false;
    }
  }, [isRefreshing]);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/user/protected/', {
        withCredentials: true,
      });
      setData(response.data);
      console.log('Dashboard data:', response.data);
      setSuccess('Dashboard data loaded successfully.');
    } catch (err) {
      console.error('Protected API error:', {
        status: err.response?.status,
        data: err.response?.data,
      });
      if (err.response?.status === 401) {
        console.log('401 error, attempting token refresh');
        const refreshed = await refreshToken();
        if (refreshed) {
          try {
            const response = await axios.get('http://localhost:8000/user/protected/', {
              withCredentials: true,
            });
            setData(response.data);
            console.log('Dashboard data after refresh:', response.data);
            setSuccess('Dashboard data loaded after session refresh.');
          } catch (retryErr) {
            console.error('Retry failed:', {
              status: retryErr.response?.status,
              data: retryErr.response?.data,
            });
            setError('Failed to retrieve dashboard data. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired or invalid token. Please log in again.');
          navigate('/login');
        }
      } else {
        console.error('Dashboard error:', err.response?.data);
        setError('Failed to retrieve dashboard. Please try again.');
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-cyan-800">Patient Dashboard</h2>
        {error && (
          <div className="flex items-center bg-red-100 text-red-700 p-4 rounded-lg animate-fade-in" role="alert">
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
        {!data ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-700">
                Welcome, {data.first_name || data.message.split(', ')[1] || 'Patient'}
              </h3>
              <p className="text-gray-600">Manage your dermatology care with ease.</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/book-appointment')}
                className="flex items-center justify-center bg-cyan-600 text-white py-3 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition duration-200 cursor-pointer"
                aria-label="Book a new appointment"
              >
                <FaPlus className="mr-2" />
                Book Appointment
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center justify-center bg-cyan-600 text-white py-3 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition duration-200 cursor-pointer"
                aria-label="View your profile"
              >
                <FaUser className="mr-2" />
                View Profile
              </button>
            </div>

            {/* Appointments Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Upcoming Appointments</h3>
              {data.appointments && data.appointments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.appointments.map((appointment, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      role="article"
                      aria-labelledby={`appointment-${index}`}
                    >
                      <h4 id={`appointment-${index}`} className="text-gray-800 font-medium">
                        <FaCalendarAlt className="inline mr-2 text-cyan-600" />
                        {appointment.date} at {appointment.time}
                      </h4>
                      <p className="text-gray-600">With Dr. {appointment.doctor}</p>
                      <p className="text-gray-600">Type: {appointment.type}</p>
                      <button
                        onClick={() => navigate(`/appointment/${appointment.id}`)}
                        className="mt-2 text-cyan-600 hover:underline focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        aria-label={`View details for appointment on ${appointment.date}`}
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No upcoming appointments.</p>
              )}
            </div>

            {/* Logout Button */}
            <div className="text-center">
              <button
                onClick={() => navigate('/logout')}
                className="bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200 cursor-pointer"
                aria-label="Log out of your account"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;