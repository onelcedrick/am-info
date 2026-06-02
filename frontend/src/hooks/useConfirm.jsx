// -*- coding: utf-8 -*-
import { useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';

export default function useConfirm() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState({ title: '', message: '' });
  const [resolveRef, setResolveRef] = useState(null);

  const confirm = (title, message) => {
    return new Promise((resolve) => {
      setConfig({ title, message });
      setOpen(true);
      setResolveRef(() => resolve);
    });
  };

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
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, Modal };
}
