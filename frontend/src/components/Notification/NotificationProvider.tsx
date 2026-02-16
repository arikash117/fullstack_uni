import { createContext, useContext, useState } from 'react';
import styles from './Notification.module.css';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  show: (notification: Omit<Notification, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const show = ({ type, title, message, duration = 5000 }: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotif: Notification = { id, type, title, message, duration };

    setNotifications(prev => [...prev, newNotif]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  };

  return (
    <NotificationContext.Provider value={{ show }}>
      {children}
      <div className={styles.overlay}>
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`${styles.notification} ${styles[notif.type]}`}
            role="alert"
          >
            {notif.title && <strong>{notif.title}</strong>}
            {notif.title && ': '}
            {notif.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}