"use client";

import { motion } from "framer-motion";

interface BouncyShapeProps {
  color: string;
  className?: string;
  initialRotate?: number;
  delay?: number;
  type?: "square" | "circle";
}

export function BouncyShape({
  color,
  className = "",
  initialRotate = 0,
  delay = 0,
  type = "square",
}: BouncyShapeProps) {
  return (
    <motion.div
      className={`absolute opacity-80 shadow-lg ${
        type === "circle" ? "rounded-full" : "rounded-3xl"
      } ${className}`}
      style={{ backgroundColor: color }}
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
    />
  );
}
