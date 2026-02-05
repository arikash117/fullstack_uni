import { useState } from 'react';
import styles from './WorkoutCard.module.css';
import clsx from 'clsx';

export default function WorkoutCard({ id, date, time, name, type, isNew = false, onRemove }) {
    const [showDelete, setShowDelete] = useState(false);

    return (
        <div
            className={clsx(styles.container, { [styles.animated]: isNew })}
            onMouseEnter={() => setShowDelete(true)}
            onMouseLeave={() => setShowDelete(false)}
        >
            <p>{date}</p>
            <p>{time}</p>
            <p>{name}</p>
            <p>{type}</p>

            {onRemove && (
                <div
                    className={styles.deleteArea}
                    style={{ opacity: showDelete ? 1 : 0 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(id);
                    }}
                />
            )}
        </div>
    );
}