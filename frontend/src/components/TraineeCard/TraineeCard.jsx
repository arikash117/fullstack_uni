import styles from './TraineeCard.module.css';
import clsx from 'clsx';

function TraineeCard({ name, date, isNew = false}) {
    return (
        <div className={styles.trainees}>
            <div className={clsx(styles.container, {[styles.animated]: isNew})}>
                <p>{name}</p>
                <p>{date}</p>
            </div>
        </div>
    )
}

export default TraineeCard;