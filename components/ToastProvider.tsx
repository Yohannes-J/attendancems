"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: 500,
          padding: "10px 16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        },
        success: {
          iconTheme: { primary: "#4f46e5", secondary: "#fff" },
          style: { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" },
        },
        error: {
          style: { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" },
        },
      }}
    />
  );
}
