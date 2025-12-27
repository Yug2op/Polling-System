import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createUser } from '../api/users.js';
import { setSessionUser } from '../storage/session.js';
import toast from 'react-hot-toast';

export default function NameEntry() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const role = state?.role || 'student';
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const brandGradient = 'linear-gradient(to right, #7565D9, #4D0ACD)';

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setLoading(true);
      const res = await createUser({ name: name.trim(), role });
      const user = res?.data;
      if (!user?._id) throw new Error('User creation failed');

      setSessionUser({ id: user._id, name: user.name, role: user.role });
      toast.success(`Welcome ${user.name}!`);
      navigate(role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      {/* Logo pill */}
      <div 
        style={{ background: brandGradient }}
        className="text-white px-4 py-1 rounded-full flex items-center gap-2 mb-8 shadow-md"
      >
        <span className="text-xs font-bold italic">✦ Intervue Poll</span>
      </div>

      <h1 className="text-3xl text-gray-900 mb-2">Let`s <span className='font-bold'>Get Started</span></h1>
      <p className="text-gray-600 mb-8">Enter your name to continue</p>

      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          style={{ background: brandGradient }}
          className="w-full text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
