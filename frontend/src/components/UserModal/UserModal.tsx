import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UserModal.module.css';
import api from '../../api/client';
import { User } from '../../types/user';
import { useNotification } from '../Notification/NotificationProvider';

interface UserModalProps {
  user: User;
  onClose: () => void;
  onUpdateRole: () => void;
}

export default function UserModal({ user, onClose, onUpdateRole }: UserModalProps) {
  const { show } = useNotification();
  const navigate = useNavigate();
  const [role, setRole] = useState<User['role']>(user.role);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as User['role']);
  };

  const handleSaveRole = async () => {
    if (role === user.role) {
      show({
        type: 'info',
        message: 'Роль не изменилась',
      });
      onClose();
      return;
    }

    setIsUpdating(true);
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role });
      onUpdateRole();
      onClose();
    } catch (err: any) {
      show({
        type: 'error',
        title: 'Ошибка',
        message: err.response?.data?.detail || 'Не удалось обновить роль',
      });
      console.error(err);
      setIsUpdating(false);
    }
  };

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewTrainees = () => {
    navigate(`/dashboard?userId=${user.id}`, { state: { backUrl: '/admin' }});
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Информация о пользователе</h2>

        <div className={styles.field}>
          <span>Имя:</span>
          <span className={styles.info}>{user.username}</span>
        </div>

        <div className={styles.field}>
          <span>Email:</span>
          <span className={styles.info}>{user.email}</span>
        </div>

        <div className={styles.field}>
          <span>Роль:</span>
          <select value={role} onChange={handleRoleChange} disabled={isUpdating}>
            <option value="admin">Админ</option>
            <option value="user">Пользователь</option>
          </select>
        </div>

        <div className={styles.field}>
          <span>Дата регистрации:</span>
          <span className={styles.info}>{formatDate(user.created_at)}</span>
        </div>

        <div className={`${styles.field} ${styles.clickable}`} onClick={handleViewTrainees}>
          <span>Кол-во трейни:</span>
          <span className={styles.info}>{user.trainee_count}</span>
        </div>

        <div className={styles.buttonGroup}>
          <button onClick={onClose} disabled={isUpdating} className={styles.close}>
            Закрыть
          </button>
          <button onClick={handleSaveRole} disabled={isUpdating} className={styles.submit}>
            {isUpdating ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}