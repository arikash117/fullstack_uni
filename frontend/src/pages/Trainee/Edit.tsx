import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Trainee, TraineeFormData } from '../../types/trainee';
import styles from './Edit.module.css';
import editPhoto from '../../assets/edit-photo.svg';
import pfp from '../../assets/pfp.jpg'

export default function Edit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [trainee, setTrainee] = useState<Trainee | null>(null);
    const [formData, setFormData] = useState<TraineeFormData>({
        name: '',
        phone: '',
        goal: 'Набрать мышечную массу',
        subscriptionEnd: '2027-01-01',
        photo: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrainee = async () => {
            if (!id) {
                setError('ID не указан');
                setLoading(false);
                return;
            }

            try {
                const response = await api.get<Trainee>(`/trainees/${id}`);
                const t = response.data;
                setTrainee(t);
                setFormData({
                    name: t.name,
                    phone: t.phone,
                    goal: t.goal,
                    subscriptionEnd: new Date(t.subscription_end).toISOString().split('T')[0],
                    photo: null,
                });
            } catch (err) {
                let message = 'Ошибка при загрузке тренирующегося';
                if (typeof err === 'object' && err !== null && 'response' in err) {
                    const e = err as { response?: { data?: any } };
                    const data = e.response?.data;
                    if (typeof data?.detail === 'string') {
                        message = data.detail;
                    } else if (Array.isArray(data?.detail)) {
                        message = data.detail.map((e: any) => e.msg).join('; ');
                    } else if (typeof data === 'string') {
                        message = data;
                    } else {
                        message = 'Ошибка сервера';
                    }
                }
                setError(message);
                console.error('Fetch trainee error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTrainee();
    }, [id]);

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>{error}</div>;

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

    const handleSubmit = async (e: React.FormEvent) => {
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

            await api.patch(`/trainees/${id}`, traineeData);

            if (formData.photo) {
                const photoFormData = new FormData();
                photoFormData.append('file', formData.photo);

                await api.post(`/trainees/${id}/photo`, photoFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            navigate(`/trainee/${id}`);
        } catch (err) {
            let detail: string;
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const e = err as { response?: { data?: { detail?: string } } };
                detail = e.response?.data?.detail || 'Ошибка при обновлении тренирующегося';
            } else if (err instanceof Error) {
                detail = err.message;
            } else {
                detail = 'Неизвестная ошибка';
            }

            alert(detail);
            console.error('Update trainee error:', err);
        }
    };

    return (
        <main className={styles.main}>
            <h1>Изменить тренирующегося</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                <label>Изменить фото:</label>
                <div className={styles.wrap}>
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
                                    (e.target as HTMLImageElement).src = pfp;
                                }}
                            />
                            ) : (
                            <img
                                src={pfp}
                                alt="no photo"
                                className={styles.avatarImg}
                            />
                            )}
                            <img src={editPhoto} alt="edit-photo" className={styles.photoIcon} />
                        </label>
                        <input
                            id="photoInput"
                            type="file"
                            name="photo"
                            accept="image/*"
                            onChange={handleChange}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>
                
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

                <div className={styles.formGroup}>
                    <label>Цель:</label>
                    <select name="goal" value={formData.goal} onChange={handleChange}>
                        <option value="Набрать мышечную массу">Набрать мышечную массу</option>
                        <option value="Похудеть">Похудеть</option>
                        <option value="Поддержание формы">Поддержание формы</option>
                        <option value="Повышение выносливости">Повышение выносливости</option>
                    </select>
                </div>

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