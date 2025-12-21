import styles from './WorkoutCard.module.css';
import clsx from 'clsx';

function WorkoutCard({ time, name, type, isNew = false}) {
    return (
        <div className={clsx(styles.container, {[styles.animated]: isNew})}>
            <p>{time}</p>
            <p>{name}</p>
            <p>{type}</p>
        </div>
    )
}

export default WorkoutCard;