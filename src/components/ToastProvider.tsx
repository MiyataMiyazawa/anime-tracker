"use client";

import { useState, useEffect } from "react";

export default function ToastProvider() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const toast = sessionStorage.getItem("toast");
    if (toast) {
      sessionStorage.removeItem("toast");
      setMessage(toast);
      const timer = setTimeout(() => setMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!message) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-50 bg-success/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg animate-[toast-fade_2.5s_ease-out_forwards]" style={{ top: "calc(1rem + env(safe-area-inset-top, 0px))" }}>
      {message}
    </div>
  );
}
