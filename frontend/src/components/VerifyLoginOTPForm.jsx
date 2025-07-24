// /home/collince/Dermatology_telehealth_platform/frontend/src/components/VerifyLoginOTPForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const VerifyLoginOTPForm = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: new URLSearchParams(location.search).get('email')?.toLowerCase() || '',
    code: '',
  });
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

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
      }
    };
    fetchCsrfToken();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!csrfToken) {
      setError('CSRF token not available. Please try again.');
      return;
    }
    console.log('Sending OTP verification data:', { email: formData.email, code: formData.code });
    try {
      const response = await axios.post('http://localhost:8000/user/login-otp/', {
        email: formData.email,
        code: formData.code
      }, {
        headers: {
          'X-CSRFToken': csrfToken,
        },
        withCredentials: true,
      });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setSuccess('Login successful! Redirecting to dashboard...');
      setTimeout(() => navigate(response.data.redirect), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Invalid OTP';
      setError(errorMsg);
      console.error('OTP verification error:', err.response?.data);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Verify Login OTP</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      <div className="space-y-4">
        <input
          type="email"
          name="email"
          value={formData.email}
          readOnly
          className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
        />
        <input
          type="text"
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder="Enter 6-digit OTP"
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Verify OTP
        </button>
      </div>
    </div>
  );
};

export default VerifyLoginOTPForm;