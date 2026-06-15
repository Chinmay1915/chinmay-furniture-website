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
  const [countryCode, setCountryCode] = useState("+91");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [stateName, setStateName] = useState("");
  const [landmark, setLandmark] = useState("");
  const [message, setMessage] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  const allowedCountries = ["India", "United States", "United Kingdom", "UAE", "Singapore"];
  const allowedStates = {
    India: ["Delhi", "Maharashtra", "Karnataka", "Uttar Pradesh", "Tamil Nadu", "Punjab", "Gujarat", "Rajasthan"],
    "United States": ["California", "New York", "Texas", "Florida", "Illinois"],
    "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
    UAE: ["Dubai", "Abu Dhabi", "Sharjah"],
    Singapore: ["Central", "East", "North", "North-East", "West"],
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const placeOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setMessage("");

    const nameClean = customerName.trim();
    if (!nameClean) {
      setMessage("Please fill the name before proceeding.");
      return;
    }
    if (nameClean.length < 2 || nameClean.length > 20) {
      setMessage("Name must be between 2 and 20 characters.");
      return;
    }
    if (!/^[A-Za-z ]+$/.test(nameClean)) {
      setMessage("Name must contain only letters.");
      return;
    }
    if (!phone.trim() || !/^[0-9]+$/.test(phone.trim())) {
      setMessage("Phone number must be numeric only.");
      return;
    }
    if (phone.trim().length !== 10) {
      setMessage("Phone number must be exactly 10 digits.");
      return;
    }
    const phoneDigits = `${countryCode.replace("+", "")}${phone}`;
    if (!pincode.trim() || !/^[0-9]{6}$/.test(pincode.trim())) {
      setMessage("Pincode must be exactly 6 digits.");
      return;
    }
    if (!allowedCountries.includes(country)) {
      setMessage("Please select a valid country.");
      return;
    }
    if (!allowedStates[country]?.includes(stateName)) {
      setMessage("Please select a valid state for the chosen country.");
      return;
    }
    if (!address.trim()) {
      setMessage("Please fill the address before proceeding.");
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setMessage("Unable to load Razorpay checkout. Please try again.");
      return;
    }

    setIsPaying(true);
    try {
      const orderRes = await api.post("/payments/create-order", {
        amount: Math.round(total * 100),
        currency: "INR",
        receipt: `order_${Date.now()}`,
        notes: {
          customer_name: customerName,
          phone,
        },
      });

      const { key_id: keyId, order } = orderRes.data;
      const storedUser = localStorage.getItem("user");
      let userEmail = "";
      if (storedUser) {
        try {
          userEmail = JSON.parse(storedUser)?.email || "";
        } catch {
          userEmail = "";
        }
      }

      const razorpay = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "BR Furniture",
        description: "Furniture Order Payment",
        order_id: order.id,
        prefill: {
          name: customerName,
          email: userEmail,
          contact: phoneDigits,
        },
        notes: {
          address,
          country,
          state: stateName,
        },
        theme: { color: "#0f172a" },
        modal: {
          ondismiss: () => {
            setMessage("Payment cancelled.");
            setIsPaying(false);
          },
        },
        handler: async (response) => {
          try {
            await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

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
              phone: phoneDigits,
              pincode,
              country,
              state: stateName,
              landmark,
              payment_id: response.razorpay_payment_id,
              payment_order_id: response.razorpay_order_id,
              payment_signature: response.razorpay_signature,
            });

            clearCart();
            setMessage("Payment successful! Order placed.");
            setTimeout(() => navigate("/orders"), 800);
          } catch (err) {
            setMessage(err.response?.data?.detail || "Payment verification failed.");
          } finally {
            setIsPaying(false);
          }
        },
      });

      razorpay.open();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to start payment.");
      setIsPaying(false);
    }
  };

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold">Checkout</h2>
        <span className="text-sm text-slate-500">Secure - Fast - Reliable</span>
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
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              maxLength={20}
              required
            />
            {touched.name && !customerName.trim() && (
              <p className="text-xs text-red-600">Please fill this section before continuing.</p>
            )}
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <select
                className="border p-3 rounded-xl bg-white"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={!customerName.trim()}
              >
                <option value="+91">+91 (IN)</option>
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+971">+971 (UAE)</option>
                <option value="+65">+65 (SG)</option>
              </select>
              <input
                className="w-full border p-3 rounded-xl"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^0-9]/g, "");
                  if (next.length <= 10) setPhone(next);
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                disabled={!customerName.trim()}
                maxLength={10}
                required
              />
            </div>
            {touched.phone && phone.trim() && !/^[0-9]+$/.test(phone.trim()) && (
              <p className="text-xs text-red-600">Phone number must be numeric.</p>
            )}
            {touched.phone && phone.trim() && phone.trim().length !== 10 && (
              <p className="text-xs text-red-600">Phone number must be exactly 10 digits.</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <input
                className="w-full border p-3 rounded-xl"
                placeholder="Pincode"
                value={pincode}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^0-9]/g, "");
                  if (next.length <= 6) setPincode(next);
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, pincode: true }))}
                disabled={!phone.trim()}
                maxLength={6}
                required
              />
              <select
                className="w-full border p-3 rounded-xl bg-white"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setStateName("");
                }}
                disabled={!pincode.trim()}
                required
              >
                {allowedCountries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {touched.pincode && pincode.trim() && pincode.trim().length !== 6 && (
              <p className="text-xs text-red-600">Pincode must be exactly 6 digits.</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <select
                className="w-full border p-3 rounded-xl bg-white"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                disabled={!country.trim()}
                required
              >
                <option value="">Select state</option>
                {(allowedStates[country] || []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                className="w-full border p-3 rounded-xl"
                placeholder="Landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value.replace(/[^A-Za-z0-9 ,.-]/g, ""))}
                disabled={!stateName.trim()}
                required
              />
            </div>
            {touched.landmark && landmark.trim() && !/^[A-Za-z0-9 ,.-]+$/.test(landmark.trim()) && (
              <p className="text-xs text-red-600">Landmark must not include special symbols.</p>
            )}
            <textarea
              className="w-full border p-3 rounded-xl"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, address: true }))}
              disabled={!landmark.trim()}
              required
            />
            {touched.address && !address.trim() && (
              <p className="text-xs text-red-600">Please fill this section before continuing.</p>
            )}
            <button className="btn w-full" type="submit" disabled={isPaying}>
              {isPaying ? "Processing..." : `Pay with Razorpay - ${formatINR(total)}`}
            </button>
            {message && <p className={message.includes("successful") ? "text-green-700" : "text-red-600"}>{message}</p>}
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
              <p className="text-white/70">Free delivery for orders above Rs. 9,999</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
