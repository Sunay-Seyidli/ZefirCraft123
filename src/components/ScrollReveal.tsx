import React from "react";
import { motion } from "motion/react";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
  duration?: number;
  once?: boolean;
}

export default function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
  duration = 0.65,
  once = true
}: ScrollRevealProps) {
  const getInitialOffset = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: 45, scale: 0.96 };
      case "down":
        return { opacity: 0, y: -45, scale: 0.96 };
      case "left":
        return { opacity: 0, x: 45, scale: 0.96 };
      case "right":
        return { opacity: 0, x: -45, scale: 0.96 };
      case "none":
        return { opacity: 0, scale: 0.92 };
      default:
        return { opacity: 0, y: 45, scale: 0.96 };
    }
  };

  return (
    <motion.div
      initial={getInitialOffset()}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once, margin: "-20px" }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

