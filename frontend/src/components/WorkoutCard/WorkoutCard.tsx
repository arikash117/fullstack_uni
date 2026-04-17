import { useState } from 'react';
import styles from './WorkoutCard.module.css';
import clsx from 'clsx';

interface WorkoutCardProps {
  id: number;
  date: string;
  time: string;
  isoDate?: string;
  name: string;
  type: string;
  isNew?: boolean;
  onRemove?: (id: number) => void;
}

export default function WorkoutCard({
    id,
    date,
    time,
    isoDate,
    name,
    type,
    isNew = false,
    onRemove,
}: WorkoutCardProps) {
    const [showDelete, setShowDelete] = useState(false);

    return (
        <article
            className={clsx(styles.container, { [styles.animated]: isNew })}
            onMouseEnter={() => setShowDelete(true)}
            onMouseLeave={() => setShowDelete(false)}
            aria-label={`Тренировка: ${name}, ${type}, ${date} в ${time}`}
        >
            <p className={styles.date}>
              <time dateTime={isoDate || date}>{date}</time>
            </p>
            <p className={styles.time}>
              <time dateTime={isoDate || time}>{time}</time>
            </p>
            <p className={styles.name}>{name}</p>
            <p className={styles.type}>{type}</p>

            {onRemove && (
                <button
                    type="button"
                    className={clsx(styles.deleteBtn, { [styles.visible]: showDelete })}
                    aria-label={`Удалить тренировку "${name}"`}
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