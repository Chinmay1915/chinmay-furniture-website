import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { formatINR } from "../utils/format.js";
import Toast from "../components/Toast.jsx";
import { useState } from "react";

export default function Cart() {
  const { items, removeItem, total } = useCart();
  const navigate = useNavigate();
  const [toast, setToast] = useState("");

  const handleRemove = (id, name) => {
    removeItem(id);
    setToast(`${name} removed from cart.`);
  };

  return (
    <div className="relative overflow-hidden page-fade">
      <Toast message={toast} onClose={() => setToast("")} />
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="container-page py-8 relative z-10">
        <h2 className="text-2xl font-semibold mb-4">Your Cart</h2>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <h3 className="text-2xl font-semibold">Your cart is empty</h3>
          <p className="mt-2 text-sm text-slate-500">Add a product to start building your furniture order.</p>
          <Link to="/" className="btn mt-5 inline-block">Shop now</Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm"
            >
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-slate-600">
                  {item.quantity} x {formatINR(item.price)}
                </p>
              </div>
              <button className="btn-outline" onClick={() => handleRemove(item.id, item.name)}>
                Remove
              </button>
            </div>
          ))}
          </div>
          <div className="sticky top-24 h-fit rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Order Summary</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Items</span>
              <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
            <button className="btn" onClick={() => navigate("/checkout")}
            >
              Checkout
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
