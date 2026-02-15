import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import styles from './AdminMain.module.css';
import UserCard from '../../components/UserCard/UserCard';
import UserModal from '../../components/UserModal/UserModal';
import { User, UserSummary } from '../../types/user';

function AdminMain() {
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
      // Запрашиваем полные данные при открытии модалки
      const response = await api.get<User>(`/admin/users/${id}`);
      setSelectedUser(response.data);
    } catch (err) {
      alert('Ошибка загрузки данных пользователя');
      console.error(err);
    }
  };

  const closeUserModal = () => {
    setSelectedUser(null);
  };

  const handleRemoveUser = async (id: number) => {
    if (!window.confirm('Удалить пользователя?')) return;

    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      alert('Ошибка при удалении');
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
          }}
        />
      )}
    </div>
  );
}

export default AdminMain;