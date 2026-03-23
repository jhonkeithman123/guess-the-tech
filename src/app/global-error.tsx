"use client";
// Client global error UI (required by Turbopack); keep client-safe.
export default function GlobalError({ error }: { error: Error }) {
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
        {error?.message ?? "An unexpected error occurred."}
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
        Go home
      </a>
    </div>
  );
}
