import { useState, useEffect } from 'react';
import styles from './AddWorkoutModal.module.css';

export default function AddWorkoutModal({ isOpen, onClose, onAdd }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        name: '',
        type: 'Силовая'
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            const date = now.toISOString().split('T')[0];
            
            // Автоматически вычисляем время +30 минут
            const nextTime = new Date(now.getTime() + 30 * 60 * 1000);
            const hours = String(nextTime.getHours()).padStart(2, '0');
            const mins = String(nextTime.getMinutes()).padStart(2, '0');
            const time = `${hours}:${mins}`;
            
            setFormData({
                date,
                time,
                name: '',
                type: 'Силовая'
            });
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        
        const selectedDate = new Date(formData.date);
        const today = new Date();
        
        if (selectedDate.toDateString() === today.toDateString()) {
            const nextTime = new Date(today.getTime() + 30 * 60 * 1000);
            const hours = String(nextTime.getHours()).padStart(2, '0');
            const mins = String(nextTime.getMinutes()).padStart(2, '0');
            setFormData(prev => ({ ...prev, time: `${hours}:${mins}` }));
        }
    }, [formData.date, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError('Введите название тренировки');
            return;
        }

        const dateTimeString = `${formData.date}T${formData.time}:00`;
        const selectedDateTime = new Date(dateTimeString);
        const now = new Date();
        now.setMilliseconds(0);
        selectedDateTime.setMilliseconds(0);

        if (selectedDateTime <= now) {
            setError('Тренировка должна быть в будущем!');
            return;
        }

        onAdd({
            date: formData.date,
            time: formData.time,
            name: formData.name.trim(),
            type: formData.type,
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
                            value={formData.date}
                            onChange={(e) => handleInputChange('date', e.target.value)}
                            required
                        />
                        {error && <div className={styles.error}>{error}</div>}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Время:</label>
                        <input
                            type="time"
                            value={formData.time}
                            onChange={(e) => handleInputChange('time', e.target.value)}
                            required
                        />
                        {error && <div className={styles.error}>{error}</div>}
                    </div>
                    

                    <div className={styles.formGroup}>
                        <label>Название:</label>
                        <input
                            type="text"
                            placeholder="Например: Утренняя тренировка"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Тип:</label>
                        <select value={formData.type} onChange={(e) => handleInputChange('type', e.target.value)}>
                            <option value="Силовая">Силовая</option>
                            <option value="Кардио">Кардио</option>
                            <option value="Гибкость">Гибкость</option>
                        </select>
                    </div>

                    <div className={styles.buttonGroup}>
                        <button 
                            type="button" 
                            className={styles.cancel} 
                            onClick={() => {
                                setError('');
                                onClose();
                            }}
                        >
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