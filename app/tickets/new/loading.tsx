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
            Formulier wordt geladen...
          </p>
          <p className="text-sm text-gray-500">
            Even geduld 📝
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes rocketLoop {
            0% {
              transform: translate(0, 0) rotate(-45deg);
            }
            25% {
              transform: translate(30px, -40px) rotate(45deg);
            }
            50% {
              transform: translate(0, -80px) rotate(135deg);
            }
            75% {
              transform: translate(-30px, -40px) rotate(225deg);
            }
            100% {
              transform: translate(0, 0) rotate(315deg);
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
            animation: rocketLoop 3s ease-in-out infinite;
          }

          .smoke-float {
            animation: smokeFloat 1.2s ease-out infinite;
          }
        `
      }} />
    </div>
  );
}

