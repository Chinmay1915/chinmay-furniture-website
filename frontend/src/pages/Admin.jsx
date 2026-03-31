import { useEffect, useState } from "react";
import api from "../services/api.js";
import { formatINR } from "../utils/format.js";

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", description: "" });
  const [imageFile, setImageFile] = useState(null);
  const [modelFile, setModelFile] = useState(null);
  const [adminKey, setAdminKey] = useState("");
  const [message, setMessage] = useState("");

  const loadProducts = () => {
    api.get("/products").then((res) => setProducts(res.data));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", form.name);
    data.append("price", form.price);
    data.append("description", form.description);
    data.append("image", imageFile);
    data.append("model", modelFile);

    await api.post("/products", data, {
      headers: { "x-admin-key": adminKey },
    });

    setForm({ name: "", price: "", description: "" });
    setImageFile(null);
    setModelFile(null);
    setMessage("Product added");
    loadProducts();
  };

  const handleDelete = async (id) => {
    await api.delete(`/products/${id}`, {
      headers: { "x-admin-key": adminKey },
    });
    loadProducts();
  };

  return (
    <div className="container-page py-8">
      <h2 className="text-2xl font-semibold mb-4">Admin</h2>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-xl">
        <input
          className="w-full border p-2 rounded"
          placeholder="Admin key"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Product name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <textarea
          className="w-full border p-2 rounded"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <div className="flex gap-3">
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} required />
          <input type="file" accept=".glb" onChange={(e) => setModelFile(e.target.files[0])} required />
        </div>
        <button className="btn" type="submit">Add Product</button>
        {message && <p className="text-green-700">{message}</p>}
      </form>

      <div className="mt-8">
        <h3 className="font-semibold mb-2">Existing Products</h3>
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-slate-600">{formatINR(p.price)}</p>
              </div>
              <button className="btn-outline" onClick={() => handleDelete(p.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
