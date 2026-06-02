// -*- coding: utf-8 -*-
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconCheck } from './Icons';

export default function AddToCartButton({ onClick, className = '' }) {
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    setAdded(true);
    onClick?.();
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button onClick={handleClick} className={className}>
      <AnimatePresence mode="wait">
        {added ? (
          <motion.span
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center justify-center gap-1"
          >
            <IconCheck size={16} /> Ajoute !
          </motion.span>
        ) : (
          <motion.span
            key="cart"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            Ajouter
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
