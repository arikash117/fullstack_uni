import styles from './TraineeCard.module.css';

function TraineeCard() {
    return (
        <div className={styles.trainees}>
            <div className={styles.container}>
                <p>Name</p>
                <p>01.01.26</p>
            </div>
        </div>
    )
}

export default TraineeCard;