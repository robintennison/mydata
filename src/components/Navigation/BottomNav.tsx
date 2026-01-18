import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './BottomNav.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/banking', label: 'Banking', icon: '🏦' },
  { path: '/jewellery', label: 'Jewellery', icon: '💎' },
  { path: '/properties', label: 'Properties', icon: '🏢' },
  { path: '/online', label: 'Online', icon: '🌐' },
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || 
                        (item.path !== '/' && location.pathname.startsWith(item.path));
        
        return (
          <div 
            key={item.path}
            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
};

export default BottomNav;
