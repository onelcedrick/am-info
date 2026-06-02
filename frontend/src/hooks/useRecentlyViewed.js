// -*- coding: utf-8 -*-
const MAX_ITEMS = 8;

export function addRecentlyViewed(product) {
  const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
  const filtered = viewed.filter(p => p.id !== product.id);
  filtered.unshift({ id: product.id, name: product.name, price: product.price, image_url: product.image_url, category: product.category });
  if (filtered.length > MAX_ITEMS) filtered.pop();
  localStorage.setItem('recentlyViewed', JSON.stringify(filtered));
}

export function getRecentlyViewed() {
  return JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
}
