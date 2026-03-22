"use client";
// This file overrides the default Next.js global error boundary to prevent useContext errors during prerendering.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
      }}
    >
      <h1 style={{ fontSize: "2rem", color: "#EA4335", marginBottom: "1rem" }}>
        Something went wrong
      </h1>
      <p style={{ color: "#555", fontSize: "1.1rem", marginBottom: "2rem" }}>
        {error.message}
      </p>
      <button
        onClick={reset}
        style={{
          color: "#4285F4",
          fontWeight: "bold",
          fontSize: "1.1rem",
          textDecoration: "underline",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
