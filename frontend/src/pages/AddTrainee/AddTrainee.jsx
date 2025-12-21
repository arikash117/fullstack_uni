import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AddTrainee.module.css';


export default function AddTrainee() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        goal: 'Набрать мышечную массу',
        membershipStart: '2026-01-01',
        membershipEnd: '2027-01-01',
        photo: null, // ← пока просто храним файл
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'photo') {
            setFormData(prev => ({ ...prev, photo: files[0] || null }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.phone.trim()) {
            alert('Заполните имя и телефон!');
            return;
        }

        // Формируем данные для передачи
        const traineeData = {
            name: formData.name,
            phone: formData.phone,
            goal: formData.goal,
            membershipPeriod: `${formData.membershipStart} - ${formData.membershipEnd}`,
            nextTrainingDay: formData.membershipStart, // заглушка
            photo: formData.photo, // ← передаём файл (или null)
        };

        // Генерируем временный ID (для URL)
        const tempId = Date.now();

        // Передаём данные через state роутера
        navigate(`/trainee/${tempId}`, { state: traineeData });
    };

    return (
        <main className={styles.main}>
            <h1>Добавить трейни</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Имя */}
                <div className={styles.formGroup}>
                    <label>Имя:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Например: Иван Иванов"
                        required
                    />
                </div>

                {/* Телефон */}
                <div className={styles.formGroup}>
                    <label>Телефон:</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+7 (999) 123-45-67"
                        required
                    />
                </div>

                {/* Фото */}
                <div className={styles.formGroup}>
                    <label>Фото (опционально):</label>
                    <input
                        type="file"
                        name="photo"
                        accept="image/*"
                        onChange={handleChange}
                        id="photoInput"
                        className={styles.hiddenFileInput}
                    />
                    <label htmlFor="photoInput" className={styles.fileButton}>
                        Выбрать файл
                    </label>
                </div>

                {/* Цель */}
                <div className={styles.formGroup}>
                    <label>Цель:</label>
                    <select name="goal" value={formData.goal} onChange={handleChange}>
                        <option value="Набрать мышечную массу">Набрать мышечную массу</option>
                        <option value="Похудеть">Похудеть</option>
                        <option value="Поддержание формы">Поддержание формы</option>
                        <option value="Повышение выносливости">Повышение выносливости</option>
                    </select>
                </div>

                {/* Дата действия абонемента */}
                <div className={styles.formGroup}>
                    <label>Действие абонемента:</label>
                    <div className={styles.dateRange}>
                        <input
                            type="date"
                            name="membershipStart"
                            value={formData.membershipStart}
                            onChange={handleChange}
                            required
                        />
                        <span>—</span>
                        <input
                            type="date"
                            name="membershipEnd"
                            value={formData.membershipEnd}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Кнопки */}
                <div className={styles.buttonGroup}>
                    <button type="button" onClick={() => navigate(-1)}>
                        Отмена
                    </button>
                    <button type="submit">
                        Добавить трейни
                    </button>
                </div>
            </form>
        </main>
    );
}