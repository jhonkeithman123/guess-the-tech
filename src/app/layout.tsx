export const metadata = {
  title: {
    default: "Guess The Tech",
    template: "%s | Guess The Tech",
  },
  description:
    "A GDG-themed quiz game. Identify technologies, face progressive difficulty, and climb the leaderboard!",
  icons: {
    icon: "/icon/favicon.ico",
  },
};
import FloatingShapesClient from "@/components/client/FloatingShapesClient";
import AudioInitializer from "@/components/client/AudioInitializer";
import AudioEnableButton from "@/components/client/AudioEnableButton";
import AudioDebugOverlay from "@/components/client/AudioDebugOverlay";
import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FloatingShapesClient />
        <AudioInitializer />
        <AudioEnableButton />
        {process.env.NODE_ENV !== "production" && <AudioDebugOverlay />}
        {children}
      </body>
    </html>
  );
}
