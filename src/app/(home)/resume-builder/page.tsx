export default function ComingSoon() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="text-center max-w-2xl">

        {/* Icon */}
        <div className="mx-auto mb-8 h-20 w-20 rounded-2xl bg-white shadow-lg flex items-center justify-center">
          <span className="text-4xl animate-pulse">🔥</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
          New features are cooking.
          <br />
          <span className="text-gray-700">
            Don’t worry, we won’t burn them.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 text-base md:text-lg mt-4">
          Something exciting is on the way stay tuned!
        </p>

      </div>
    </div>
  );
}
