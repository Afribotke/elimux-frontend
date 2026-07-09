export default function ProgramCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-5 animate-pulse">
      <div className="h-5 w-24 rounded-full bg-gray-200 mb-3" />
      <div className="h-5 w-3/4 rounded bg-gray-200 mb-2" />
      <div className="h-4 w-1/2 rounded bg-gray-200 mb-3" />
      <div className="h-4 w-full rounded bg-gray-200 mb-1" />
      <div className="h-4 w-2/3 rounded bg-gray-200 mb-4" />
      <div className="flex gap-3">
        <div className="h-4 w-16 rounded bg-gray-200" />
        <div className="h-4 w-20 rounded bg-gray-200" />
      </div>
    </div>
  )
}
