import { useState } from 'react';
import styles from './AddWorkoutModal.module.css';

export default function AddWorkoutModal({ isOpen, onClose, onAdd }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('09:00');
    const [name, setName] = useState('');
    const [type, setType] = useState('Силовая');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Введите название тренировки');
            return;
        }

        onAdd({
            date,
            time,
            name: name.trim(),
            type,
        });

        setName('');
        setType('Силовая');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>Добавить тренировку</h2>
                <form onSubmit={handleSubmit}>
                    
                    <div className={styles.formGroup}>
                        <label>Дата:</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Время:</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Название:</label>
                        <input
                            type="text"
                            placeholder="Например: Утренняя тренировка"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Тип:</label>
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="Силовая">Силовая</option>
                            <option value="Кардио">Кардио</option>
                            <option value="Гибкость">Гибкость</option>
                        </select>
                    </div>

                    <div className={styles.buttonGroup}>
                        <button type="button" className={styles.cancel} onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className={styles.submit}>
                            Добавить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}