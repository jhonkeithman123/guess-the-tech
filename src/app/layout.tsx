export const metadata = {
  title: {
    default: "Guess The Tech",
    template: "%s | Guess The Tech",
  },
  description:
    "A GDG-themed quiz game. Identify technologies, face progressive difficulty, and climb the leaderboard!",
};
import { FloatingShapes } from "@/components/ui/FloatingShapes";
import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FloatingShapes />
        {children}
      </body>
    </html>
  );
}
