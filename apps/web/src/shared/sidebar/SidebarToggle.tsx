'use client';
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarToggleProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({
  collapsed,
  setCollapsed,
}) => {
  return (
    <button
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      onClick={() => setCollapsed(!collapsed)}
      className="sidebar-toggle__button"
    >
      {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
    </button>
  );
};
