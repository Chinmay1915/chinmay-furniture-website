import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import Logo from "../assets/logo.svg";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container-page flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={Logo} alt="BR Furniture" className="h-8 w-auto" />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/">Home</Link>
          <div className="relative">
            <button
              className="btn-outline"
              onClick={() => setOpen((v) => !v)}
            >
              Collections
            </button>
            {open && (
              <div
                className="absolute mt-2 w-44 rounded-lg border bg-white shadow-md z-20"
                onMouseLeave={() => setOpen(false)}
              >
                <a className="block px-4 py-2 hover:bg-slate-50" href="/#collection-living-room">
                  Living Room
                </a>
                <a className="block px-4 py-2 hover:bg-slate-50" href="/#collection-bedroom">
                  Bedroom
                </a>
                <a className="block px-4 py-2 hover:bg-slate-50" href="/#collection-dining">
                  Dining
                </a>
                <a className="block px-4 py-2 hover:bg-slate-50" href="/#collection-office">
                  Office
                </a>
              </div>
            )}
          </div>
          <Link to="/cart">Cart ({items.length})</Link>
          {user && <Link to="/orders">Orders</Link>}
          {user?.is_admin && <Link to="/admin-dashboard">Admin</Link>}
          {!user && <Link to="/login">Login</Link>}
          {!user && <Link to="/signup">Signup</Link>}
          {user && (
            <button className="btn-outline" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
