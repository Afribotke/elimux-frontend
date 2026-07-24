"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Award } from "lucide-react";

interface PointsToastProps {
  show: boolean;
  points: number;
  reason: string;
  badgeEarned?: string;
  onClose: () => void;
}

export default function PointsToast({ show, points, reason, badgeEarned, onClose }: PointsToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-20 right-4 z-50"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-2xl p-4 min-w-[300px]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 fill-yellow-300 text-yellow-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">+{points}</p>
                <p className="text-sm text-emerald-100">{reason}</p>
              </div>
            </div>
            {badgeEarned && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2"
              >
                <Award className="w-5 h-5 text-amber-300" />
                <span className="text-sm font-medium">Badge Unlocked: {badgeEarned}</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
