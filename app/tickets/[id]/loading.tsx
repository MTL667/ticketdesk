export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    </div>
  );
}
