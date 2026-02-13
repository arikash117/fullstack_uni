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
        <div
            className={clsx(styles.container, { [styles.animated]: isNew })}
            onMouseEnter={() => setShowDelete(true)}
            onMouseLeave={() => setShowDelete(false)}
        >
            <div className={styles.content}>
                <p>{name}</p>
                <p>{date}</p>
            </div>

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