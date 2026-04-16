import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Home.module.css';
import Goal from "../../assets/goal.svg";
import Training from "../../assets/main-training.svg";
import Tracking from "../../assets/tracking.svg";

function Home() {
    const navigate = useNavigate();
    const { user, loading, isLoggedIn } = useAuth();

    const handleStartClick = () => {
        if (loading) return;

        if (!isLoggedIn) {
            navigate('/register');
        } else if (user?.role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <>
            <Helmet>
                <title>Фитнес-трекер | Отслеживайте прогресс трени</title>
                <meta name="description" content="Веб-сервис для тренеров: ведите дневник тренировок, фиксируйте КБЖУ и отслеживайте прогресс ваших трейни" />
                <meta name="keywords" content="фитнес, тренировки, прогресс, КБЖУ, дневник тренировок, тренер, трейни" />

                {/* Canonical URL */}
                <link rel="canonical" href={window.location.origin + window.location.pathname} />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={window.location.origin + window.location.pathname} />
                <meta property="og:title" content="Фитнес-трекер | Отслеживайте прогресс трени" />
                <meta property="og:description" content="Веб-сервис для тренеров: ведите дневник тренировок, фиксируйте КБЖУ и отслеживайте прогресс ваших трейни" />
                <meta property="og:image" content={`${window.location.origin}/og-image.png`} />
                <meta property="og:locale" content="ru_RU" />

            </Helmet>
            <main className={styles.main}>
                <h1 className={styles.heading}>Попробуйте этот веб-сервис для отслеживания прогресса вашего трейни!</h1>   
                    <div className={styles.contentWrapper}>

                        <div className={styles.features}>
                            <div className={styles.featureCard}>
                                <img src={Training} alt="Иконка: ведение дневника тренировок" className={styles.featureIcon}/>
                                <p>Ведите дневник ежедневных тренировок</p>
                            </div>
                            <div className={styles.featureCard}>
                                <img src={Tracking} alt="Иконка: отслеживание здоровья и КБЖУ" className={styles.featureIcon}/>
                                <p>Фиксируйте данные о здоровье: КБЖУ, травмы и другое</p>
                            </div>
                            <div className={styles.featureCard}>
                                <img src={Goal} alt="Иконка: достижение целей и прогресс" className={styles.featureIcon}/>
                                <p>Отслеживайте прогресс и изменение целей</p>
                            </div>
                        </div>
                        
                        <button className={styles.startButton} onClick={handleStartClick} disabled={loading}>
                            Начать работу
                        </button>

                    </div>
            </main>
        </>

    )
}

export default Home;
