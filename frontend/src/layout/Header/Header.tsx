import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Header.module.css';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();

  const pathname = location.pathname;

  const isEditPage = pathname.startsWith('/trainee/') && pathname.endsWith('/edit');
  const isAddPage = pathname === '/trainee/add';
  const isTraineeSubPage = pathname.match(/\/trainee\/\d+\/(health|schedule|progress)/);
  const isTraineePage = pathname.match(/\/trainee\/\d+$/) !== null;

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

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isHomePage = pathname === '/';

  if (isEditPage || isAddPage) {
    return (
      <div className={styles.header}>
        <button className={styles.cover} onClick={() => navigate('/dashboard')}>
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

  if (isTraineeSubPage) {
    const traineeId = pathname.split('/')[2];
    return (
      <div className={styles.header}>
        <button className={styles.cover} onClick={() => navigate(`/trainee/${traineeId}`)}>
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

  if (isTraineePage) {
    return (
      <div className={styles.header}>
        <button className={styles.cover} onClick={() => navigate('/dashboard')}>
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
