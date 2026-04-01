import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { formatINR } from "../utils/format.js";

function Sparkline({ values = [], color = "#f97316" }) {
  const width = 160;
  const height = 40;
  if (!values.length) return <div className="h-10" />;
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points.join(" ")}
      />
    </svg>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({ total_visits: 0, countries: [], platforms: [], visits_by_day: [] });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [active, setActive] = useState("analytics");

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    collection: "Living Room",
  });
  const [newImage, setNewImage] = useState(null);
  const [newModel, setNewModel] = useState(null);

  const [editId, setEditId] = useState("");
  const [editProduct, setEditProduct] = useState({
    name: "",
    price: "",
    description: "",
    collection: "Living Room",
  });
  const [editImage, setEditImage] = useState(null);
  const [editModel, setEditModel] = useState(null);

  const [collections, setCollections] = useState(["Living Room", "Bedroom", "Dining", "Office"]);
  const [newCollection, setNewCollection] = useState("");
  const [campaigns, setCampaigns] = useState([
    { id: "c-1", name: "Summer Living Sale", channel: "Instagram", budget: 25000, status: "Live" },
    { id: "c-2", name: "Bedroom Refresh", channel: "Email", budget: 12000, status: "Draft" },
  ]);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    channel: "Instagram",
    budget: "",
  });
  const [discounts, setDiscounts] = useState([
    { id: "d-1", code: "WELCOME10", percent: 10, active: true },
  ]);
  const [discountForm, setDiscountForm] = useState({
    code: "",
    percent: "",
  });
  const [selectedRegion, setSelectedRegion] = useState("Asia");
  const [selectedCountry, setSelectedCountry] = useState("India");
  const [headerMenu, setHeaderMenu] = useState(["Home", "Collections", "Cart", "Orders", "Admin"]);
  const [footerMenu, setFooterMenu] = useState(["About Us", "Contact", "Shipping", "Returns", "Privacy"]);
  const [newHeaderItem, setNewHeaderItem] = useState("");
  const [newFooterItem, setNewFooterItem] = useState("");
  const [heroContent, setHeroContent] = useState({
    title: "Modern Living Room Accessories",
    subtitle: "Best deals and curated furniture collections.",
    ctaText: "Explore More",
  });
  const [timeRange, setTimeRange] = useState("today");

  const getErrorMessage = (err, fallback) => {
    const detail = err?.response?.data?.detail;
    if (detail === "Invalid token" || detail === "User not found") {
      return "Session expired. Please login again.";
    }
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) return detail[0]?.msg || fallback;
    return fallback;
  };

  useEffect(() => {
    if (error === "Session expired. Please login again.") {
      navigate("/login");
    }
  }, [error, navigate]);

  const loadData = async () => {
    setError("");
    const [productsRes, ordersRes, analyticsRes] = await Promise.allSettled([
      api.get("/products"),
      api.get("/orders/all"),
      api.get("/analytics/summary"),
    ]);

    if (productsRes.status === "fulfilled") {
      setProducts(productsRes.value.data || []);
    } else {
      setProducts([]);
      setError(getErrorMessage(productsRes.reason, "Could not load products."));
    }

    if (ordersRes.status === "fulfilled") {
      setOrders(ordersRes.value.data || []);
    } else {
      setOrders([]);
      setError((prev) => prev || getErrorMessage(ordersRes.reason, "Could not load orders."));
    }

    if (analyticsRes.status === "fulfilled") {
      setAnalytics(analyticsRes.value.data || { total_visits: 0, countries: [], platforms: [], visits_by_day: [] });
    } else {
      setAnalytics({ total_visits: 0, countries: [], platforms: [], visits_by_day: [] });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const selected = products.find((p) => p.id === editId);
    if (selected) {
      setEditProduct({
        name: selected.name || "",
        price: selected.price || "",
        description: selected.description || "",
        collection: selected.collection || "Living Room",
      });
    }

    const productCollections = Array.from(
      new Set(products.map((p) => p.collection).filter(Boolean))
    );
    if (productCollections.length) {
      setCollections((prev) => Array.from(new Set([...prev, ...productCollections])));
    }
  }, [editId, products]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    return orders.filter((order) => {
      const raw = order.created_at;
      if (!raw) return false;
      const created = new Date(raw);
      if (Number.isNaN(created.getTime())) return false;

      if (timeRange === "today") return created >= startOfToday;
      if (timeRange === "yesterday") return created >= startOfYesterday && created < startOfToday;
      if (timeRange === "7d") {
        const from = new Date(now);
        from.setDate(from.getDate() - 7);
        return created >= from;
      }
      if (timeRange === "30d") {
        const from = new Date(now);
        from.setDate(from.getDate() - 30);
        return created >= from;
      }
      if (timeRange === "365d") {
        const from = new Date(now);
        from.setDate(from.getDate() - 365);
        return created >= from;
      }
      return true;
    });
  }, [orders, timeRange]);

  const periodStats = useMemo(() => {
    const sales = filteredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    return { count: filteredOrders.length, sales };
  }, [filteredOrders]);

  const productSales = useMemo(() => {
    const map = {};
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.name;
        if (!map[key]) {
          map[key] = { name: item.name, qty: 0, revenue: 0 };
        }
        map[key].qty += item.quantity;
        map[key].revenue += item.price * item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  const salesByDay = useMemo(() => {
    const map = {};
    filteredOrders.forEach((o) => {
      const day = (o.created_at || "").slice(0, 10);
      if (!day) return;
      if (!map[day]) map[day] = 0;
      map[day] += o.total_price || 0;
    });
    return Object.entries(map)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  }, [filteredOrders]);

  const visitsSeries = analytics.visits_by_day.map((d) => d.count);
  const salesSeries = salesByDay.map((d) => d.value);
  const marketRegions = {
    Asia: ["India", "Japan", "Singapore", "UAE"],
    Europe: ["Germany", "France", "Italy", "Spain"],
    USA: ["United States", "Canada", "Mexico"],
  };

  const customerInsights = useMemo(() => {
    const map = {};
    filteredOrders.forEach((order) => {
      const key = order.phone || order.customer_name || order.id;
      if (!map[key]) {
        map[key] = {
          key,
          name: order.customer_name || "Unknown",
          phone: order.phone || "-",
          country: order.country || "-",
          state: order.state || "-",
          totalOrders: 0,
          totalSpend: 0,
          lastOrderAt: order.created_at || "",
        };
      }
      map[key].totalOrders += 1;
      map[key].totalSpend += order.total_price || 0;
      if ((order.created_at || "") > map[key].lastOrderAt) {
        map[key].lastOrderAt = order.created_at || "";
      }
    });
    return Object.values(map).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [filteredOrders]);

  const rangeLabel = useMemo(() => {
    if (timeRange === "today") return "Today";
    if (timeRange === "yesterday") return "Yesterday";
    if (timeRange === "7d") return "Last 7 Days";
    if (timeRange === "30d") return "Last 30 Days";
    if (timeRange === "365d") return "Last 365 Days";
    return "Selected Range";
  }, [timeRange]);

  const sectionTitles = {
    analytics: "Analytics Overview",
    orders: "Orders",
    products: "Products",
    customers: "Customers",
    marketing: "Marketing",
    discounts: "Discounts",
    content: "Content",
    markets: "Markets",
    collections: "Collections",
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!newImage || !newModel) {
      setError("Please select both an image and a 3D model file.");
      return;
    }
    if (!newModel.name.toLowerCase().endsWith(".glb")) {
      setError("Model file must be a .glb file.");
      return;
    }
    const data = new FormData();
    data.append("name", newProduct.name);
    data.append("price", newProduct.price);
    data.append("description", newProduct.description);
    data.append("collection", newProduct.collection);
    data.append("image", newImage);
    data.append("model", newModel);

    try {
      await api.post("/products", data);
      setMessage("Product added successfully.");
      setNewProduct({ name: "", price: "", description: "", collection: "Living Room" });
      setNewImage(null);
      setNewModel(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Could not add product."));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!editId) return;
    const data = new FormData();
    data.append("name", editProduct.name);
    data.append("price", editProduct.price);
    data.append("description", editProduct.description);
    data.append("collection", editProduct.collection);
    if (editImage) data.append("image", editImage);
    if (editModel) data.append("model", editModel);

    try {
      await api.put(`/products/${editId}`, data);
      setMessage("Product updated successfully.");
      setEditImage(null);
      setEditModel(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Could not update product."));
    }
  };

  const handleDelete = async (id) => {
    setError("");
    setMessage("");
    try {
      await api.delete(`/products/${id}`);
      setMessage("Product deleted.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete product."));
    }
  };

  const handlePrint = (order) => {
    const w = window.open("", "_blank", "width=420,height=640");
    if (!w) return;
    const itemsHtml = order.items
      .map(
        (i) =>
          `<tr>
            <td>${i.name}</td>
            <td style="text-align:center;">${i.quantity}</td>
            <td style="text-align:right;">${formatINR(i.price)}</td>
          </tr>`
      )
      .join("");

    w.document.write(`
      <html>
        <head>
          <title>Order Slip</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            h2 { margin: 0 0 8px; }
            .muted { color: #555; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            td, th { border-bottom: 1px dashed #ccc; padding: 6px 0; }
            .total { margin-top: 12px; font-weight: bold; text-align: right; }
            .box { border: 1px dashed #999; padding: 8px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h2>BR Furniture - Order Slip</h2>
          <div class="muted">Order ID: ${order.id}</div>
          <div class="muted">Placed: ${order.created_at}</div>
          <div class="box">
            <div><strong>Customer:</strong> ${order.customer_name}</div>
            <div><strong>Phone:</strong> ${order.phone || "-"}</div>
            <div><strong>Address:</strong> ${order.address}</div>
            <div><strong>Landmark:</strong> ${order.landmark || "-"}</div>
            <div><strong>State:</strong> ${order.state || "-"}</div>
            <div><strong>Pincode:</strong> ${order.pincode || "-"}</div>
            <div><strong>Country:</strong> ${order.country || "-"}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align:left;">Item</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total">Total: ${formatINR(order.total_price)}</div>
          <p class="muted">Thank you for shopping with us.</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  const addCollection = () => {
    if (newCollection.trim().length < 2) return;
    setCollections((prev) => Array.from(new Set([...prev, newCollection.trim()])));
    setNewCollection("");
  };

  const addCampaign = () => {
    setError("");
    setMessage("");
    if (campaignForm.name.trim().length < 3) {
      setError("Campaign name must be at least 3 characters.");
      return;
    }
    if (!campaignForm.budget || Number(campaignForm.budget) <= 0) {
      setError("Campaign budget must be greater than 0.");
      return;
    }
    setCampaigns((prev) => [
      {
        id: `c-${Date.now()}`,
        name: campaignForm.name.trim(),
        channel: campaignForm.channel,
        budget: Number(campaignForm.budget),
        status: "Draft",
      },
      ...prev,
    ]);
    setCampaignForm({ name: "", channel: "Instagram", budget: "" });
    setMessage("Marketing campaign created.");
  };

  const addDiscount = () => {
    setError("");
    setMessage("");
    const code = discountForm.code.trim().toUpperCase();
    const percent = Number(discountForm.percent);
    if (code.length < 4) {
      setError("Discount code must be at least 4 characters.");
      return;
    }
    if (!percent || percent < 1 || percent > 90) {
      setError("Discount percentage must be between 1 and 90.");
      return;
    }
    setDiscounts((prev) => [{ id: `d-${Date.now()}`, code, percent, active: true }, ...prev]);
    setDiscountForm({ code: "", percent: "" });
    setMessage(`Discount code ${code} created.`);
  };

  const addHeaderMenuItem = () => {
    const item = newHeaderItem.trim();
    if (!item) return;
    setHeaderMenu((prev) => [...prev, item]);
    setNewHeaderItem("");
  };

  const addFooterMenuItem = () => {
    const item = newFooterItem.trim();
    if (!item) return;
    setFooterMenu((prev) => [...prev, item]);
    setNewFooterItem("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="w-64 bg-white border-r min-h-screen p-4 sticky top-0">
          <div className="text-lg font-semibold mb-6">BR Admin</div>
          <nav className="space-y-2 text-sm">
            {[
              { key: "analytics", label: "Home" },
              { key: "orders", label: "Orders", badge: orders.length },
              { key: "products", label: "Products" },
              { key: "customers", label: "Customers" },
              { key: "marketing", label: "Marketing" },
              { key: "discounts", label: "Discounts" },
              { key: "content", label: "Content" },
              { key: "markets", label: "Markets" },
              { key: "analytics", label: "Analytics" },
              { key: "collections", label: "Collections" },
            ].map((item, idx) => (
              <button
                key={`${item.key}-${idx}`}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 ${
                  active === item.key ? "bg-slate-100 font-semibold" : ""
                }`}
                onClick={() => setActive(item.key)}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">{sectionTitles[active] || "Admin"}</h2>
              <p className="text-sm text-slate-500">Last refreshed just now</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                {[
                  { key: "today", label: "Today" },
                  { key: "yesterday", label: "Yesterday" },
                  { key: "7d", label: "7D" },
                  { key: "30d", label: "30D" },
                  { key: "365d", label: "365D" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`px-3 py-2 rounded-md border text-sm ${
                      timeRange === item.key
                        ? "bg-slate-900 text-white border-slate-900"
                        : "border-slate-300 hover:border-slate-400"
                    }`}
                    onClick={() => setTimeRange(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button className="btn-outline">All channels</button>
            </div>
          </div>

          {message && <p className="text-green-700 mb-4">{message}</p>}
          {error && <p className="text-red-600 mb-4">{error}</p>}

          {active === "analytics" && (
            <>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-slate-500">Sessions</p>
                  <p className="text-2xl font-semibold">{analytics.total_visits}</p>
                  <Sparkline values={visitsSeries} color="#0ea5e9" />
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-slate-500">Total sales</p>
                  <p className="text-2xl font-semibold">{formatINR(periodStats.sales)}</p>
                  <p className="text-xs text-slate-500 mt-1">{rangeLabel}</p>
                  <Sparkline values={salesSeries} color="#22c55e" />
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-slate-500">Orders</p>
                  <p className="text-2xl font-semibold">{periodStats.count}</p>
                  <p className="text-xs text-slate-500 mt-1">{rangeLabel}</p>
                  <Sparkline values={salesSeries.map((v) => Math.max(1, v / 1000))} color="#f97316" />
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-slate-500">Conversion rate</p>
                  <p className="text-2xl font-semibold">0%</p>
                  <Sparkline values={visitsSeries.map((v) => Math.max(1, v / 3))} color="#a855f7" />
                </div>
              </div>

              <div className="grid lg:grid-cols-[2fr_1fr] gap-6 mt-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Total sales over time</h3>
                  <div className="h-40 flex items-end gap-2">
                    {salesByDay.map((d) => (
                      <div key={d.date} className="flex-1">
                        <div
                          className="bg-blue-500/80 rounded-md"
                          style={{ height: `${Math.max(6, d.value / 200)}px` }}
                        />
                        <p className="text-xs text-slate-500 mt-2">{d.date.slice(5)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Total sales breakdown</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between"><span>Gross sales</span><span>{formatINR(periodStats.sales)}</span></div>
                    <div className="flex items-center justify-between"><span>Discounts</span><span>{formatINR(0)}</span></div>
                    <div className="flex items-center justify-between"><span>Returns</span><span>{formatINR(0)}</span></div>
                    <div className="flex items-center justify-between"><span>Net sales</span><span>{formatINR(periodStats.sales)}</span></div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6 mt-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Sessions over time</h3>
                  <div className="h-32 flex items-end gap-2">
                    {analytics.visits_by_day.map((d) => (
                      <div key={d.date} className="flex-1">
                        <div
                          className="bg-sky-400/80 rounded-md"
                          style={{ height: `${Math.max(6, d.count * 8)}px` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Sessions by device</h3>
                  <div className="space-y-2 text-sm">
                    {analytics.platforms.map((p) => (
                      <div key={p._id} className="flex items-center justify-between">
                        <span className="truncate max-w-[160px]">{p._id || "Unknown"}</span>
                        <span className="font-semibold">{p.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Sessions by location</h3>
                  <div className="space-y-2 text-sm">
                    {analytics.countries.map((c) => (
                      <div key={c._id} className="flex items-center justify-between">
                        <span>{c._id || "Unknown"}</span>
                        <span className="font-semibold">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6 mt-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Total sales by product</h3>
                  <div className="space-y-2 text-sm">
                    {productSales.map((p) => (
                      <div key={p.name} className="flex items-center justify-between">
                        <span className="truncate max-w-[160px]">{p.name}</span>
                        <span className="font-semibold">{formatINR(p.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Conversion rate breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span>Sessions</span><span>0%</span></div>
                    <div className="flex items-center justify-between"><span>Added to cart</span><span>0%</span></div>
                    <div className="flex items-center justify-between"><span>Reached checkout</span><span>0%</span></div>
                    <div className="flex items-center justify-between"><span>Completed</span><span>0%</span></div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Average order value</h3>
                  <div className="text-2xl font-semibold">
                    {formatINR(periodStats.count > 0 ? periodStats.sales / periodStats.count : 0)}
                  </div>
                  <p className="text-sm text-slate-500">Based on {rangeLabel.toLowerCase()} orders</p>
                </div>
              </div>
            </>
          )}

          {active === "orders" && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Orders</h3>
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="bg-slate-50 p-4 rounded-lg">
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
                    <div className="mt-3 flex gap-2">
                      <button className="btn-outline" onClick={() => handlePrint(order)}>
                        Print POS Slip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "products" && (
            <div className="grid lg:grid-cols-2 gap-10">
              <form onSubmit={handleAdd} className="space-y-3 bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold">Add Product</h3>
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Price (INR)"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                />
                <div className="flex gap-2">
                  <select
                    className="w-full border p-2 rounded"
                    value={newProduct.collection}
                    onChange={(e) => setNewProduct({ ...newProduct, collection: e.target.value })}
                    required
                  >
                    {collections.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setActive("collections")}
                  >
                    Create
                  </button>
                </div>
                <textarea
                  className="w-full border p-2 rounded"
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  required
                />
                <div className="flex gap-3">
                  <input type="file" accept="image/*" onChange={(e) => setNewImage(e.target.files[0])} required />
                  <input type="file" accept=".glb" onChange={(e) => setNewModel(e.target.files[0])} required />
                </div>
                <button className="btn" type="submit">Add Product</button>
              </form>

              <form onSubmit={handleUpdate} className="space-y-3 bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold">Update Product</h3>
                <select
                  className="w-full border p-2 rounded"
                  value={editId}
                  onChange={(e) => setEditId(e.target.value)}
                  required
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Name"
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  required
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Price (INR)"
                  type="number"
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                  required
                />
                <select
                  className="w-full border p-2 rounded"
                  value={editProduct.collection}
                  onChange={(e) => setEditProduct({ ...editProduct, collection: e.target.value })}
                  required
                >
                  {collections.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <textarea
                  className="w-full border p-2 rounded"
                  placeholder="Description"
                  value={editProduct.description}
                  onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                  required
                />
                <div className="flex gap-3">
                  <input type="file" accept="image/*" onChange={(e) => setEditImage(e.target.files[0])} />
                  <input type="file" accept=".glb" onChange={(e) => setEditModel(e.target.files[0])} />
                </div>
                <button className="btn" type="submit">Update Product</button>
              </form>

              <div className="lg:col-span-2">
                <h3 className="text-xl font-semibold mb-3">Products</h3>
                <div className="space-y-2">
                  {products.length === 0 && (
                    <div className="bg-white p-3 rounded text-sm text-slate-600">
                      No products found in the database yet. Add one using the form above.
                    </div>
                  )}
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded">
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-sm text-slate-600">
                          {formatINR(p.price)} | {p.collection || "Featured"}
                        </p>
                      </div>
                      <button className="btn-outline" onClick={() => handleDelete(p.id)}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === "collections" && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Collections</h3>
              <div className="flex gap-2">
                <input
                  className="w-full border p-2 rounded"
                  placeholder="New collection name"
                  value={newCollection}
                  onChange={(e) => setNewCollection(e.target.value)}
                />
                <button className="btn" onClick={addCollection} type="button">Create</button>
              </div>
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {collections.map((c) => (
                  <div key={c} className="bg-slate-50 p-3 rounded">
                    {c}
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "customers" && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Customers Who Ordered Products</h3>
              {customerInsights.length === 0 ? (
                <p className="text-sm text-slate-600">No customers yet. Place an order to see customer data.</p>
              ) : (
                <div className="space-y-3">
                  {customerInsights.map((customer) => (
                    <div key={customer.key} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{customer.name}</p>
                        <p className="text-sm text-slate-600">{formatINR(customer.totalSpend)}</p>
                      </div>
                      <p className="text-sm text-slate-600">
                        {customer.phone} | {customer.state}, {customer.country}
                      </p>
                      <p className="text-sm text-slate-600">
                        Orders: {customer.totalOrders} | Last order: {customer.lastOrderAt || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {active === "marketing" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                <h3 className="text-xl font-semibold">Create Marketing Campaign</h3>
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Campaign name"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                />
                <select
                  className="w-full border p-2 rounded"
                  value={campaignForm.channel}
                  onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}
                >
                  <option>Instagram</option>
                  <option>Facebook</option>
                  <option>Email</option>
                  <option>Google Ads</option>
                </select>
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Budget (INR)"
                  type="number"
                  value={campaignForm.budget}
                  onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })}
                />
                <button type="button" className="btn" onClick={addCampaign}>
                  Create Campaign
                </button>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Campaigns</h3>
                <div className="space-y-2">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-3">
                      <p className="font-semibold">{campaign.name}</p>
                      <p className="text-sm text-slate-600">
                        {campaign.channel} | Budget: {formatINR(campaign.budget)}
                      </p>
                      <p className="text-sm text-slate-600">Status: {campaign.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === "discounts" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                <h3 className="text-xl font-semibold">Add Discount Code</h3>
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Code (e.g. SUMMER20)"
                  value={discountForm.code}
                  onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value })}
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Discount percentage"
                  type="number"
                  min={1}
                  max={90}
                  value={discountForm.percent}
                  onChange={(e) => setDiscountForm({ ...discountForm, percent: e.target.value })}
                />
                <button type="button" className="btn" onClick={addDiscount}>
                  Add Discount
                </button>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Available Discounts</h3>
                <div className="space-y-2">
                  {discounts.map((d) => (
                    <div key={d.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{d.code}</p>
                        <p className="text-sm text-slate-600">{d.percent}% off</p>
                      </div>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() =>
                          setDiscounts((prev) =>
                            prev.map((item) =>
                              item.id === d.id ? { ...item, active: !item.active } : item
                            )
                          )
                        }
                      >
                        {d.active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === "markets" && (
            <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
              <h3 className="text-xl font-semibold">Markets & Regions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600">Region</label>
                  <select
                    className="w-full border p-2 rounded mt-1"
                    value={selectedRegion}
                    onChange={(e) => {
                      const region = e.target.value;
                      setSelectedRegion(region);
                      setSelectedCountry(marketRegions[region][0]);
                    }}
                  >
                    {Object.keys(marketRegions).map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Country</label>
                  <select
                    className="w-full border p-2 rounded mt-1"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                  >
                    {marketRegions[selectedRegion].map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                Active market: <span className="font-semibold">{selectedCountry}</span> in{" "}
                <span className="font-semibold">{selectedRegion}</span>
              </div>
            </div>
          )}

          {active === "content" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                <h3 className="text-xl font-semibold">Homepage Content</h3>
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Hero title"
                  value={heroContent.title}
                  onChange={(e) => setHeroContent({ ...heroContent, title: e.target.value })}
                />
                <textarea
                  className="w-full border p-2 rounded"
                  placeholder="Hero subtitle"
                  value={heroContent.subtitle}
                  onChange={(e) => setHeroContent({ ...heroContent, subtitle: e.target.value })}
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="CTA text"
                  value={heroContent.ctaText}
                  onChange={(e) => setHeroContent({ ...heroContent, ctaText: e.target.value })}
                />
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
                <h3 className="text-xl font-semibold">Menus (Header & Footer)</h3>
                <div>
                  <p className="font-medium mb-2">Header Menu</p>
                  <div className="flex gap-2 mb-2">
                    <input
                      className="w-full border p-2 rounded"
                      placeholder="Add header item"
                      value={newHeaderItem}
                      onChange={(e) => setNewHeaderItem(e.target.value)}
                    />
                    <button type="button" className="btn-outline" onClick={addHeaderMenuItem}>
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {headerMenu.map((item, idx) => (
                      <button
                        key={`${item}-${idx}`}
                        type="button"
                        className="px-3 py-1 rounded-full bg-slate-100 text-sm"
                        onClick={() => setHeaderMenu((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        {item} x
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-2">Footer Menu</p>
                  <div className="flex gap-2 mb-2">
                    <input
                      className="w-full border p-2 rounded"
                      placeholder="Add footer item"
                      value={newFooterItem}
                      onChange={(e) => setNewFooterItem(e.target.value)}
                    />
                    <button type="button" className="btn-outline" onClick={addFooterMenuItem}>
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {footerMenu.map((item, idx) => (
                      <button
                        key={`${item}-${idx}`}
                        type="button"
                        className="px-3 py-1 rounded-full bg-slate-100 text-sm"
                        onClick={() => setFooterMenu((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        {item} x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}



