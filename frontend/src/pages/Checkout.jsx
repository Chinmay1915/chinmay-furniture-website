import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import api from "../services/api.js";
import { formatINR } from "../utils/format.js";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [stateName, setStateName] = useState("");
  const [landmark, setLandmark] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const placeOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (phone.trim().length < 10) {
      setMessage("Phone number must be at least 10 digits.");
      return;
    }
    if (pincode.trim().length !== 6) {
      setMessage("Pincode must be 6 digits.");
      return;
    }

    await api.post("/orders", {
      items: items.map((i) => ({
        product_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      total_price: total,
      customer_name: customerName,
      address,
      phone,
      pincode,
      country,
      state: stateName,
      landmark,
    });

    clearCart();
    setMessage("Order placed successfully!");
    setTimeout(() => navigate("/orders"), 800);
  };

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold">Checkout</h2>
        <span className="text-sm text-slate-500">Secure • Fast • Reliable</span>
      </div>

      {items.length === 0 ? (
        <p className="mt-6">Your cart is empty.</p>
      ) : (
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 mt-6">
          <form onSubmit={placeOrder} className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <p className="text-sm text-slate-500">Delivery Details</p>
              <p className="text-lg font-semibold">Shipping Address</p>
            </div>
            <input
              className="w-full border p-3 rounded-xl"
              placeholder="Full name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <input
              className="w-full border p-3 rounded-xl"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className="w-full border p-3 rounded-xl"
                placeholder="Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                required
              />
              <input
                className="w-full border p-3 rounded-xl"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="w-full border p-3 rounded-xl"
                placeholder="State"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                required
              />
              <input
                className="w-full border p-3 rounded-xl"
                placeholder="Landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                required
              />
            </div>
            <textarea
              className="w-full border p-3 rounded-xl"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
            <button className="btn w-full" type="submit">
              Place Order • {formatINR(total)}
            </button>
            {message && <p className="text-green-700">{message}</p>}
          </form>

          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm">
            <p className="text-sm text-white/70">Order Summary</p>
            <div className="mt-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-white/70">{item.quantity} x {formatINR(item.price)}</p>
                  </div>
                  <p className="font-semibold">{formatINR(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-white/20 pt-4 flex items-center justify-between">
              <p className="text-sm text-white/70">Total</p>
              <p className="text-xl font-semibold">{formatINR(total)}</p>
            </div>
            <div className="mt-6 bg-white/10 rounded-2xl p-4 text-sm">
              <p className="font-semibold">Delivery Promise</p>
              <p className="text-white/70">Free delivery for orders above ?9,999</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
