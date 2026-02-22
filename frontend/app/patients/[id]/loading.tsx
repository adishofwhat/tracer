export default function PatientDetailLoading() {
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
