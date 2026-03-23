"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface BouncyShapeProps {
  color?: string;
  className?: string;
  initialRotate?: number;
  delay?: number;
  type?: "square" | "circle" | "triangle";
  children?: React.ReactNode;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

export function BouncyShape({
  color,
  className = "",
  initialRotate = 0,
  delay = 0,
  type = "square",
  children,
  objectFit = "contain",
}: BouncyShapeProps) {
  const src = typeof children === "string" ? children : undefined;
  const isLCP = src?.includes("GDG.png");
  return (
    <motion.div
      className={`absolute opacity-80 shadow-lg ${
        type === "circle"
          ? "rounded-full"
          : type === "triangle"
            ? "[clip-path:polygon(50%_0%,0%_100%,100%_100%)]"
            : "rounded-3xl"
      } ${className}`}
      style={color ? { backgroundColor: color } : undefined}
      initial={{ rotate: initialRotate, scale: 1 }}
      animate={{
        y: [0, -20, 0],
        rotate: [initialRotate, initialRotate + 10, initialRotate],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      whileHover={{ scale: 1.1, rotate: initialRotate - 5 }}
    >
      {children && (
        <div className="relative w-full h-full">
          <Image
            src={src as string}
            alt=""
            role="presentation"
            fill
            sizes="(min-width: 1024px) 96px, 64px"
            loading={isLCP ? "eager" : "lazy"}
            style={{ objectFit }}
          />
        </div>
      )}
    </motion.div>
  );
}
