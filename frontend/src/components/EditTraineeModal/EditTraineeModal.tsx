import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Trainee, TraineeFormData } from '../../types/trainee';
import styles from './EditTraineeModal.module.css';
import editPhoto from '../../assets/edit-photo.svg';
import pfp from '../../assets/pfp.jpg'

interface TraineeEditModalProps {
  trainee: Trainee;
  onClose: () => void;
  onSaved: () => void;
}

export default function TraineeEditModal({ trainee, onClose, onSaved }: TraineeEditModalProps) {
    const [formData, setFormData] = useState<TraineeFormData>({
        name: trainee.name,
        phone: trainee.phone,
        goal: trainee.goal,
        subscriptionEnd: new Date(trainee.subscription_end).toISOString().split('T')[0],
        photo: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    const fetchPhotoUrl = async () => {
        if (!trainee?.photo_path) {
            setPhotoUrl(null);
            return;
        }
        
        try {
            const response = await api.get<{ photo_url: string }>(`/trainees/${trainee.id}/photo-url`);
            setPhotoUrl(response.data.photo_url);
        } catch (err) {
            console.error('Error fetching photo URL:', err);
            setPhotoUrl(null);
        }
    };

    useEffect(() => {
        if (trainee?.photo_path) {
            fetchPhotoUrl();
        } else {
            setPhotoUrl(null);
        }
    }, [trainee?.photo_path]);

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

        setLoading(true);
        try {
            const traineeData = {
                name: formData.name,
                phone: formData.phone,
                goal: formData.goal,
                subscription_end: formData.subscriptionEnd,
            };

            await api.patch(`/trainees/${trainee.id}`, traineeData);

            if (formData.photo) {
                const photoFormData = new FormData();
                photoFormData.append('file', formData.photo);
                await api.post(`/trainees/${trainee.id}/photo`, photoFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            onSaved();
            onClose();
        } catch (err) {
            let detail = 'Ошибка при обновлении тренирующегося';
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const e = err as { response?: { data?: { detail?: string } } };
                detail = e.response?.data?.detail || detail;
            }
            setError(detail);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

                <h2>Изменить тренирующегося</h2>

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
                                ) : photoUrl ? (
                                <img
                                    src={photoUrl}
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

                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.buttonGroup}>
                        <button type="button" onClick={onClose} disabled={loading}>
                            Отмена
                        </button>
                        <button type="submit">
                            Сохранить изменения
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}