import { Link } from "react-router-dom";
import { formatINR } from "../utils/format.js";

export default function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden card-hover">
      <div className="relative">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-52 w-full object-cover"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs text-slate-700">
          New Arrival
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-semibold text-slate-900">{formatINR(product.price)}</span>
          <Link className="btn-outline" to={`/product/${product.id}`}>
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
