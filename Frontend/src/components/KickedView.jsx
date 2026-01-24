const KickedView = () => {
    const brandGradient = 'linear-gradient(to right, #7565D9, #4D0ACD)';
  
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 animate-fadeIn">
        {/* 1. Brand Pill Badge */}
        <div 
          style={{ background: brandGradient }}
          className="px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-white text-[8px] sm:text-[10px] font-bold tracking-wide flex items-center gap-1 sm:gap-1.5 mb-4 sm:mb-6 shadow-md"
        >
          <span className="text-xs sm:text-xs">✦</span> 
          <span className="text-xs sm:text-[10px]">KBC Poll</span>
        </div>
  
        {/* 2. Main Heading */}
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-900 font-normal mb-2 sm:mb-3 text-center">
          You've been Kicked out !
        </h1>
  
        {/* 3. Subtitle Text */}
        <p className="text-gray-400 text-center text-xs sm:text-sm md:text-base max-w-xs sm:max-w-md leading-relaxed px-2">
          Looks like the teacher had removed you from the poll system. Please Try again sometime.
        </p>
      </div>
    );
  };

  export default KickedView;