import styles from './DashBoard.module.css';
import TraineeCard from '../../components/TraineeCard/TraineeCard';

function Home() {

    const trainees = Array.from({ length: 20 }, (_, i) => (
        <TraineeCard key={i} />
    ));

    return (
        <main className={styles.main}>
            <div className={styles.aside}>
                <div className={styles.calendar}>

                </div>
                <button className={styles.button}>
                    Добавить трейни
                </button>
            </div>
            <div className={styles.trainees}>
                {trainees}
            </div>
        </main>
    )
}

export default Home;