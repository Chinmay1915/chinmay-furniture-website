import { useEffect, useRef, useState } from "react";

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });
}

export default function GoogleAuthButton({ onCredential, disabled = false }) {
  const googleBtnRef = useRef(null);
  const [error, setError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!clientId || !googleBtnRef.current) return;
      try {
        await loadGoogleScript();
        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onCredential(response.credential);
            } else {
              setError("Google login failed. Please try again.");
            }
          },
        });

        googleBtnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          width: 320,
          text: "continue_with",
        });
      } catch {
        if (!cancelled) {
          setError("Unable to load Google sign in.");
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [clientId, onCredential]);

  if (!clientId) {
    return (
      <button type="button" className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white" disabled>
        Google login disabled (missing VITE_GOOGLE_CLIENT_ID)
      </button>
    );
  }

  return (
    <div>
      <div ref={googleBtnRef} className={disabled ? "pointer-events-none opacity-60" : ""} />
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}
