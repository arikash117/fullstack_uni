import { useState } from 'react';
import styles from './TraineeCard.module.css';
import clsx from 'clsx';

interface TraineeCardProps {
  id: number;
  name: string;
  date: string;
  isNew?: boolean;
  onRemove?: (id: number) => void;
}

export default function TraineeCard({ id, name, date, isNew = false, onRemove }: TraineeCardProps) {
    const [showDelete, setShowDelete] = useState(false);

    return (
        <article
            className={clsx(styles.container, { [styles.animated]: isNew })}
            onMouseEnter={() => setShowDelete(true)}
            onMouseLeave={() => setShowDelete(false)}
        >
            <div className={styles.content}>
                <p>{name}</p>
                <p>{date}</p>
            </div>

            {onRemove && (
                <button
                    type="button"
                    className={clsx(styles.deleteBtn, { [styles.visible]: showDelete })}
                    aria-label={`Удалить тренирующегося ${name}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(id);
                    }}
                >
                    <span aria-hidden="true">✕</span>
                </button>
            )}
        </article>
    );
}