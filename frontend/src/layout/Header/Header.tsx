import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Header.module.css';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, logout, user} = useAuth();

  const pathname = location.pathname;
  const backUrl = location.state?.backUrl as string | undefined;

  const isAddPage = pathname === '/trainee/add';
  const isTraineeSubPage = pathname.match(/\/trainee\/\d+\/(health|schedule|progress)/);
  const isTraineePage = pathname.match(/\/trainee\/\d+$/) !== null;
  const isDashboardPage = pathname === '/dashboard';

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

  const handleDashboardBack = () => {
    if (backUrl) {
      navigate(backUrl, { replace: true });
    } else if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleTraineeBack = () => {
      const stateBackUrl = location.state?.backUrl as string | undefined;
    
      if (stateBackUrl && stateBackUrl !== pathname && stateBackUrl.includes('/dashboard')) {
          navigate(stateBackUrl, { replace: true });
      } else {
          navigate('/dashboard', { replace: true });
      }
  };

  const handleSubPageBack = () => {
    const traineeId = pathname.split('/')[2];
    navigate(`/trainee/${traineeId}`, {
      state: { backUrl }
    });
  };

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isHomePage = pathname === '/';

  if (isDashboardPage) {
    return (
      <header className={styles.header}>
        <button className={styles.cover} onClick={handleDashboardBack}>
          Назад
        </button>
        <a className={styles.centeredLogo} href="/">
          <img className={styles.logo} src="/label.svg" alt="Main logo" />
          <span className={styles.text}>Train!</span>
        </a>
        <button className={styles.cover} onClick={handleLogoutClick}>
          Выйти
        </button>
      </header>
    );
  }

  if (isAddPage) {
    return (
      <header className={styles.header}>
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
      </header>
    );
  }

  if (isTraineeSubPage) {
    return (
      <header className={styles.header}>
        <button className={styles.cover} onClick={handleSubPageBack}>
          Назад
        </button>
        <a className={styles.centeredLogo} href="/">
          <img className={styles.logo} src="/label.svg" alt="Main logo" />
          <span className={styles.text}>Train!</span>
        </a>
        <button className={styles.cover} onClick={handleLogoutClick}>
          Выйти
        </button>
      </header>
    );
  }

  if (isTraineePage) {
    return (
      <header className={styles.header}>
        <button className={styles.cover} onClick={handleTraineeBack}>
          Назад
        </button>
        <a className={styles.centeredLogo} href="/">
          <img className={styles.logo} src="/label.svg" alt="Main logo" />
          <span className={styles.text}>Train!</span>
        </a>
        <button className={styles.cover} onClick={handleLogoutClick}>
          Выйти
        </button>
      </header>
    );
  }

  if (isAuthPage) {
    return (
      <header className={styles.header}>
        <a className={styles.link} href="/">
          <img className={styles.logo} src="/label.svg" alt="Main logo" />
          <span className={styles.text}>Train!</span>
        </a>
      </header>
    );
  }

  return (
    <header className={styles.header}>
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
    </header>
  );
}

export default Header;
