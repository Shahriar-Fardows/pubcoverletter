import React from 'react';

const page = () => {
  return (
    <div className="min-h-[80vh]  flex items-center justify-center px-6">
      <div className="text-center max-w-2xl">
        
        {/* Icon Circle */}
        <div className="mx-auto mb-8 h-24 w-24 rounded-2xl bg-white shadow-lg flex items-center justify-center">
          <span className="text-5xl animate-pulse">⏳</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
          Coming Soon…
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-600 mb-6">
          I’m not OpenAI, so I can’t drop everything at once
          but I’m building something for you. 🚀
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto bg-gray-300 h-2 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-gray-900 w-1/3 animate-[progress_4s_infinite]"></div>
        </div>

        {/* Small Note */}
        <p className="text-sm text-gray-500">
          Stay tuned. Good things take time ✨
        </p>
      </div>
    </div>
  );
};

export default page;