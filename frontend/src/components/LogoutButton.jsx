// /home/collince/Dermatology_telehealth_platform/frontend/src/components/LogoutButton.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LogoutButton = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    setError('');
    setSuccess('');
    try {
      const response = await axios.post('http://localhost:8000/user/logout/', {}, {
        withCredentials: true,
      });
      setSuccess(response.data.message);
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to log out';
      setError(errorMsg);
      console.error('Logout error:', err.response?.data);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-4">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      <button
        onClick={handleLogout}
        className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
};

export default LogoutButton;