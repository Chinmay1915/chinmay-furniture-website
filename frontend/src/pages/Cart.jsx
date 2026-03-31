import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { formatINR } from "../utils/format.js";

export default function Cart() {
  const { items, removeItem, total } = useCart();
  const navigate = useNavigate();

  return (
    <div className="container-page py-8">
      <h2 className="text-2xl font-semibold mb-4">Your Cart</h2>
      {items.length === 0 ? (
        <p>
          Cart is empty. <Link to="/">Shop now</Link>
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white p-4 rounded-lg"
            >
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-slate-600">
                  {item.quantity} x {formatINR(item.price)}
                </p>
              </div>
              <button className="btn-outline" onClick={() => removeItem(item.id)}>
                Remove
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">Total: {formatINR(total)}</p>
            <button className="btn" onClick={() => navigate("/checkout")}
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
