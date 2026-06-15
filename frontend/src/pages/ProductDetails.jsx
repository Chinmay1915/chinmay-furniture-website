import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";
import ARViewer from "../components/ARViewer.jsx";
import ProductCard from "../components/ProductCard.jsx";
import Toast from "../components/Toast.jsx";
import { sampleProducts, productDetailsExtras } from "../services/mockData.js";
import { formatINR } from "../utils/format.js";
import { handleProductImageError } from "../utils/imageFallback.js";

const PRODUCTS_CACHE_KEY = "products_cache_v2";

export default function ProductDetails() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [showAR, setShowAR] = useState(false);
  const [bundleQty, setBundleQty] = useState(1);
  const [activeImage, setActiveImage] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const sampleMatch = sampleProducts.find((p) => p.id === id);
    if (sampleMatch) {
      setProduct(sampleMatch);
    }

    localStorage.removeItem("products_cache");
    const cachedProducts = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (cachedProducts) {
      try {
        const parsed = JSON.parse(cachedProducts);
        if (Array.isArray(parsed)) {
          const cachedMatch = parsed.find((p) => p.id === id);
          if (cachedMatch) {
            setProduct(cachedMatch);
          }
        }
      } catch {
        // ignore malformed cache
      }
    }

    api
      .get(`/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        const cachedProductsSafe = localStorage.getItem(PRODUCTS_CACHE_KEY);
        if (cachedProductsSafe) {
          try {
            const parsed = JSON.parse(cachedProductsSafe);
            if (Array.isArray(parsed)) {
              const updated = parsed.filter((p) => p.id !== res.data.id);
              updated.push(res.data);
              localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updated));
            }
          } catch {
            localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify([res.data]));
          }
        } else {
          localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify([res.data]));
        }
      })
      .catch(() => {
        if (!sampleMatch) {
          setProduct(sampleProducts[0]);
        }
      });
  }, [id]);

  const extra = product ? productDetailsExtras[product.id] : null;
  const gallery = useMemo(() => {
    if (!product) return [];
    const baseImage = product.image_url;
    const merged = [baseImage, ...(extra?.gallery || [])].filter(Boolean);
    const unique = [];
    merged.forEach((img) => {
      if (!unique.includes(img)) unique.push(img);
    });
    while (unique.length < 3) unique.push(baseImage);
    return unique;
  }, [product, extra]);
  const reviews = extra?.reviews || [
    { name: "Arjun", rating: 5, text: "Looks premium and feels solid." },
    { name: "Sana", rating: 4, text: "Matches the photos perfectly." },
  ];

  const productMap = useMemo(() => {
    const map = {};
    sampleProducts.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, []);

  const frequently = (extra?.frequentlyBought || [])
    .map((pid) => productMap[pid])
    .filter(Boolean);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const sameCollection = sampleProducts.filter(
      (item) => item.id !== product.id && item.collection === product.collection
    );
    return sameCollection.slice(0, 3);
  }, [product]);

  useEffect(() => {
    if (!gallery.length) return;
    setActiveImage((prev) => (prev && gallery.includes(prev) ? prev : gallery[0]));
  }, [gallery]);

  if (!product) {
    return (
      <div className="container-page py-10 page-fade">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
          <div className="h-[440px] rounded-3xl skeleton" />
          <div className="rounded-3xl bg-white p-6 shadow-sm space-y-4">
            <div className="h-5 w-28 skeleton rounded" />
            <div className="h-9 w-3/4 skeleton rounded" />
            <div className="h-5 w-full skeleton rounded" />
            <div className="h-12 w-full skeleton rounded" />
          </div>
        </div>
      </div>
    );
  }

  const bundleDeals = [
    { qty: 1, label: "Single piece", discount: 0 },
    { qty: 2, label: "Buy 2 - 10% off", discount: 0.1 },
    { qty: 3, label: "Buy 3 - 20% off", discount: 0.2 },
  ];

  const selectedDeal = bundleDeals.find((d) => d.qty === bundleQty) || bundleDeals[0];
  const bundleTotal = product.price * selectedDeal.qty * (1 - selectedDeal.discount);

  const handleAddBundle = () => {
    for (let i = 0; i < bundleQty; i += 1) {
      addItem(product);
    }
    setToast(`${bundleQty} item${bundleQty > 1 ? "s" : ""} added to cart.`);
  };

  return (
    <div className="container-page py-10 page-fade">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900">Home</Link>
        <span>/</span>
        <a href={`/#collection-${(product.collection || "").replace(/\s+/g, "-").toLowerCase()}`} className="hover:text-slate-900">
          {product.collection || "Collection"}
        </a>
        <span>/</span>
        <span className="text-slate-900">{product.name}</span>
      </div>
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl shadow-lg">
            <img
              src={activeImage || gallery[0]}
              alt={product.name}
              className="w-full h-[440px] object-cover"
              onError={handleProductImageError}
            />
            <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs">
              AR Ready
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {gallery.slice(0, 3).map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`rounded-xl overflow-hidden border ${img === (activeImage || gallery[0]) ? "border-slate-900" : "border-transparent"}`}
                onClick={() => setActiveImage(img)}
              >
                <img
                  src={img}
                  alt={`${product.name} ${idx + 1}`}
                  className="h-24 w-full object-cover"
                  onError={handleProductImageError}
                />
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Product Description</h3>
            <p className="text-slate-600 mt-3">
              {product.description} Designed with a low-profile silhouette and warm, tactile finishes
              to make any space feel composed. The structure is engineered for daily comfort while
              keeping a clean, architectural look.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-900 font-semibold">Dimensions</p>
                <p>W 84 cm x D 78 cm x H 76 cm</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-900 font-semibold">Materials</p>
                <p>Solid wood, linen blend</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-900 font-semibold">Care</p>
                <p>Dry clean only, wipe with soft cloth</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-900 font-semibold">Warranty</p>
                <p>1-year coverage</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 text-xs">
            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Top Rated</span>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">In Stock</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold mt-3">{product.name}</h2>
          <p className="text-slate-600 mt-2">{product.description}</p>
          <p className="text-2xl font-semibold mt-4">{formatINR(product.price)}</p>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Bundle & Save</h3>
            <div className="mt-3 space-y-2">
              {bundleDeals.map((deal) => (
                <label
                  key={deal.qty}
                  className="bg-white rounded-xl p-3 flex items-center justify-between border border-transparent hover:border-slate-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="bundle"
                      checked={bundleQty === deal.qty}
                      onChange={() => setBundleQty(deal.qty)}
                    />
                    <div>
                      <p className="font-semibold">{deal.label}</p>
                      <p className="text-xs text-slate-500">Best for complete sets</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">
                    {deal.discount > 0
                      ? formatINR(product.price * deal.qty * (1 - deal.discount))
                      : formatINR(product.price)}
                  </p>
                </label>
              ))}
            </div>
            <div className="mt-3 text-sm text-slate-600">
              Selected: {selectedDeal.label} - Total {formatINR(bundleTotal)}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button className="btn w-full" onClick={handleAddBundle}>
              Add Bundle to Cart
            </button>
            <button
              className="btn-outline w-full"
              onClick={() => setShowAR(true)}
              disabled={!product.model_url}
            >
              View in Your Space
            </button>
          </div>
          {!product.model_url && (
            <p className="text-sm text-slate-500 mt-2">No 3D model available for this product.</p>
          )}

          <div className="mt-6 bg-white rounded-2xl p-4">
            <p className="text-sm text-slate-500">How you get it</p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Delivery</span>
                <span className="text-slate-600">3-6 days - Free over 9,999</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pickup</span>
                <span className="text-slate-600">Available in select stores</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Assembly</span>
                <span className="text-slate-600">Optional at checkout</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-600">
            <div className="bg-white rounded-xl p-3">
              <p className="text-slate-900 font-semibold">Returns</p>
              <p>Free pickup within 7 days</p>
            </div>
            <div className="bg-white rounded-xl p-3">
              <p className="text-slate-900 font-semibold">Support</p>
              <p>24x7 chat assistance</p>
            </div>
            <div className="bg-white rounded-xl p-3">
              <p className="text-slate-900 font-semibold">Finish</p>
              <p>Natural oak</p>
            </div>
            <div className="bg-white rounded-xl p-3">
              <p className="text-slate-900 font-semibold">Style</p>
              <p>Modern minimal</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h3 className="text-2xl font-semibold">Related Products</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {(relatedProducts.length ? relatedProducts : sampleProducts.filter((item) => item.id !== product.id).slice(0, 3)).map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h3 className="text-2xl font-semibold">Customer Reviews</h3>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {reviews.map((r, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm">
              <p className="font-semibold">{r.name}</p>
              <p className="text-amber-500 text-sm">Rating: {r.rating}/5</p>
              <p className="text-sm text-slate-600 mt-2">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h3 className="text-2xl font-semibold">More Photos</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {(gallery.length ? gallery : [product.image_url]).map((img, idx) => (
            <div key={`${img}-${idx}`} className="bg-white p-4 rounded-2xl card-hover">
              <img
                src={img}
                alt={`${product.name} ${idx + 1}`}
                className="h-40 w-full object-cover rounded-xl"
                onError={handleProductImageError}
              />
              <p className="font-semibold mt-2">{product.name}</p>
              <p className="text-sm text-slate-600">{formatINR(product.price)}</p>
            </div>
          ))}
        </div>
      </section>

      {showAR && (
        <ARViewer modelUrl={product.model_url} onClose={() => setShowAR(false)} />
      )}
    </div>
  );
}

