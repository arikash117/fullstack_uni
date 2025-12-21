import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Header.module.css';

function Header() {
    const location = useLocation();
    const navigate = useNavigate();

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    const isHomePage = location.pathname === '/';
    const isTraineeChildPage = pathSegments.length === 3 && pathSegments[0] === 'trainee';

    const handleRegisterClick = () => {
        navigate('/register');
    };

    const handleLoginClick = () => {
        navigate('/login');
    };

    const handleLogoutClick = () => {
        navigate('/');
    };

    if (isTraineeChildPage) {
        const traineeId = pathSegments[1];
        const goBackToTrainee = () => {
            navigate(`/trainee/${traineeId}`);
        };

        return (
            <div className={styles.header}>
                <button className={styles.cover} onClick={goBackToTrainee}>
                    Назад
                </button>
                <Link to="/" className={styles.centeredLogo}>
                    <img className={styles.logo} src="/label.svg" alt="Main logo" />
                    <span className={styles.text}>Train!</span>
                </Link>
                <button className={styles.cover} onClick={handleLogoutClick}>
                    Выйти
                </button>
            </div>
        );
    }

    if (isAuthPage) {
        return (
            <div className={styles.header}>
                <Link to="/" className={styles.centeredLogo}>
                <img className={styles.logo} src="/label.svg" alt="Main logo" />
                <span className={styles.text}>Train!</span>
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.header}>
            <a className={styles.link} href="/">
                <img className={styles.logo} src="/label.svg" alt="Main logo" />
                <span className={styles.text}>Train!</span>
            </a>
            {isHomePage &&(
                <div className={styles.container}>
                <button className={styles.cover} onClick={handleLoginClick}>
                    Войти
                </button>
                <button className={styles.cover} onClick={handleRegisterClick}>
                    Зарегестрироваться
                </button>
            </div>
            )}
            {!isHomePage && !isAuthPage && (
                <div className={styles.container}>
                    <button className={styles.cover} onClick={handleLogoutClick}>
                        Выйти
                    </button>
                </div>
            )}
        </div>
    )
}

export default Header;
