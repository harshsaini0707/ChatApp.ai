import React, { useState } from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom'
import { useAuth } from '../context/AuthContext';


const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const {setUser} =  useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleForm = async (e) => {
    e.preventDefault();
    console.log('click login');
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}auth/login`,
        form,
        { 
           headers: { "Content-Type": "application/json" },
          withCredentials: true }
      );
      setStatus(response?.data?.message || "Login successful");
      console.log(response?.data);

    setUser(response?.data?.user)
      
    navigate("/chat");
    } catch (error) {
      console.log(error);
      
      setStatus(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="h-screen w-screen bg-[radial-gradient(ellipse_at_51%_46%,#001f3f,#000000_72%)] flex items-center justify-center">
      <div className="bg-gradient-to-br from-[#0f2a42]/50 to-[#081728]/75 backdrop-blur-md rounded-xl shadow-xl p-6 w-80 border border-[#1e4a6b]/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3e8ed0]/5 to-transparent rounded-xl"></div>
        <div className="relative z-10">
          <h1 className="text-white text-3xl font-bold text-center mb-6">
            Welcome Back
          </h1>

          <form onSubmit={handleForm} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-gray-300 text-sm font-medium" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a1e32]/80 text-white placeholder-gray-500 border border-[#1a3a57]/50 focus:outline-none focus:ring-2 focus:ring-[#3e8ed0]/50 focus:border-[#3e8ed0] transition-all duration-200 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-gray-300 text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a1e32]/80 text-white placeholder-gray-500 border border-[#1a3a57]/50 focus:outline-none focus:ring-2 focus:ring-[#3e8ed0]/50 focus:border-[#3e8ed0] transition-all duration-200 backdrop-blur-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#3e8ed0] to-[#2b7bc7] hover:from-[#3276b6] hover:to-[#245a94] text-white py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Login
            </button>
          </form>

          {status && (
            <p className="text-center text-sm mt-3 text-gray-300">{status}</p>
          )}

          <div className="mt-6 pt-4 border-t border-[#1a3a57]/40">
            <p className="text-gray-400 text-sm text-center">
              Don't have an account?{' '}
              <a href="/signup" className="text-[#3e8ed0] hover:text-[#5ba3e0] font-medium hover:underline transition-colors duration-200">
                Create one
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
