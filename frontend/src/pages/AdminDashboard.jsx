import { useEffect, useMemo, useState } from "react";
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
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({ total_visits: 0, countries: [], platforms: [], visits_by_day: [] });
  const [message, setMessage] = useState("");
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

  const loadData = () => {
    api.get("/products").then((res) => setProducts(res.data));
    api.get("/orders/all").then((res) => setOrders(res.data));
    api.get("/analytics/summary").then((res) => setAnalytics(res.data)).catch(() => {});
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

  const todayStats = useMemo(() => {
    const today = new Date();
    const isToday = (iso) => {
      const d = new Date(iso);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    };
    const todayOrders = orders.filter((o) => isToday(o.created_at));
    const todaySales = todayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    return { count: todayOrders.length, sales: todaySales };
  }, [orders]);

  const productSales = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
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
  }, [orders]);

  const salesByDay = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const day = (o.created_at || "").slice(0, 10);
      if (!day) return;
      if (!map[day]) map[day] = 0;
      map[day] += o.total_price || 0;
    });
    return Object.entries(map)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  }, [orders]);

  const visitsSeries = analytics.visits_by_day.map((d) => d.count);
  const salesSeries = salesByDay.map((d) => d.value);

  const handleAdd = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", newProduct.name);
    data.append("price", newProduct.price);
    data.append("description", newProduct.description);
    data.append("collection", newProduct.collection);
    data.append("image", newImage);
    data.append("model", newModel);

    await api.post("/products", data);
    setMessage("Product added successfully.");
    setNewProduct({ name: "", price: "", description: "", collection: "Living Room" });
    setNewImage(null);
    setNewModel(null);
    loadData();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editId) return;
    const data = new FormData();
    data.append("name", editProduct.name);
    data.append("price", editProduct.price);
    data.append("description", editProduct.description);
    data.append("collection", editProduct.collection);
    if (editImage) data.append("image", editImage);
    if (editModel) data.append("model", editModel);

    await api.put(`/products/${editId}`, data);
    setMessage("Product updated successfully.");
    setEditImage(null);
    setEditModel(null);
    loadData();
  };

  const handleDelete = async (id) => {
    await api.delete(`/products/${id}`);
    setMessage("Product deleted.");
    loadData();
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
          <h2>BR Furniture • Order Slip</h2>
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
              <h2 className="text-2xl font-semibold">Analytics Overview</h2>
              <p className="text-sm text-slate-500">Last refreshed just now</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-outline">Today</button>
              <button className="btn-outline">All channels</button>
            </div>
          </div>

          {message && <p className="text-green-700 mb-4">{message}</p>}

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
                  <p className="text-2xl font-semibold">{formatINR(todayStats.sales)}</p>
                  <Sparkline values={salesSeries} color="#22c55e" />
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-slate-500">Orders</p>
                  <p className="text-2xl font-semibold">{todayStats.count}</p>
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
                    <div className="flex items-center justify-between"><span>Gross sales</span><span>{formatINR(todayStats.sales)}</span></div>
                    <div className="flex items-center justify-between"><span>Discounts</span><span>{formatINR(0)}</span></div>
                    <div className="flex items-center justify-between"><span>Returns</span><span>{formatINR(0)}</span></div>
                    <div className="flex items-center justify-between"><span>Net sales</span><span>{formatINR(todayStats.sales)}</span></div>
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
                  <div className="text-2xl font-semibold">{formatINR(todayStats.sales)}</div>
                  <p className="text-sm text-slate-500">Based on today’s orders</p>
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
        </main>
      </div>
    </div>
  );
}
