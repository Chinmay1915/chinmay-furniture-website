import { Link } from "react-router-dom";
import { formatINR } from "../utils/format.js";
import { handleProductImageError } from "../utils/imageFallback.js";

export default function ProductCard({ product }) {
  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden card-hover">
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
          onError={handleProductImageError}
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs text-slate-700 shadow-sm">
          New Arrival
        </div>
        {product.model_url && (
          <div className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs shadow-sm">
            AR Ready
          </div>
        )}
      </Link>
      <div className="p-4">
        <Link to={`/product/${product.id}`} className="font-semibold text-lg hover:text-slate-700">
          {product.name}
        </Link>
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
