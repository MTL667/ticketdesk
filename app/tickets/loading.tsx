export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center overflow-hidden">
      <div className="text-center">
        <div className="relative inline-block h-[400px] w-[400px]">
          {/* Raket + Rook container (zo blijven ze samen) */}
          <div className="rocket-with-smoke">
            <div className="text-6xl">🚀</div>
            {/* Rook blijft achter raket */}
            <div className="smoke-trail">
              <div className="smoke-particle" style={{ animationDelay: '0s' }}>💨</div>
              <div className="smoke-particle" style={{ animationDelay: '0.15s' }}>💨</div>
              <div className="smoke-particle" style={{ animationDelay: '0.3s' }}>💨</div>
            </div>
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
          @keyframes bigRocketLoop {
            0% {
              transform: translate(0, 0) rotate(-45deg);
            }
            25% {
              transform: translate(150px, -150px) rotate(45deg);
            }
            50% {
              transform: translate(0, -300px) rotate(135deg);
            }
            75% {
              transform: translate(-150px, -150px) rotate(225deg);
            }
            100% {
              transform: translate(0, 0) rotate(315deg);
            }
          }

          @keyframes smokeTrail {
            0% {
              transform: translateX(40px) translateY(0) scale(0.5);
              opacity: 0.8;
            }
            100% {
              transform: translateX(60px) translateY(20px) scale(1.2);
              opacity: 0;
            }
          }

          .rocket-with-smoke {
            position: absolute;
            top: 50%;
            left: 50%;
            animation: bigRocketLoop 4s ease-in-out infinite;
            transform-origin: center;
          }

          .smoke-trail {
            position: absolute;
            top: 0;
            left: 0;
          }

          .smoke-particle {
            position: absolute;
            font-size: 28px;
            animation: smokeTrail 0.8s ease-out infinite;
          }
        `
      }} />
    </div>
  );
}

