// /home/collince/Dermatology_telehealth_platform/frontend/src/components/VerifyCodeForm.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const VerifyCodeForm = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: new URLSearchParams(location.search).get('email')?.toLowerCase() || '',
    code: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    try {
      const response = await axios.post('http://localhost:8000/user/verify-code/', {
        email: formData.email,
        code: formData.code
      }, {
        withCredentials: true,
      });
      setSuccess('Verification successful! Redirecting to login...');
      setTimeout(() => navigate(response.data.redirect), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code');
      console.error('Verification error:', err.response?.data);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Verify Code</h2>
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
          placeholder="Enter 6-digit code"
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Verify
        </button>
      </div>
    </div>
  );
};

export default VerifyCodeForm;