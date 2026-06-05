// -*- coding: utf-8 -*-
import { useState, useCallback } from 'react';
import ConfirmModal from '../components/ConfirmModal';

export default function useConfirm() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState({ title: '', message: '', variant: 'danger' });
  const [resolveRef, setResolveRef] = useState(null);

  const confirm = useCallback((title, message, variant = 'danger') => {
    return new Promise((resolve) => {
      setConfig({ title, message, variant });
      setOpen(true);
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    if (resolveRef) resolveRef(true);
  };

  const handleCancel = () => {
    setOpen(false);
    if (resolveRef) resolveRef(false);
  };

  const Modal = (
    <ConfirmModal
      open={open}
      title={config.title}
      message={config.message}
      variant={config.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, Modal };
}
