export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block h-[150px] w-[100px]">
          {/* Raket animatie */}
          <div className="absolute top-0 left-1/2 text-6xl rocket-launch">
            🚀
          </div>
          {/* Rook/vuur effect */}
          <div className="absolute top-[60px] left-1/2 -translate-x-1/2">
            <div className="absolute -left-[10px] text-2xl smoke-float" style={{ animationDelay: '0s' }}>💨</div>
            <div className="absolute left-[5px] text-2xl smoke-float" style={{ animationDelay: '0.3s' }}>💨</div>
            <div className="absolute -left-[5px] text-2xl smoke-float" style={{ animationDelay: '0.6s' }}>💨</div>
          </div>
        </div>
        
        <div className="mt-8 space-y-2">
          <p className="text-xl font-semibold text-gray-700 animate-pulse">
            Tickets worden geladen...
          </p>
          <p className="text-sm text-gray-500">
            Even geduld, we verzamelen je tickets 📋
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes rocketLaunch {
            0%, 100% {
              transform: translateY(0) rotate(-45deg);
            }
            50% {
              transform: translateY(-30px) rotate(-45deg);
            }
          }

          @keyframes smokeFloat {
            0% {
              transform: translateY(0) translateX(0) scale(1);
              opacity: 0.7;
            }
            100% {
              transform: translateY(40px) translateX(-10px) scale(1.5);
              opacity: 0;
            }
          }

          .rocket-launch {
            animation: rocketLaunch 1.5s ease-in-out infinite;
          }

          .smoke-float {
            animation: smokeFloat 1.2s ease-out infinite;
          }
        `
      }} />
    </div>
  );
}

