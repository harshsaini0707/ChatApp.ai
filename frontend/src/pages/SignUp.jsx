import axios from 'axios';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignUp = () => {
  const[form , setForm ] = useState({
    name:"",
    email:"",
    password:""
  })
  const navigate = useNavigate();
  const[status ,  setStatus] = useState('');
  const {setUser} =  useAuth();
  const handleChange = (e) =>{
    const {name , value} =  e.target;

    setForm((prev)=>({
      ...prev,
      [name] : value
    }))
  }
  const handleSubmit =  async(e)=>{
       e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}auth/signup`, form ,{
        withCredentials:true
      })

      console.log(response);
      setStatus(response?.data?.message)
      setUser(response?.data?.user)

      navigate('/chat');
      
    } catch (error) {
      console.log(error);
      setStatus(error?.response?.data?.message)
      
    }
  }
  return (
    <div className="h-screen w-screen bg-[radial-gradient(ellipse_at_51%_46%,#001f3f,#000000_72%)] flex items-center justify-center">
      <div className="bg-gradient-to-br from-[#0f2a42]/50 to-[#081728]/75 backdrop-blur-md rounded-xl shadow-xl p-8 w-96 border border-[#1e4a6b]/60 relative overflow-hidden">
        
        <div className="absolute inset-0 bg-gradient-to-br from-[#3e8ed0]/5 to-transparent rounded-xl"></div>
       
        <div className="relative z-10">
          <h1 className="text-white text-3xl font-bold text-center mb-6 font-['Inter',sans-serif] tracking-tight">
            Register
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <label className="font-['Inter',sans-serif] block text-gray-300 text-sm font-medium" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                value={form.name}
                name='name'
                onChange={handleChange}
                type="text"
                placeholder="Full name"
                className="font-['Inter',sans-serif] w-full px-3 py-2.5 rounded-lg bg-[#0a1e32]/80 text-white placeholder-gray-500 border border-[#1a3a57]/50 focus:outline-none focus:ring-2 focus:ring-[#3e8ed0]/50 focus:border-[#3e8ed0] transition-all duration-200 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-['Inter',sans-serif] block text-gray-300 text-sm font-medium" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name='email'
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="you@example.com"
                className="font-['Inter',sans-serif] w-full px-3 py-2.5 rounded-lg bg-[#0a1e32]/80 text-white placeholder-gray-500 border border-[#1a3a57]/50 focus:outline-none focus:ring-2 focus:ring-[#3e8ed0]/50 focus:border-[#3e8ed0] transition-all duration-200 backdrop-blur-sm"
              />
            </div>
        
            <div className="space-y-1">
              <label className="block text-gray-300 text-sm font-medium font-['Inter',sans-serif]" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name='password'
                value={form.password}
                onChange={handleChange}
                type="password"
                placeholder="••••"
                className="font-['Inter',sans-serif] w-full px-3 py-2.5 rounded-lg bg-[#0a1e32]/80 text-white placeholder-gray-500 border border-[#1a3a57]/50 focus:outline-none focus:ring-2 focus:ring-[#3e8ed0]/50 focus:border-[#3e8ed0] transition-all duration-200 backdrop-blur-sm"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#3e8ed0] to-[#2b7bc7] hover:from-[#3276b6] hover:to-[#245a94] text-white py-2.5 rounded-lg font-semibold font-['Inter',sans-serif] transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              SignUp
            </button>
          </form>
          
          {status && (
            <p className="text-center text-sm mt-3 text-gray-300">{status}</p>
          )}
          
          <div className="mt-6 pt-4 border-t border-[#1a3a57]/40">
            <p className="text-gray-400 text-sm text-center font-['Inter',sans-serif]">
              Already have an account?{' '}
              <a href="/login" className="text-[#3e8ed0] hover:text-[#5ba3e0] font-medium hover:underline transition-colors duration-200">
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp
