import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pullDistance = useRef(0);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current === 0 || refreshing) return;
    const currentY = e.touches[0].clientY;
    pullDistance.current = currentY - startY.current;
    if (pullDistance.current > 0 && window.scrollY === 0) {
      setPulling(true);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance.current > 80 && !refreshing) {
      setRefreshing(true);
      await onRefresh?.();
      setRefreshing(false);
    }
    setPulling(false);
    startY.current = 0;
    pullDistance.current = 0;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence>
        {(pulling || refreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 text-emerald-500 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="text-xs text-gray-600">
              {refreshing ? "Actualizando..." : "Suelta para actualizar"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}
