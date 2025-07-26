// /home/collince/Dermatology_telehealth_platform/frontend/src/components/PatientDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
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

      // Add delay to ensure cookie is set before retry
      await new Promise(resolve => setTimeout(resolve, 5000));
      setIsRefreshing(false);
      return true;
    } catch (err) {
      console.error('Token refresh failed:', {
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers,
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

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (!data) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 form-container">
      <h2 className="text-2xl font-bold mb-6 text-center text-cyan-800">Patient Dashboard</h2>
      <p className="text-gray-700">Welcome, {data.message}</p>
      <button
        onClick={() => navigate('/logout')}
        className="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600 custom-button"
      >
        Logout
      </button>
    </div>
  );
};

export default PatientDashboard;