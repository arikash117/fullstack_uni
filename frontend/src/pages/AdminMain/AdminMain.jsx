import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
// import './AdminMain.css';

function AdminMain() {
  useEffect(() => {
    console.log('[AdminMain] Монтирование');
    return () => console.log('[AdminMain] Размонтирование');
  }, []);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users', {
        params: { limit: 100 } // или сколько нужно
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-main">
      <h1>Админка - Управление пользователями</h1>

      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <div className="users-list">
          {users.map((user) => (
            <div key={user.id} className="user-card">
              <h3>{user.username}</h3>
              <p>Email: {user.email}</p>
              <p>Роль: <span className={`role-badge ${user.role}`}>{user.role}</span></p>
              <Link to={`/admin/users/${user.id}`} className="btn btn-primary">
                Подробнее
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminMain;