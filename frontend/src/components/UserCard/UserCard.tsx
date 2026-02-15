import { useState } from 'react';
import styles from './UserCard.module.css';
import clsx from 'clsx';
import userIcon from '../../assets/user-icon.svg';
import adminIcon from '../../assets/admin-icon.svg';

interface UserCardProps {
  id: number;
  username: string;
  role: 'user' | 'admin';
  isNew?: boolean;
  onRemove?: (id: number) => void;
}

export default function UserCard({ id, username, role, isNew = false, onRemove }: UserCardProps) {
    const [showDelete, setShowDelete] = useState(false);

    const icon = role === 'admin' ? adminIcon : userIcon;

    return (
        <div
            className={clsx(styles.container, { [styles.animated]: isNew })}
            onMouseEnter={() => setShowDelete(true)}
            onMouseLeave={() => setShowDelete(false)}
        >
            <div className={styles.name}>
                <img src={icon} alt={role} className={styles.icon} />
                <p>{username}</p>
            </div>
            <p>{role === 'admin' ? 'Админ' : 'Пользователь'}</p>

            {onRemove && (
                <div
                    className={styles.deleteArea}
                    style={{ opacity: showDelete ? 1 : 0 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(id);
                    }}
                />
            )}
        </div>
    );
}