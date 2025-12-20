import styles from './Home.module.css';
import Goal from "../../assets/goal.svg";
import Training from "../../assets/main-training.svg";
import Tracking from "../../assets/tracking.svg";

function Home() {
    return (
        <main className={styles.main}>
            <h1 className={styles.heading}>Попробуйте этот веб-сервис для отслеживания прогресса вашего трейни!</h1>   
                <div className={styles.contentWrapper}>

                    <div className={styles.features}>
                        <div className={styles.featureCard}>
                            <img src={Training} alt="goal-icon" className={styles.featureIcon}/>
                            <p>Ведите дневник ежедневных тренировок</p>
                        </div>
                        <div className={styles.featureCard}>
                            <img src={Tracking} alt="goal-icon" className={styles.featureIcon}/>
                            <p>Фиксируйте данные о здоровье: КБЖУ, травмы и другое</p>
                        </div>
                        <div className={styles.featureCard}>
                            <img src={Goal} alt="goal-icon" className={styles.featureIcon}/>
                            <p>Отслеживайте прогресс и изменение целей</p>
                        </div>
                    </div>
                    
                    <button className={styles.startButton}>Начать работу</button>

                </div>
        </main>
    )
}

export default Home;
