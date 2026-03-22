export function Logo() {
  return (
    <div className="flex items-center gap-2 font-black text-2xl tracking-tighter text-gray-200">
      <span className="flex items-center justify-center bg-white/10 rounded-lg px-2 py-1 shadow-sm border border-white/20">
        <span style={{ color: "#4285F4" }}>&lt;</span>
        <span style={{ color: "#EA4335" }}>/</span>
        <span style={{ color: "#FBBC04" }}>&gt;</span>
      </span>
      <span>Guess The Tech</span>
    </div>
  );
}
