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
          @keyframes smoothRocketLoop {
            0% {
              transform: translate(0px, 0px) rotate(-45deg);
            }
            12.5% {
              transform: translate(106px, -106px) rotate(0deg);
            }
            25% {
              transform: translate(150px, -150px) rotate(45deg);
            }
            37.5% {
              transform: translate(106px, -256px) rotate(90deg);
            }
            50% {
              transform: translate(0px, -300px) rotate(135deg);
            }
            62.5% {
              transform: translate(-106px, -256px) rotate(180deg);
            }
            75% {
              transform: translate(-150px, -150px) rotate(225deg);
            }
            87.5% {
              transform: translate(-106px, -106px) rotate(270deg);
            }
            100% {
              transform: translate(0px, 0px) rotate(315deg);
            }
          }

          @keyframes smokeTrail {
            0% {
              transform: translateX(-30px) translateY(30px) scale(0.5);
              opacity: 0.9;
            }
            50% {
              transform: translateX(-50px) translateY(50px) scale(1);
              opacity: 0.5;
            }
            100% {
              transform: translateX(-70px) translateY(70px) scale(1.5);
              opacity: 0;
            }
          }

          .rocket-with-smoke {
            position: absolute;
            top: 50%;
            left: 50%;
            animation: smoothRocketLoop 5s linear infinite;
            transform-origin: 0 0;
          }

          .smoke-trail {
            position: absolute;
            top: 12px;
            left: 12px;
            pointer-events: none;
          }

          .smoke-particle {
            position: absolute;
            font-size: 24px;
            animation: smokeTrail 1s ease-out infinite;
            transform-origin: center;
          }
        `
      }} />
    </div>
  );
}

