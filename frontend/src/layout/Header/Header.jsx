import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Header.module.css';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();

  // Проверяем, находимся ли мы на странице трейни или его подстраницах
  const isTraineePage = location.pathname.startsWith('/trainee/');

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isHomePage = location.pathname === '/';

  if (isTraineePage) {
    return (
      <div className={styles.header}>
        <button className={styles.cover} onClick={() => navigate(-1)}>
          Назад
        </button>
        <a className={styles.centeredLogo} href="/">
          <img className={styles.logo} src="/label.svg" alt="Main logo" />
          <span className={styles.text}>Train!</span>
        </a>
        <button className={styles.cover} onClick={handleLogoutClick}>
          Выйти
        </button>
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <div className={styles.header}>
        <a className={styles.link} href="/">
          <img className={styles.logo} src="/label.svg" alt="Main logo" />
          <span className={styles.text}>Train!</span>
        </a>
      </div>
    );
  }

  return (
    <div className={styles.header}>
      <a className={styles.link} href="/">
        <img className={styles.logo} src="/label.svg" alt="Main logo" />
        <span className={styles.text}>Train!</span>
      </a>
      {isHomePage && !isLoggedIn && (
        <div className={styles.container}>
          <button className={styles.cover} onClick={handleLoginClick}>
            Войти
          </button>
          <button className={styles.cover} onClick={handleRegisterClick}>
            Зарегестрироваться
          </button>
        </div>
      )}
      {!isHomePage && !isAuthPage && isLoggedIn && (
        <div className={styles.container}>
          <button className={styles.cover} onClick={handleLogoutClick}>
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}

export default Header;
