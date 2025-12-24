import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import styles from './AddTrainee.module.css';


export default function AddTrainee() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        goal: 'Набрать мышечную массу',
        subscriptionEnd: '2027-01-01',
        nextTraining: new Date().toISOString().split('T')[0] + 'T18:00:00',
        photo: null, 
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'photo') {
            setFormData(prev => ({ ...prev, photo: files[0] || null }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.phone.trim()) {
            alert('Заполните имя и телефон!');
            return;
        }

        try {
            const traineeData = {
                name: formData.name,
                phone: formData.phone,
                goal: formData.goal,
                subscription_end: formData.subscriptionEnd,
                next_training: formData.nextTraining,
            };

            const response = await api.post('/trainees', traineeData);
            const newTraineeId = response.data.id;

            if (formData.photo) {
                const formDataForPhoto = new FormData();
                formDataForPhoto.append('file', formData.photo);

                await api.post(`/trainees/${newTraineeId}/photo`, formDataForPhoto, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            navigate(`/trainee/${newTraineeId}`);

        } catch (err) {
            const detail = err.response?.data?.detail || 'Ошибка при создании тренирующегося';
            alert(detail);
            console.error('Create trainee error:', err);
        }
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

                {/* Дата окончания подписки */}
                <div className={styles.formGroup}>
                    <label>Дата окончания подписки:</label>
                    <input
                        type="date"
                        name="subscriptionEnd"
                        value={formData.subscriptionEnd}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Время следующей тренировки */}
                <div className={styles.formGroup}>
                    <label>Время следующей тренировки:</label>
                    <input
                        type="datetime-local"
                        name="nextTraining"
                        value={formData.nextTraining}
                        onChange={handleChange}
                        required
                    />
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