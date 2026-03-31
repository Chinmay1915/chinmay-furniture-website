import { useEffect, useState } from "react";
import api from "../services/api.js";
import { formatINR } from "../utils/format.js";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/orders").then((res) => setOrders(res.data));
  }, []);

  return (
    <div className="container-page py-8">
      <h2 className="text-2xl font-semibold mb-4">Order History</h2>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-4 rounded-lg">
              <p className="text-sm text-slate-600">Order ID: {order.id}</p>
              <p className="text-sm text-slate-600">Placed: {order.created_at}</p>
              <ul className="mt-2">
                {order.items.map((item, idx) => (
                  <li key={idx} className="text-sm">
                    {item.quantity} x {item.name} ({formatINR(item.price)})
                  </li>
                ))}
              </ul>
              <p className="font-semibold mt-2">Total: {formatINR(order.total_price)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
