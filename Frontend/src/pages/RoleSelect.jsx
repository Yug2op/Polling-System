import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoleSelect() {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedRole) {
      navigate('/name', { state: { role: selectedRole } });
    }
  };

  const brandGradient = 'linear-gradient(to right, #7565D9, #4D0ACD)';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#F9FAFB]">
      {/* Intervue Badge */}
      <div 
        style={{ background: brandGradient }}
        className="text-white px-4 py-1 rounded-full flex items-center gap-2 mb-8 shadow-md"
      >
        <span className="text-xs font-bold italic">✦ Intervue Poll</span>
      </div>

      {/* Header Section */}
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        Welcome to the <span className="font-extrabold">Live Polling System</span>
      </h1>
      <p className="text-gray-400 text-center max-w-md mb-12">
        Please select the role that best describes you to begin using the live polling system
      </p>

      {/* Role Selection Cards */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl mb-12">
        
        {/* Student Card */}
        <div
          onClick={() => setSelectedRole('student')}
          style={selectedRole === 'student' ? {
            border: '2px solid transparent',
            backgroundImage: `linear-gradient(white, white), ${brandGradient}`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box'
          } : {}}
          className={`flex-1 p-8 rounded-xl cursor-pointer transition-all bg-white border-2 ${
            selectedRole === 'student' ? 'shadow-lg' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-2">I'm a Student</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Answer the Questions In live poll in real-time get the results.
          </p>
        </div>

        {/* Teacher Card */}
        <div
          onClick={() => setSelectedRole('teacher')}
          style={selectedRole === 'teacher' ? {
            border: '2px solid transparent',
            backgroundImage: `linear-gradient(white, white), ${brandGradient}`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box'
          } : {}}
          className={`flex-1 p-8 rounded-xl cursor-pointer transition-all bg-white border-2 ${
            selectedRole === 'teacher' ? 'shadow-lg' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-2">I'm a Teacher</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Submit answers and view live poll results in real-time.
          </p>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!selectedRole}
        style={selectedRole ? { background: brandGradient } : {}}
        className={`px-16 py-3 rounded-full font-semibold text-white transition-all transform active:scale-95 ${
          selectedRole 
            ? 'shadow-lg hover:opacity-90' 
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        Continue
      </button>
    </div>
  );
}