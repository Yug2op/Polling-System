import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPoll, startPoll } from '../api/polls.js';
import { getSessionUser } from '../storage/session.js';
import { createTeacherSocket } from '../socket/client.js';
import PollTimer from '../components/PollTimer.jsx';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const socketRef = useRef(null);
  const brandGradient = 'linear-gradient(to right, #7565D9, #4D0ACD)';

  // --- STATE ---
  const [question, setQuestion] = useState('');
  const [duration, setDuration] = useState(60);
  const [options, setOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false }
  ]);
  const [loading, setLoading] = useState(false);
  

  const [createdPoll, setCreatedPoll] = useState(null);

useEffect(() => {
    if (!user || user.role !== 'teacher') {
      navigate('/');
      return;
    }

    const s = createTeacherSocket();
    socketRef.current = s;

    // 1. Sync active state on load
    s.on('pollUpdated', ({ poll }) => {
      if (poll.status === 'active') {
        setCreatedPoll(poll);
      }
    });

    // 2. Real-time Vote Updates
    s.on('voteReceived', ({ pollId, results, totalVotes }) => {
      
      setCreatedPoll(prev => {
        if (!prev || prev._id !== pollId) {
            return prev;
        }

        return {
          ...prev,
          options: results,      
          totalVotes: totalVotes 
        };
      });
    });

    // 3. Poll Ended
    s.on('pollEnded', ({ data }) => { 
      if (data) {
        setCreatedPoll({ ...data, status: 'completed' }); 
        toast.success('Poll has concluded. Results are final.');
      }
    });

    return () => s.disconnect();
  }, [user, navigate]);

  const onCreatePoll = async () => {
    if (!question.trim()) return toast.error('Question is required');
    if (options.some(o => !o.text.trim())) return toast.error('All options must have text');

    try {
      setLoading(true);
      const res = await createPoll({
        question: question.trim(),
        duration: Number(duration),
        createdBy: user.id,
        options: options.map(o => ({ ...o, text: o.text.trim() }))
      });
      const poll = res?.data;
      if (!poll?._id) throw new Error('Poll creation failed');

      await startPoll(poll._id, user.id);

      setCreatedPoll({ ...poll, status: 'active' });
      toast.success('Poll created and broadcasted');
      
      // Reset form fields
      setQuestion('');
      setOptions([{ text: '', isCorrect: true }, { text: '', isCorrect: false }]);
    } catch (err) {
      toast.error(err.message || 'Failed to create/start poll');
    } finally {
      setLoading(false);
    }
  };

  const updateOptionText = (i, value) => {
    setOptions(prev => prev.map((o, idx) => (idx === i ? { ...o, text: value } : o)));
  };

  const setCorrect = (i) => {
    setOptions(prev => prev.map((o, idx) => ({ ...o, isCorrect: idx === i })));
  };

  const resetToCreationMode = () => {
    setCreatedPoll(null); // Get back to creation
  };

  // --- VIEW 1 ---
  if (createdPoll) {
    const isPollActive = createdPoll.status === 'active';

    return (
      <div key={createdPoll._id} className="min-h-screen bg-white p-8 relative">
        <div className="absolute top-8 right-8">
          <button
            onClick={() => navigate('/history')}
            style={{ background: brandGradient }}
            className="flex items-center gap-2 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg"
          >
            View Poll history
          </button>
        </div>

        <div className="max-w-3xl mx-auto mt-20">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {isPollActive ? 'Live Results' : 'Final Results'}
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPollActive ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
              {isPollActive ? '● Active' : '● Completed'}
            </span>
          </div>

          {/* Result Card */}
          <div className="border border-gray-300 rounded-md overflow-hidden shadow-sm bg-white">
            <div className="bg-gradient-to-r from-[#373737] to-[#6E6E6E] p-4">
              <p className="text-white font-medium text-sm">{createdPoll.question}</p>
            </div>
            
            <div className="p-6 space-y-4">
              {createdPoll.options?.map((opt, i) => {
                let percentage = 0;
                
                if (opt.percentage !== undefined) {
                    percentage = opt.percentage;
                } else {
                    const total = createdPoll.totalVotes ?? createdPoll.votedUsers?.length ?? 0;
                    percentage = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                }
                
                return (
                  <div key={i} className="relative h-12 border border-gray-300 rounded-xl overflow-hidden flex items-center bg-gray-50/30">
                    {/* The Bar */}
                    <div 
                        className="absolute left-0 top-0 h-full transition-all duration-700 ease-out" 
                        style={{ 
                            width: `${percentage}%`, 
                            background: brandGradient, 
                            zIndex: 0,
                            opacity: isPollActive ? 1 : 0.8 
                        }} 
                    />
                    
                    <div className="absolute left-4 z-10 flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${percentage > 10 ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                        {i + 1}
                      </div>
                      <span className={`text-sm font-bold ${percentage > 20 ? 'text-white' : 'text-gray-400'}`}>
                        {opt.text}
                      </span>
                      {/* Show Checkmark if correct and poll is over */}
                      {!isPollActive && opt.isCorrect && (
                         <span className="bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-sm">✓</span>
                      )}
                    </div>
                    
                    {/* The Percentage Label */}
                    <span className={`absolute right-4 text-sm font-bold z-10 ${percentage > 90 ? 'text-white' : 'text-gray-800'}`}>
                        {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timer - Only show if Active */}
          {isPollActive && (
            <div className="mt-6 text-center">
              <PollTimer initialTimeRemaining={createdPoll.duration} />
            </div>
          )}

          {/* Action Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={resetToCreationMode}
              disabled={isPollActive}
              style={{
                background: isPollActive ? '#E5E7EB' : brandGradient,
                color: isPollActive ? '#9CA3AF' : 'white',
                cursor: isPollActive ? 'not-allowed' : 'pointer'
              }}
              className="px-8 py-3 rounded-full text-sm font-bold shadow-xl transition-all active:scale-95"
            >
              {isPollActive ? 'Waiting for poll to end...' : '+ Ask a new question'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2 (Default) ---
  return (
    <div className="min-h-screen bg-white p-16 ">
      <div className="p-6">
        <div style={{ background: brandGradient }} className="w-fit text-white px-3 py-1 rounded-full flex items-center gap-2 mb-6">
          <span className="text-[10px] font-bold italic">✦ Intervue Poll</span>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl text-gray-900 mb-2">Let's <span className="font-extrabold">Get Started</span></h1>
          <p className="text-gray-400 max-w-lg text-sm">
            You'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
          </p>
        </div>

        <div className="max-w-4xl">
          {/* Question Input */}
          <div className="flex items-center justify-between mb-4">
            <label className="text-md font-bold text-gray-900">Enter your question</label>
            <div className="relative">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="appearance-none bg-blue-50 border-none px-4 py-2 pr-10 rounded-lg text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer"
              >
                <option value={60}>60 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={90}>90 seconds</option>
                <option value={120}>120 seconds</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#4D0ACD]">▼</div>
            </div>
          </div>

          <div className="relative mb-10">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 100))}
              placeholder="Add Question Here..."
              className="w-full h-32 bg-blue-50 border-none p-6 text-gray-800 placeholder-gray-400 focus:ring-0 resize-none rounded-xl"
            />
            <span className="absolute bottom-4 right-6 text-xs text-gray-400 font-medium">
              {question.length}/100
            </span>
          </div>
          <div className="grid grid-cols-12 gap-6 mb-8">
            <div className="col-span-7">
              <h3 className="text-md font-bold text-gray-900 mb-4">Edit Options</h3>
              <div className="space-y-4">
                {options.map((o, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div style={{ background: brandGradient }} className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                      {i + 1}
                    </div>
                    <input
                      type="text"
                      value={o.text}
                      onChange={(e) => updateOptionText(i, e.target.value)}
                      placeholder={`Option ${i+1}`}
                      className="w-full bg-blue-50 border-none px-4 py-3 text-sm focus:ring-0 rounded-lg"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setOptions([...options, { text: '', isCorrect: false }])}
                className="mt-6 text-[#7565D9] border border-[#7565D9] rounded-lg px-6 py-2 ml-8 text-xs font-bold hover:bg-gray-50 transition-colors"
              >
                + Add More option
              </button>
            </div>

            <div className="col-span-5">
              <h3 className="text-md font-bold text-gray-900 mb-4">Is it Correct?</h3>
              <div className="space-y-[34px] pt-3">
                {options.map((o, i) => (
                  <div key={i} className="flex items-center gap-6 h-[44px]">
                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                      <div
                        onClick={() => setCorrect(i)}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${o.isCorrect ? 'border-[#4D0ACD]' : 'border-gray-300'}`}
                      >
                        {o.isCorrect && <div className="w-2 h-2 rounded-full bg-[#4D0ACD]" />}
                      </div>
                      <span className="text-sm font-bold text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        onClick={() => !o.isCorrect && toast.error("Please mark another option as correct")}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${!o.isCorrect ? 'border-[#4D0ACD]' : 'border-gray-300'}`}
                      >
                        {!o.isCorrect && <div className="w-2 h-2 rounded-full bg-[#4D0ACD]" />}
                      </div>
                      <span className="text-sm font-bold text-gray-700">No</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-16 p-4 bg-white border-t border-gray-100 flex justify-end z-20">
        <button
          onClick={onCreatePoll}
          disabled={loading}
          style={{ background: brandGradient }}
          className="px-10 py-3 rounded-full text-white text-sm font-bold shadow-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Ask Question'}
        </button>
      </div>
    </div>
  );
}