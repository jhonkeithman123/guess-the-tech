"use client";
// This file renders a custom 404 page for the Next.js App Router
export default function NotFound() {
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
      <h1 style={{ fontSize: "3rem", color: "#EA4335", marginBottom: "1rem" }}>
        404 - Page Not Found
      </h1>
      <p style={{ color: "#555", fontSize: "1.25rem", marginBottom: "2rem" }}>
        Sorry, the page you are looking for does not exist.
      </p>
      <a
        href="/"
        style={{
          color: "#4285F4",
          fontWeight: "bold",
          fontSize: "1.1rem",
          textDecoration: "underline",
        }}
      >
        Go back home
      </a>
    </div>
  );
}
