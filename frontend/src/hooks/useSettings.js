import { useState, useEffect } from 'react';
import { getLogo } from '../api/settings';

export function useSettings() {
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLogo()
      .then(res => {
        if (res.data.logo_url) {
          setLogoUrl(res.data.logo_url);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { logoUrl, loading };
}