export default function Placeholder({ titulo }: { titulo: string }) {
  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-800">{titulo}</h1>
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">Esta sección se construirá en la siguiente tanda.</p>
      </div>
    </div>
  )
}
