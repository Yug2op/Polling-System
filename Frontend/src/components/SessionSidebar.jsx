import React, { useState, useEffect, useRef } from 'react';

export default function SessionSidebar({ 
  role,               
  participants = [],  
  messages = [],      
  onSendMessage,      
  onRemoveStudent,    
  user                
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); 
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);
  

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end sm:bottom-20 sm:right-20">
      
      {/* --- THE SIDEBAR POPUP --- */}
      {isOpen && (
        <div className="mb-4 w-80 max-w-[calc(100vw-2rem)] bg-white h-[400px] max-h-[60vh] sm:h-[400px] rounded-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-fadeIn">
          
          {/* Tabs Header */}
          <div className="flex border-b border-gray-100">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm font-bold transition-all ${activeTab === 'chat' ? 'text-[#4D0ACD] border-b-2 border-[#4D0ACD]' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Chat
            </button>
            <button 
              onClick={() => setActiveTab('participants')}
              className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm font-bold transition-all ${activeTab === 'participants' ? 'text-[#4D0ACD] border-b-2 border-[#4D0ACD]' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Participants ({participants.length})
            </button>
          </div>

          {/* --- CONTENT AREA --- */}
          <div className="flex-1 overflow-y-auto bg-gray-50/30 p-3 sm:p-4 relative">
            
            {/* 1. CHAT VIEW */}
            {activeTab === 'chat' && (
              <div className="space-y-3 pb-2">
                {messages.length === 0 && (
                  <p className="text-center text-gray-400 text-xs mt-8 sm:mt-10">No messages yet. Say hi!</p>
                )}
                {messages.map((msg, idx) => {
                  const isMe = msg.senderName === user.name;
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-gray-400 mb-1 px-1">{msg.senderName}</span>
                      <div className={`px-2 py-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm max-w-[85%] sm:max-w-[85%] break-words ${
                        isMe 
                          ? 'bg-[#4D0ACD] text-white rounded-tr-none' 
                          : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none shadow-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* 2. PARTICIPANTS VIEW */}
            {activeTab === 'participants' && (
              <div className="space-y-2">
                {participants.length === 0 && (
                  <p className="text-center text-gray-400 text-xs mt-8 sm:mt-10">No participants yet!</p>
                )}
                {participants.map((p) => (
                  <div key={p.socketId} className="flex items-center justify-between bg-white p-2 sm:p-3 rounded-lg border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[#4D0ACD] font-bold text-[10px] sm:text-xs">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-gray-800">{p.name}</p>
                        <p className="text-[8px] sm:text-[10px] text-gray-400 capitalize">{p.role}</p>
                      </div>
                    </div>
                    
                    {/* Remove Button (Only for Teacher & Not removing self) */}
                    {role === 'teacher' && p.role === 'student' && (
                      <button 
                        onClick={() => onRemoveStudent(p.socketId)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 sm:p-2"
                        title="Remove student"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* INPUT AREA (Only for Chat Tab) */}
          {activeTab === 'chat' && (
            <form onSubmit={handleSend} className="p-2 sm:p-3 bg-white border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-50 border-none rounded-full px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm focus:ring-1 focus:ring-[#4D0ACD] outline-none"
              />
              <button 
                type="submit"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#4D0ACD] flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                disabled={!inputText.trim()}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 translate-x-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          )}
        </div>
      )}

      {/* --- TOGGLE BUTTON (Blue Bubble) --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#5767D0] text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
      >
        {isOpen ? (
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>
    </div>
  );
}