import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';
import BottomNav from '../Navigation/BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  actions?: React.ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = "My Data",
  showBackButton = false,
  actions,
  hideHeader = false,
  hideFooter = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Root level paths that shouldn't show back button by default
  const isRootPath = location.pathname === '/' || location.pathname === '/login';
  const shouldShowBack = showBackButton || (!isRootPath && location.pathname !== '/banking');

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        {!hideHeader && (
          <header className={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {shouldShowBack && (
                <button 
                  className={styles.backButton} 
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                >
                  ←
                </button>
              )}
              <h1 className={styles.headerTitle}>
                <span className={styles.logoIcon}>📱</span>
                {title}
              </h1>
            </div>
            {actions && <div className={styles.headerActions}>{actions}</div>}
          </header>
        )}

        <main className={styles.content}>
          {children}
        </main>

        {!hideFooter && <BottomNav />}
      </div>
    </div>
  );
};

export default Layout;
