import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, signup } from '../api/users.js';
import { setSessionUser } from '../storage/session.js';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const role = state?.role || 'student';
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const brandGradient = 'linear-gradient(to right, #7565D9, #4D0ACD)';

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      toast.error('Name and password are required');
      return;
    }

    try {
      setLoading(true);
      const res = isLogin 
        ? await login({ name: name.trim(), password, role })
        : await signup({ name: name.trim(), password, role });
      
      const user = res?.data;
      if (!user?._id) throw new Error(isLogin ? 'Login failed' : 'Signup failed');

      setSessionUser({ id: user._id, name: user.name, role: user.role });
      toast.success(isLogin ? `Welcome back ${user.name}!` : `Welcome ${user.name}!`);
      navigate(role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      toast.error(err.message || `${isLogin ? 'Login' : 'Signup'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 bg-white">
      {/* Logo pill */}
      <div 
        style={{ background: brandGradient }}
        className="text-white px-3 py-1 sm:px-4 sm:py-1 rounded-full flex items-center gap-1 sm:gap-2 mb-6 sm:mb-8 shadow-md"
      >
        <span className="text-[10px] sm:text-xs font-bold italic">✦ KBC Poll</span>
      </div>

      <h1 className="text-2xl sm:text-3xl text-gray-900 mb-2 text-center">
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </h1>
      <p className="text-gray-600 mb-6 sm:mb-8 text-center text-sm sm:text-base">
        {isLogin ? 'Login to continue' : 'Sign up to get started'}
      </p>

      <form onSubmit={onSubmit} className="w-full max-w-xs sm:max-w-sm space-y-3 sm:space-y-4">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !name.trim() || !password.trim()}
          style={{ background: brandGradient }}
          className="w-full text-white py-2 sm:py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {loading ? (isLogin ? 'Logging in...' : 'Creating...') : (isLogin ? 'Login' : 'Sign Up')}
        </button>
      </form>

      <div className="mt-4 sm:mt-6 text-center">
        <p className="text-gray-600 text-sm sm:text-base">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={toggleMode}
            className="ml-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm sm:text-base"
            disabled={loading}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
