export const metadata = {
  title: {
    default: "Guess The Tech",
    template: "%s | Guess The Tech",
  },
  description:
    "A GDG-themed quiz game. Identify technologies, face progressive difficulty, and climb the leaderboard!",
};
import FloatingShapesClient from "@/components/client/ui/FloatingShapesClient";
import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FloatingShapesClient />
        {children}
      </body>
    </html>
  );
}
