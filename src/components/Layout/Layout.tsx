import React from 'react';
import styles from './Layout.module.css';
import BottomNav from '../Navigation/BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  hideFooter = false
}) => {
  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <main className={styles.content}>
          {children}
        </main>

        {!hideFooter && <BottomNav />}
      </div>
    </div>
  );
};

export default Layout;
