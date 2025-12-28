import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPolls, getPollResults } from '../api/polls.js';
import { getSessionUser } from '../storage/session.js';
import { createStudentSocket } from '../socket/client.js';
import PollTimer from '../components/PollTimer.jsx';
import toast from 'react-hot-toast';
import SessionSidebar from '../components/SessionSidebar.jsx';
import KickedView from '../components/KickedView.jsx';

export default function StudentDashboard() {
    const navigate = useNavigate();
    const user = getSessionUser();
    const userId = user?.id || user?._id;

    const socketRef = useRef(null);
    const bottomRef = useRef(null);
    const brandGradient = 'linear-gradient(to right, #7565D9, #4F0DCE)';
    const correctGradient = 'linear-gradient(to right, #10B981, #059669)';
    const wrongGradient = 'linear-gradient(to right, #EF4444, #DC2626)';

    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [socketStatus, setSocketStatus] = useState('Initializing...');
    const [messages, setMessages] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [isKicked, setIsKicked] = useState(false); 

    // Use a ref to track active status
    const hasActivePollRef = useRef(false);

    const scrollToBottom = () => {
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const syncActivePolls = useCallback(async () => {
        if (!userId) return;

        try {
            const res = await getPolls({ status: 'active' });

            if (res?.data && res.data.length > 0) {
                res.data.forEach(activePoll => {
                    if (socketRef.current?.connected) {
                        socketRef.current.emit('getPollState', { pollId: activePoll._id, userId }, (resp) => {
                            if (resp?.success && resp.data) {
                                const serverPoll = resp.data;
                                setPolls(prev => {
                                    const exists = prev.find(p => p._id === serverPoll._id);

                                    if (!exists) {
                                        scrollToBottom();
                                        return [...prev, serverPoll];
                                    }
                                    return prev.map(p => p._id === serverPoll._id ? serverPoll : p);
                                });
                            }
                        });
                    }
                });
            }
        } catch (err) {
            console.error("Sync Error:", err);
        }
    }, [userId]);

    useEffect(() => {
        if (!user || user.role !== 'student') {
            navigate('/');
            return;
        }

        if (socketRef.current?.connected) return;

        const s = createStudentSocket();
        socketRef.current = s;

        const handleJoinSession = () => {
            const displayName = user.name || `Student ${userId.slice(-4)}`;
            s.emit('joinSession', { name: displayName, userId: userId });
            setSocketStatus('Connected');
            syncActivePolls();
        };


        if (s.connected) {
            handleJoinSession();
        } else {
            s.on('connect', handleJoinSession);
        }

        setTimeout(() => {
            if (s.connected) {
                handleJoinSession();
            }
        }, 500);

        s.on('forceDisconnect', ({ reason }) => {
            setIsKicked(true);
            toast.error(reason || "You have been removed.");
            s.disconnect();
            
        });

        s.on('receiveChatMessage', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        s.on('updateParticipantList', (users) => {
            setParticipants(users);
        });

        s.on('voteReceived', ({ pollId, results, totalVotes }) => {

            setPolls(prev => {
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

        s.on('pollStarted', ({ poll, timeRemaining }) => {
            setPolls(prev => {
                if (prev.some(p => p._id === poll._id)) return prev;
                return [...prev, { ...poll, timeRemaining, hasVoted: false }];
            });
            scrollToBottom();
        });

        s.on('pollEnded', ({ pollId, data }) => {
            setPolls(prev => prev.map(p => {
                if (p._id === String(pollId)) {
                    return { ...p, status: 'completed', results: data, hasVoted: true };
                }
                return p;
            }));
        });

        return () => {
            if (s) {
                s.off('voteReceived');
                s.off('connect', handleJoinSession);
                s.off('updateParticipantList');
                s.off('receiveChatMessage');
                s.disconnect();
            }
        };
    }, [userId]);

    const handleSendMessage = (text) => {
        socketRef.current.emit('sendChatMessage', {
            text,
            senderName: user.name || 'Student'
        });
    };

    useEffect(() => {
        hasActivePollRef.current = polls.some(p => p.status === 'active');
    }, [polls]);


    // ---  VOTE LOGIC ---
    const submitVote = async (pollId, optionIndex) => {
        setLoading(true);
        socketRef.current.emit('submitVote', {
            pollId,
            optionIndex,
            userId
        }, async (resp) => {
            setLoading(false);
            if (resp.success) {
                toast.success("Vote Submitted!");

                setPolls(prev => prev.map(p => {
                    if (p._id === pollId) return { ...p, hasVoted: true };
                    return p;
                }));

                const res = await getPollResults(pollId);
                if (res.success) {
                    setPolls(prev => prev.map(p => {
                        if (p._id === pollId) return { ...p, results: res.data };
                        return p;
                    }));
                }
            } else {
                toast.error(resp.error || "Failed");
            }
        });
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (!hasActivePollRef.current) {
                syncActivePolls();
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [syncActivePolls]);

    
    // Kicked View

    if (isKicked) {
        return <KickedView />; 
      }


    // ---  EMPTY STATE ---
    if (polls.length === 0) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center relative">
                <div className={`absolute top-4 right-4 text-[10px] px-2 py-1 rounded-full ${socketStatus === 'Connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {socketStatus}
                </div>
                <div style={{ background: brandGradient }} className="text-white px-4 py-1 rounded-full text-[10px] font-bold italic mb-8 shadow-sm">
                    ✦ Intervue Poll
                </div>
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-[#4D0ACD] rounded-full animate-spin mb-6" />
                <h1 className="text-2xl font-bold text-gray-900">Wait for the teacher to ask questions..</h1>
                <SessionSidebar
                    role="student"
                    participants={participants}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    user={{ ...user, name: user.name || 'Student' }}
                />
            </div>
        );
    }


    // --- POLL FEED ---
    return (
        <div className="min-h-screen bg-gray-50/50 p-8 pb-32">
            <div className="max-w-2xl mx-auto space-y-16">

                <div className="flex justify-end">
                    <span className={`text-[10px] px-2 py-1 rounded-full ${socketStatus === 'Connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {socketStatus}
                    </span>
                </div>

                {polls.map((poll, index) => {
                    const showResults = poll.hasVoted || poll.status === 'completed';

                    return (
                        <div key={poll._id} className="animate-fadeIn">
                            <div className="flex items-center gap-4 mb-4">
                                <h2 className="text-lg font-bold text-gray-800">Question {index + 1}</h2>
                                {poll.status === 'active' && (

                                    <PollTimer initialTimeRemaining={poll.timeRemaining || 0} />

                                )}
                            </div>

                            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                                <div className="bg-[#5C5C5C] p-4 text-white text-sm font-medium">
                                    {poll.question}
                                </div>

                                <div className="p-6 space-y-4">
                                    {poll.options.map((opt, i) => {
                                        const totalVotes = poll.results?.totalVotes || 1;
                                        const resultOption = poll.results?.options?.[i];
                                        const voteCount = resultOption?.votes || opt.votes || 0;
                                        const percentage = showResults ? Math.round((voteCount / totalVotes) * 100) : 0;

                                        const isSelected = poll.selectedOptionIndex === i;
                                        const isCorrect = resultOption?.isCorrect === true;
                                        const isIncorrect = resultOption?.isCorrect === false;

                                        let barBackground = brandGradient;
                                        if (showResults) {
                                            if (isCorrect) barBackground = correctGradient;
                                            else if (isSelected && isIncorrect) barBackground = wrongGradient;
                                        }

                                        return (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    if (!poll.hasVoted && poll.status === 'active') {
                                                        setPolls(prev => prev.map(p => p._id === poll._id ? { ...p, selectedOptionIndex: i } : p));
                                                    }
                                                }}
                                                className={`relative h-12 border rounded-xl overflow-hidden flex items-center px-4 transition-all ${isSelected ? 'border-[#4D0ACD] bg-indigo-50' : 'border-gray-100'
                                                    } ${!poll.hasVoted && poll.status === 'active' ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}`}
                                            >
                                                {showResults && (
                                                    <>
                                                        <div
                                                            className="absolute left-0 top-0 h-full transition-all duration-1000"
                                                            style={{ width: `${percentage}%`, background: barBackground, opacity: 0.1, zIndex: 0 }}
                                                        />
                                                        <div
                                                            className="absolute left-0 top-0 h-full transition-all duration-1000"
                                                            style={{ width: `${percentage}%`, background: barBackground, opacity: 0.8, zIndex: 0 }}
                                                        />
                                                    </>
                                                )}

                                                <div className="relative z-10 flex w-full justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${showResults && percentage > 10 ? 'bg-white/30 text-white' : 'bg-indigo-100 text-indigo-600'
                                                            }`}>
                                                            {i + 1}
                                                        </div>

                                                        <span className={`text-sm font-bold ${showResults && percentage > 20 ? 'text-white' : 'text-gray-600'
                                                            }`}>
                                                            {opt.text}
                                                        </span>

                                                        {isSelected && poll.hasVoted && (
                                                            <span className="bg-indigo-600 text-white rounded-full px-2 py-1 text-xs font-bold ml-2">
                                                                Your Choice
                                                            </span>
                                                        )}

                                                        {showResults && isCorrect && (
                                                            <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm ml-2">
                                                                ✓
                                                            </span>
                                                        )}
                                                    </div>

                                                    {showResults && (
                                                        <span className={`text-sm font-bold ${percentage > 20 ? 'text-black' : 'text-gray-800'}`}>
                                                            {percentage}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="p-4 border-t border-gray-50 flex justify-center bg-gray-50/50">
                                    {!poll.hasVoted && poll.status === 'active' ? (
                                        <button
                                            onClick={() => submitVote(poll._id, poll.selectedOptionIndex)}
                                            disabled={loading || poll.selectedOptionIndex === undefined}
                                            style={{ background: brandGradient }}
                                            className="px-8 py-2 rounded-full text-white font-bold shadow-lg active:scale-95 disabled:opacity-50 transition-all text-sm"
                                        >
                                            {loading ? 'Sending...' : 'Submit Answer'}
                                        </button>
                                    ) : (
                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                                            {poll.hasVoted ? "Vote Submitted" : "Poll Ended"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div ref={bottomRef} />

                <div className="text-center py-8">
                    <p className="text-gray-400 font-bold text-sm animate-pulse">
                        Waiting for the teacher to ask a new question...
                    </p>
                </div>
            </div>
            <SessionSidebar
                role="student"
                participants={participants}
                messages={messages}
                onSendMessage={handleSendMessage}
                user={{ ...user, name: user.name || 'Student' }}
            />
        </div>
    );


}