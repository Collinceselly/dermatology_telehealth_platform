// /home/collince/Dermatology_telehealth_platform/frontend/src/components/Dashboard.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PatientDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        await axios.get('http://localhost:8000/user/protected/', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Protected route error:', err.response?.data);
        navigate('/login');
      }
    };
    verifyToken();
  }, [navigate]);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Dashboard</h2>
      <p>Welcome to your dashboard!</p>
    </div>
  );
};

export default PatientDashboard;