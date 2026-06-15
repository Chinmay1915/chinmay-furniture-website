export default function Toast({ message, type = "success", onClose }) {
  if (!message) return null;

  const tone =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border px-4 py-3 shadow-lg ${tone}`}>
      <div className="flex items-start gap-3">
        <p className="text-sm font-medium">{message}</p>
        <button type="button" className="text-xs underline" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
