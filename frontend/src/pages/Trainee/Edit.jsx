import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import styles from './Edit.module.css';
import editPhoto from '../../assets/edit-photo.svg';
import pfp from '../../assets/pfp.jpg'

export default function Edit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trainee, setTrainee] = useState(null); // ← добавь это
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        goal: '',
        subscriptionEnd: '',
        nextTraining: '',
        photo: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTrainee = async () => {
            try {
                const response = await api.get(`/trainees/${id}`);
                const t = response.data;
                setTrainee(t);
                setFormData({
                    name: t.name,
                    phone: t.phone,
                    goal: t.goal,
                    subscriptionEnd: new Date(t.subscription_end).toISOString().split('T')[0],
                    nextTraining: new Date(t.next_training).toISOString().slice(0, 16),
                    photo: null,
                });
            } catch (err) {
        let message = 'Ошибка при обновлении тренирующегося';
        
        if (err.response?.data) {
            const data = err.response.data;
            
            // Если detail — строка
            if (typeof data.detail === 'string') {
                message = data.detail;
            }
            // Если detail — массив (как при валидации FastAPI)
            else if (Array.isArray(data.detail)) {
                message = data.detail.map(e => e.msg).join('; ');
            }
            // Если весь ответ — строка
            else if (typeof data === 'string') {
                message = data;
            }
            // Иначе — сериализуем
            else {
                message = JSON.stringify(data, null, 2);
            }
        }

        alert(message);
        console.error('Update trainee error:', err);
    } finally {
                setLoading(false);
            }
        };

        fetchTrainee();
    }, [id]);

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>{error}</div>;

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
            // Подготавливаем данные для обновления
            const traineeData = {
                name: formData.name,
                phone: formData.phone,
                goal: formData.goal,
                subscription_end: formData.subscriptionEnd,
                next_training: formData.nextTraining,
            };

            // Отправляем PUT запрос
            await api.patch(`/trainees/${id}`, traineeData);

            // Обновляем фото, если выбран новый файл
            if (formData.photo) {
                const formDataForPhoto = new FormData();
                formDataForPhoto.append('file', formData.photo);

                for (let [key, value] of formDataForPhoto.entries()) {
                    console.log('FormData entry:', key, value);
                }

                await api.post(`/trainees/${id}/photo`, formDataForPhoto, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            navigate(`/trainee/${id}`);
        } catch (err) {
            const detail = err.response?.data?.detail || 'Ошибка при обновлении тренирующегося';
            alert(detail);
            console.error('Update trainee error:', err);
        }
    };

    return (
        <main className={styles.main}>
            <h1>Изменить тренирующегося</h1>
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

                <div className={styles.pfp}>
                    <label htmlFor="photoInput" className={styles.avatarLabel}>
                        {formData.photo ? (
                        <img
                            src={URL.createObjectURL(formData.photo)}
                            alt="preview"
                            className={styles.avatarImg}
                        />
                        ) : trainee?.photo_url ? (
                        <img
                            src={trainee.photo_url}
                            alt="current photo"
                            className={styles.avatarImg}
                            onError={(e) => {
                            e.target.src = pfp;
                            }}
                        />
                        ) : (
                        <img
                            src={pfp}
                            alt="no photo"
                            className={styles.avatarImg}
                        />
                        )}

                        {/* Иконка редактирования */}
                        <img src={editPhoto} alt="edit-photo" className={styles.photoIcon} />
                    </label>

                    {/* Скрытый инпут */}
                    <input
                        id="photoInput"
                        type="file"
                        name="photo"
                        accept="image/*"
                        onChange={handleChange}
                        style={{ display: 'none' }}
                    />
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
                        Сохранить изменения
                    </button>
                </div>
            </form>
        </main>
    );
}