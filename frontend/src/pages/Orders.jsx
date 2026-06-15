import { useEffect, useState } from "react";
import api from "../services/api.js";
import { formatINR } from "../utils/format.js";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [now] = useState(Date.now());

  useEffect(() => {
    api.get("/orders").then((res) => setOrders(res.data));
  }, []);

  const canReplace = (createdAt) => {
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) return false;
    const diffDays = (now - created.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  return (
    <div className="relative overflow-hidden page-fade">
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1600')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="container-page py-8 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Your Orders</p>
            <h2 className="text-2xl font-semibold">Order History</h2>
          </div>
        </div>
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <h3 className="text-2xl font-semibold">No orders yet</h3>
          <p className="mt-2 text-sm text-slate-500">Your order history will appear here after checkout.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-4 rounded-lg">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">Order ID: {order.id}</p>
                <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {order.payment_id ? "Paid" : "Placed"}
                </span>
              </div>
              <p className="text-sm text-slate-600">Placed: {order.created_at}</p>
              <ul className="mt-2">
                {order.items.map((item, idx) => (
                  <li key={idx} className="text-sm">
                    {item.quantity} x {item.name} ({formatINR(item.price)})
                  </li>
                ))}
              </ul>
              <p className="font-semibold mt-2">Total: {formatINR(order.total_price)}</p>
              <div className="mt-3">
                {canReplace(order.created_at) ? (
                  <button className="btn-outline">Request Replacement</button>
                ) : (
                  <p className="text-xs text-slate-500">Replacement available within 7 days of delivery.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
