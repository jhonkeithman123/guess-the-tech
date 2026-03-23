"use client";

import { useEffect, useState } from "react";
import { BouncyShape } from "./BouncyShape";

const SHAPES = [
  {
    color: "#EA4335",
    className: "w-18 h-18 top-1/3 left-10 opacity-40",
    initialRotate: 45,
    delay: 0,
    type: "circle",
  },
  {
    color: "#34A853",
    className: "w-16 h-16 top-1/2 left-14 opacity-35",
    initialRotate: 60,
    delay: 2,
    type: "circle",
  },
  {
    color: "#4285F4",
    className: "w-18 h-18 bottom-1/3 left-12 opacity-35",
    initialRotate: 30,
    delay: 5,
    type: "circle",
  },
  {
    className: "w-20 h-20 top-2/5 left-6 opacity-40",
    initialRotate: -20,
    delay: 6,
    children: "/Org/GDG.png",
  },
  {
    className: "w-24 h-24 bottom-6 left-16 opacity-35",
    initialRotate: -10,
    delay: 13,
    children: "/Programming_Languages/Typescript.svg",
  },
  {
    color: "#4285F4",
    className: "w-22 h-22 top-1/3 right-12 opacity-40",
    initialRotate: -30,
    delay: 1,
    type: "square",
  },
  {
    color: "#FBBC05",
    className: "w-18 h-18 top-1/2 right-10 opacity-35",
    initialRotate: -60,
    delay: 3,
    type: "square",
  },
  {
    className: "w-20 h-20 top-2/5 right-14 opacity-35",
    initialRotate: 15,
    delay: 9,
    children: "/Org/GDG.png",
  },
  {
    className: "w-28 h-28 top-45 right-6 opacity-35",
    initialRotate: 10,
    delay: 14,
    children: "/Frameworks/React.svg",
  },
  {
    className: "w-28 h-28 bottom-6 right-12 opacity-35",
    initialRotate: -5,
    delay: 16,
    children: "/Programming_Languages/Javascript.svg",
  },
  {
    color: "#EA4335",
    className: "w-20 h-20 bottom-10 right-36 opacity-30",
    initialRotate: -25,
    delay: 11,
    type: "triangle",
  },
  {
    color: "#4285F4",
    className: "w-16 h-16 bottom-12 left-36 opacity-30",
    initialRotate: 25,
    delay: 12,
    type: "triangle",
  },
  {
    color: "#FBBC05",
    className: "w-20 h-20 top-3/5 right-20 opacity-30",
    initialRotate: -25,
    delay: 17,
    type: "triangle",
  },
  {
    color: "#34A853",
    className: "w-22 h-22 top-3/5 left-20 opacity-30",
    initialRotate: 80,
    delay: 7,
    type: "square",
  },
];

export function FloatingShapes() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {SHAPES.map((shape, i) => (
        <BouncyShape
          key={i}
          color={shape.color}
          className={shape.className}
          initialRotate={shape.initialRotate}
          delay={shape.delay}
          type={shape.type as "circle" | "square" | "triangle" | undefined}
        >
          {shape.children}
        </BouncyShape>
      ))}
    </div>
  );
}
