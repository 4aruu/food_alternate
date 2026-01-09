// src/utils/history.js

export const addToHistory = (foodItem) => {
  try {
    // Get existing history or empty array
    const existing = JSON.parse(localStorage.getItem('user_history') || '[]');

    // 1. Remove duplicates (if viewing same item again, remove old entry)
    const filtered = existing.filter(i => i.name !== foodItem.name);

    // 2. Add new item to the front with a timestamp
    const newItem = {
      ...foodItem,
      viewedAt: new Date().toISOString()
    };

    // 3. Keep only last 10 items
    const updated = [newItem, ...filtered].slice(0, 10);

    // 4. Save back to Local Storage
    localStorage.setItem('user_history', JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving history", e);
  }
};

export const getHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('user_history') || '[]');
  } catch (e) {
    return [];
  }
};

// Helper to calculate "Time Ago"
export const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  const diff = (new Date() - new Date(dateString)) / 1000; // seconds

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return 'Yesterday';
};