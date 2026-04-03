import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import ProductCard from "../components/ProductCard.jsx";
import { sampleProducts, collections, bestSellers } from "../services/mockData.js";
import { formatINR } from "../utils/format.js";
import { handleProductImageError } from "../utils/imageFallback.js";

const PRODUCTS_CACHE_KEY = "products_cache_v2";

const heroSlides = [
  {
    title: "Modern Living Room Accessories",
    subtitle: "Real concern for all of us, next time you feel like",
    priceLabel: "Ceramic Plates",
    price: "Rs. 5,999",
    image:
      "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?w=1400",
  },
  {
    title: "Minimal Bedroom Details",
    subtitle: "Soft textures, calm colors, better rest.",
    priceLabel: "Linen Throw",
    price: "Rs. 3,499",
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1400",
  },
  {
    title: "Dining Room Stories",
    subtitle: "Made for long conversations and warm meals.",
    priceLabel: "Oak Dining Set",
    price: "Rs. 29,999",
    image:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1400",
  },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [slide, setSlide] = useState(0);
  const [tab, setTab] = useState("new");

  useEffect(() => {
    localStorage.removeItem("products_cache");
    const cachedProducts = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (cachedProducts) {
      try {
        const parsed = JSON.parse(cachedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
        }
      } catch {
        // ignore malformed cache
      }
    }

    api
      .get("/products")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setProducts(res.data);
          localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(res.data));
        } else {
          setError("No products found, showing sample data.");
          setProducts([]);
        }
      })
      .catch(() => {
        setError("Backend not reachable, showing sample data.");
        setProducts([]);
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const displayProducts = useMemo(() => {
    const byId = new Map();
    sampleProducts.forEach((p) => byId.set(p.id, p));
    products.forEach((p) => byId.set(p.id, p));
    return Array.from(byId.values());
  }, [products]);
  const bestSellerProducts = useMemo(
    () => bestSellers.map((id) => displayProducts.find((p) => p.id === id)).filter(Boolean),
    [displayProducts]
  );

  const tabProducts = tab === "new"
    ? displayProducts.slice(0, 8)
    : bestSellerProducts.length
      ? bestSellerProducts
      : displayProducts.slice(0, 8);

  const categoryShowcase = useMemo(() => displayProducts.slice(0, 4), [displayProducts]);
  const offerTiles = useMemo(() => {
    if (collections.length >= 4) return collections.slice(0, 4);
    return [...collections, ...collections].slice(0, 4);
  }, []);

  return (
    <div className="pb-16">
      <section className="container-page py-8">
        <div className="relative overflow-hidden rounded-3xl shadow-xl">
          {heroSlides.map((s, idx) => (
            <div
              key={s.title}
              className={`absolute inset-0 transition-opacity duration-700 ${idx === slide ? "opacity-100" : "opacity-0"}`}
            >
              <img src={s.image} alt={s.title} className="h-[460px] w-full object-cover" />
              <div className="absolute inset-0 bg-black/45" />
              <div className="absolute inset-0 flex items-center">
                <div className="px-8 md:px-14 text-white max-w-2xl">
                  <h1 className="text-4xl md:text-6xl leading-tight">{s.title}</h1>
                  <p className="mt-4 text-white/80">{s.subtitle}</p>
                  <div className="mt-6 text-white/90 text-sm">
                    <p className="uppercase tracking-wide">{s.priceLabel}</p>
                    <p className="text-lg font-semibold">{s.price}</p>
                  </div>
                  <a href="#browse" className="btn mt-6 inline-block">Explore More</a>
                </div>
              </div>
            </div>
          ))}
          <div className="h-[460px]" />
          <div className="absolute bottom-6 left-8 flex items-center gap-4 text-white/80 text-sm">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSlide(idx)}
                className={`border-b-2 pb-1 ${idx === slide ? "border-white" : "border-transparent"}`}
              >
                {String(idx + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <h2 className="section-title text-center">Shop Categories</h2>
        <div className="grid lg:grid-cols-[1.3fr_1fr_1fr] gap-4 mt-6">
          {collections.map((c) => (
            <a
              key={c.name}
              href="#browse"
              className="relative overflow-hidden rounded-2xl shadow-sm"
            >
              <img src={c.image} alt={c.name} className="h-64 w-full object-cover" />
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-lg font-semibold uppercase">{c.name}</p>
                <p className="text-sm text-white/70">Hand crafted goodies with the best materials.</p>
              </div>
            </a>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {categoryShowcase.map((p) => (
            <Link
              key={p.id}
              to={`/product/${p.id}`}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition"
            >
              <img
                src={p.image_url}
                alt={p.name}
                className="h-40 w-full object-cover"
                onError={handleProductImageError}
              />
              <div className="p-3">
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-slate-500 mt-1">{formatINR(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-8 text-center">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="font-semibold">Free & Fast Shipping</p>
            <p className="text-sm text-slate-500">Receive free shipping all over the world.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="font-semibold">Secure Payment Gateways</p>
            <p className="text-sm text-slate-500">We use highly secured gateways for your data.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="font-semibold">Return & Refund Policy</p>
            <p className="text-sm text-slate-500">Simply return within 30 days for exchange.</p>
          </div>
        </div>
      </section>

      <section id="browse" className="container-page py-8">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Browse Our Items</h2>
          <div className="flex gap-6 text-sm">
            <button
              className={`uppercase tracking-wide ${tab === "new" ? "border-b border-slate-900" : "text-slate-500"}`}
              onClick={() => setTab("new")}
            >
              New Arrivals
            </button>
            <button
              className={`uppercase tracking-wide ${tab === "best" ? "border-b border-slate-900" : "text-slate-500"}`}
              onClick={() => setTab("best")}
            >
              Best Sellers
            </button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {tabProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="h-56 w-full object-cover"
                onError={handleProductImageError}
              />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm">{formatINR(product.price)}</p>
                </div>
                <p className="text-xs text-slate-500 uppercase mt-1">{product.collection || "Kitchen"}</p>
                <div className="flex gap-2 mt-3">
                  <span className="h-4 w-4 rounded-full bg-slate-900" />
                  <span className="h-4 w-4 rounded-full bg-amber-300" />
                  <span className="h-4 w-4 rounded-full bg-slate-200" />
                </div>
                <Link to={`/product/${product.id}`} className="btn-outline mt-4 inline-block">
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-8">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-center">
          <div className="relative overflow-hidden rounded-3xl shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1400"
              alt="Unique design"
              className="h-[380px] w-full object-cover"
            />
            <div className="absolute left-6 top-6 bg-white/90 rounded-xl p-3 text-xs">
              <p className="font-semibold">01</p>
              <p>day</p>
            </div>
            <div className="absolute left-24 top-6 bg-white/90 rounded-xl p-3 text-xs">
              <p className="font-semibold">12</p>
              <p>hrs</p>
            </div>
            <div className="absolute left-44 top-6 bg-white/90 rounded-xl p-3 text-xs">
              <p className="font-semibold">32</p>
              <p>mins</p>
            </div>
            <div className="absolute left-64 top-6 bg-white/90 rounded-xl p-3 text-xs">
              <p className="font-semibold">20</p>
              <p>secs</p>
            </div>
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl leading-tight">Everyone Always Loves Our Unique Design.</h2>
            <p className="text-slate-600 mt-4">Best deals night you're free like earth.</p>
            <button className="btn mt-6">Starting From Rs. 9,999</button>
          </div>
        </div>
      </section>

      <section id="about-us" className="container-page py-8">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-center">
          <div className="relative overflow-hidden rounded-3xl shadow-md">
            <img
              src="https://images.unsplash.com/photo-1517705008128-361805f42e86?w=1400"
              alt="BR Furniture workshop"
              className="h-[380px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute bottom-5 left-5 right-5 bg-white/90 rounded-xl p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Since 2018</p>
              <p className="text-lg font-semibold">Designed for modern homes, built to last.</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">About Us</p>
            <h2 className="section-title mt-2">We make furniture that feels like home.</h2>
            <p className="text-slate-600 mt-3 leading-7">
              BR Furniture blends clean design with everyday comfort. From living room essentials
              to statement pieces, every product is curated to match Indian homes, real lifestyles,
              and long-term durability.
            </p>
            <p className="text-slate-600 mt-3 leading-7">
              We focus on premium materials, practical craftsmanship, and a smooth online shopping
              experience so you can confidently choose pieces you will love for years.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mt-6">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-2xl font-semibold">10k+</p>
                <p className="text-sm text-slate-500">Happy Customers</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-2xl font-semibold">250+</p>
                <p className="text-sm text-slate-500">Products Curated</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-2xl font-semibold">4.8/5</p>
                <p className="text-sm text-slate-500">Customer Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <h2 className="section-title text-center">On Going Offers & Deals</h2>
        <p className="text-center text-slate-500 mt-2">Best deals night you're free like earth.</p>
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          {offerTiles.map((s, idx) => (
            <div key={idx} className="relative overflow-hidden rounded-2xl">
              <img src={s.image} alt={s.name} className="h-64 w-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                +
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-5">
          <button className="btn-outline">&lt;</button>
          <button className="btn-outline">&gt;</button>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center border">
          <h3 className="text-3xl font-semibold">Join Our Newsletter For Rs. 2000 Off</h3>
          <p className="text-slate-500 mt-2">We'll email your voucher for your first order over Rs. 10,000.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <input className="border px-4 py-3 rounded-xl w-full sm:w-96" placeholder="example@gmail.com" />
            <button className="btn">Subscribe</button>
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1400"
              alt="Year end sale"
              className="h-64 w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute left-6 bottom-6 text-white">
              <h3 className="text-3xl">Year End Sale 70% Off</h3>
              <button className="btn mt-4">Grab Offer Now</button>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1400"
              alt="Dining tables"
              className="h-64 w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute left-6 bottom-6 text-white">
              <h3 className="text-3xl">Dining Tables At Low Cost</h3>
              <button className="btn mt-4">View Products</button>
            </div>
          </div>
        </div>
      </section>

      <section id="all-products" className="container-page py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">All Products</h2>
        </div>
        {error && <p className="text-sm text-amber-600 mb-3">{error}</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
