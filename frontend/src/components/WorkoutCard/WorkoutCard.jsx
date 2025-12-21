import { useState } from 'react';
import styles from './WorkoutCard.module.css';
import clsx from 'clsx';

export default function WorkoutCard({ id, time, name, type, isNew = false, onRemove }) {
    const [showDelete, setShowDelete] = useState(false);

    return (
        <div
            className={clsx(styles.container, { [styles.animated]: isNew })}
            onMouseEnter={() => setShowDelete(true)}
            onMouseLeave={() => setShowDelete(false)}
        >

            {onRemove && (
                <div
                    className={styles.deleteArea}
                    style={{ opacity: showDelete ? 1 : 0 }}
                >
                    <button
                        className={styles.deleteBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(id);
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            <p>{time}</p>
            <p>{name}</p>
            <p>{type}</p>
        </div>
    );
}