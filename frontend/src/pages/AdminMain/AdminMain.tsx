import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import api from '../../api/client';
import styles from './AdminMain.module.css';
import { useNotification } from '../../components/Notification/NotificationProvider'
import UserCard from '../../components/UserCard/UserCard';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import UserModal from '../../components/UserModal/UserModal';
import { User, UserSummary } from '../../types/user';

function AdminMain() {
  const { show } = useNotification();
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; type: 'user' } | null>(null);
  useEffect(() => {
    console.log('Текущий baseURL api:', api.defaults.baseURL);
    api.get('/admin/users').catch(e => console.error('Test request error:', e));
  }, []);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get<UserSummary[]>('/admin/users', {
        params: { limit: 100 }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setLoading(false);
    }
  };

  const openUserModal = async (id: number) => {
    try {
      const response = await api.get<User>(`/admin/users/${id}`);
      setSelectedUser(response.data);
    } catch (err) {
      show({
        type: 'error',
        message: 'Ошибка загрузки данных пользователя'
      });
      console.error(err);
    }
  };

  const closeUserModal = () => {
    setSelectedUser(null);
  };

  const handleRemoveUser = (id: number) => {
    setConfirmDelete({ id, type: 'user' });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    try {
      await api.delete(`/admin/users/${confirmDelete.id}`);
      setUsers(prev => prev.filter(user => user.id !== confirmDelete.id));
      show({
        type: 'success',
        message: 'Пользователь удалён',
      });
    } catch (err) {
      let detail = 'Не удалось удалить пользователя';
      if (isAxiosError(err)) {
        detail = err.response?.data?.detail || detail;
      }
      show({
        type: 'error',
        title: 'Ошибка',
        message: detail,
      });
      console.error(err);
    }
  };

  return (
    <div className={styles.main}>
      <h1>Управление пользователями</h1>

      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <div className={styles.usersList}>
          {users.map((user) => (
            <div
              key={user.id}
              className={styles.userCardWrapper}
              onClick={() => openUserModal(user.id)}
            >
              <UserCard
                id={user.id}
                username={user.username}
                role={user.role}
                onRemove={handleRemoveUser}
              />
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={closeUserModal}
          onUpdateRole={() => {
            fetchUsers();
            show({
              type: 'success',
              message: 'Роль пользователя успешно обновлена',
            });
          }}
        />
      )}
      
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Удаление пользователя"
        message="Вы уверены, что хотите удалить этого пользователя?"
        confirmText="Удалить"
      />
    </div>
  );
}

export default AdminMain;