import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPolls } from '../api/polls.js';
import { getSessionUser } from '../storage/session.js';
import toast from 'react-hot-toast';

export default function PollHistory() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const brandGradient = 'linear-gradient(to right, #7565D9, #4D0ACD)';

  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const res = await getPolls({ status: '' });
      setPolls(res?.data || []);
    } catch (err) {
      toast.error('Failed to load poll history');
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      navigate('/');
      return;
    }
    loadHistory();
  }, [user, navigate, loadHistory]);

  if (!isInitialized && isLoading) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8 relative">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-8"> 
            Poll History
          </h1>
          <button
            onClick={() => navigate(-1)}
            style={{ background: brandGradient }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg"
          >
            ← Back
          </button>
        </div>

        {polls.length === 0 ? (
          <div className="text-center py-12 sm:py-20 text-gray-400 font-bold text-sm sm:text-base">
            No completed polls found.
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-12 lg:space-y-16">
            {polls.map((poll, index) => {
              // Calculate total votes by summing all options for accuracy
              const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

              return (
                <div key={poll._id}>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Question {index + 1}</h2>
                  
                  <div className="border-2 border-gray-300 rounded-lg max-w-2xl overflow-hidden shadow-sm bg-white">
                    <div className="bg-gradient-to-r from-[#5C5C5C] to-[#6E6E6E] p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <p className="text-white font-medium text-xs sm:text-sm">{poll.question}</p>
                      <span className="text-[8px] sm:text-[10px] text-gray-300 font-mono">ID: {poll._id}</span>
                    </div>

                    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                      {poll.options.map((opt, i) => {
                        const percentage = totalVotes > 0 
                          ? Math.round((opt.votes / totalVotes) * 100) 
                          : 0;

                        return (
                          <div key={i} className="relative h-10 sm:h-12 border border-gray-100 rounded-xl overflow-hidden flex items-center bg-gray-50/30">
                            {/* Fill Bar */}
                            <div 
                              className="absolute left-0 top-0 h-full transition-all duration-1000 ease-out"
                              style={{ 
                                width: `${percentage}%`, 
                                background: brandGradient,
                                zIndex: 1
                              }} 
                            />

                            <div className="absolute inset-0 flex items-center justify-between px-3 sm:px-4 z-10">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${percentage > 10 ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                  {i + 1}
                                </div>
                                <span className={`text-xs sm:text-sm font-bold ${percentage > 20 ? 'text-white' : 'text-gray-400'}`}>
                                  {opt.text}
                                </span>
                                {/* Correct Answer Indicator */}
                                {opt.isCorrect && (
                                  <div className={`ml-1 sm:ml-2 flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 text-white`}>
                                    <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3">
                                <span className={`text-[10px] sm:text-xs ${percentage > 20 ? 'text-white/80' : 'text-gray-400'}`}>
                                  ({opt.votes} votes)
                                </span>
                                <span className={`text-xs sm:text-sm font-bold ${percentage > 20 ? 'text-white' : 'text-gray-800'}`}>
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}