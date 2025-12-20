import styles from './DashBoard.module.css';
import TraineeCard from '../../components/TraineeCard/TraineeCard';

function Home() {

    const trainees = Array.from({ length: 10 }, (_, i) => (
        <TraineeCard key={i} />
    ));

    return (
        <main className={styles.main}>
            <span>-----------------------Мои трейни-----------------------</span>
            <div className={styles.content}>
                <div className={styles.aside}>
                    <div className={styles.calendar}></div>
                    <button className={styles.button}>
                        Добавить трейни
                    </button>
                </div>
                <div className={styles.trainees}>
                    {trainees}
                </div>
            </div>
            
        </main>
    )
}

export default Home;