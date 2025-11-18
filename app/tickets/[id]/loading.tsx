export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block h-[80px] w-[200px] mb-8">
          {/* Raket vliegt horizontaal */}
          <div className="rocket-flying">
            <span className="text-4xl">🚀</span>
            {/* Rook achter raket */}
            <span className="smoke-1">💨</span>
            <span className="smoke-2">💨</span>
            <span className="smoke-3">💨</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-xl font-semibold text-gray-700 animate-pulse">
            Ticket wordt geladen...
          </p>
          <p className="text-sm text-gray-500">
            Even geduld, we halen de details op 🎫
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes flyHorizontal {
            0% {
              transform: translateX(-220px);
            }
            100% {
              transform: translateX(220px);
            }
          }

          @keyframes smokeFade {
            0% {
              opacity: 0.8;
              transform: translateX(0) scale(0.8);
            }
            100% {
              opacity: 0;
              transform: translateX(-30px) scale(1.2);
            }
          }

          .rocket-flying {
            position: absolute;
            left: 50%;
            top: 50%;
            animation: flyHorizontal 2s linear infinite;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .rocket-flying span[class^="smoke-"] {
            position: absolute;
            left: -20px;
            font-size: 20px;
            animation: smokeFade 0.6s ease-out infinite;
          }

          .smoke-1 {
            animation-delay: 0s;
          }

          .smoke-2 {
            animation-delay: 0.2s;
          }

          .smoke-3 {
            animation-delay: 0.4s;
          }
        `
      }} />
    </div>
  );
}

