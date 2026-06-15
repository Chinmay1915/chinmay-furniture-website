export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="h-52 skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="h-3 w-full skeleton rounded" />
        <div className="h-3 w-2/3 skeleton rounded" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 w-20 skeleton rounded" />
          <div className="h-9 w-16 skeleton rounded-md" />
        </div>
      </div>
    </div>
  );
}
