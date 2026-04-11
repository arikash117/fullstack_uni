import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { TraineeFormData } from '../../types/trainee';
import styles from './AddTrainee.module.css';


export default function AddTrainee() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState<TraineeFormData>({
        name: '',
        phone: '',
        goal: 'Набрать мышечную массу',
        subscriptionEnd: '2027-01-01',
        photo: null,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target;
        const { name, value } = target;

        if (name === 'photo' && target instanceof HTMLInputElement) {
            const file = target.files?.[0] ?? null;
            setFormData(prev => ({ ...prev, photo: file }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.SubmitEvent) => {
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
            };

            const response = await api.post<{ id: number }>('/trainees', traineeData);
            const newTraineeId = response.data.id;

            if (formData.photo) {
                const photoFormData = new FormData();
                photoFormData.append('file', formData.photo);

            await api.post(`/trainees/${newTraineeId}/photo`, photoFormData);
            }

            navigate(`/trainee/${newTraineeId}`);
        } catch (err) {
            let detail: string;

            if (typeof err === 'object' && err !== null && 'response' in err) {
                const e = err as { response?: { data?: { detail?: string } } };
                detail = e.response?.data?.detail || 'Ошибка при создании тренирующегося';
            } else if (err instanceof Error) {
                detail = err.message;
            } else {
                detail = 'Неизвестная ошибка';
            }

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
                        onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
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
                    <select name="goal" value={formData.goal} onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}>
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