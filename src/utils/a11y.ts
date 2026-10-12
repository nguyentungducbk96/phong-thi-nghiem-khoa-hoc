import React from 'react';

// Gắn cho thẻ div/g có thể bấm: dùng được bằng bàn phím (Enter/Space) và trình đọc màn hình.
export const clickable = (onActivate: () => void, label?: string) => ({
  role: 'button' as const,
  tabIndex: 0,
  'aria-label': label,
  onClick: onActivate,
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  }
});
