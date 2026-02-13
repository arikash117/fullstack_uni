import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './Trainee.module.css'
import api from '../../api/client';
import type { Trainee } from '../../types/trainee';

import pfp from '../../assets/pfp.jpg'
import editIcon from '../../assets/edit-icon.svg'
import Progress from '../../assets/progress.svg'
import Schedule from '../../assets/schedule.svg'
import Health from '../../assets/health.svg'

import InfoCard from '../../components/InfoCard/InfoCard'

export default function Trainee() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [trainee, setTrainee] = useState<Trainee | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTrainee = async () => {
        if (!id) {
            setError('ID не указан');
            setLoading(false);
            return;
        }

        try {
            const response = await api.get<Trainee>(`/trainees/${id}`);
            setTrainee(response.data);
        } catch (err) {
            setError('Тренирующийся не найден');
            console.error('Fetch trainee error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainee();
        
        const handleTraineesUpdated = () => {
            fetchTrainee();
        };
        
        window.addEventListener('traineesUpdated', handleTraineesUpdated);
        
        return () => {
            window.removeEventListener('traineesUpdated', handleTraineesUpdated);
        };
    }, [id]);

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>{error}</div>;
    if (!trainee) return null;

    const formattedSubscriptionEnd = new Date(trainee.subscription_end)
        .toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });

    const formatDateTime = (isoString: string | undefined): string => {
        if (!isoString) {
            return 'Нет ближайших тренировок';
        }
        
        try {
            const date = new Date(isoString);

            if (isNaN(date.getTime()) || date.getFullYear() < 1971) {
                return 'Нет ближайших тренировок';
            }
            
            return date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'Нет ближайших тренировок';
        }
    };

    const formattedNextTraining = formatDateTime(trainee.next_training);

    const goToHealth = () => navigate(`/trainee/${id}/health`);
    const goToSchedule = () => navigate(`/trainee/${id}/schedule`);
    const goToProgress = () => navigate(`/trainee/${id}/progress`);

    return (
        <main className={styles.main}>
            <div className={styles.content}>
                <div className={styles.infoContainer}>
                    <div className={styles.left}>
                        <img
                            src={trainee.photo_url || pfp}
                            alt="Фото тренирующегося"
                            className={styles.photo}
                        />
                        <div className={styles.infoText}>
                            <p>{trainee.name}</p>
                            <p>т. {trainee.phone}</p>
                            <p>Цель: {trainee.goal}</p>
                        </div>
                    </div>
                    <Link to={`/trainee/${id}/edit`} className={styles.edit}>
                        <span>Изменить</span>
                        <img src={editIcon} alt="Редактировать профиль" />
                    </Link>
                </div>

                <div className={styles.textContainer}>
                    <span>Окончание абонемента: {formattedSubscriptionEnd}</span>
                    <span className={styles.tooltip} data-tooltip="Дата следующей тренировки">
                        {formattedNextTraining}
                    </span>
                </div>

                <div className={styles.cards}>
                    <InfoCard icon={Health} text="Трекинг здоровья" onClick={goToHealth} />
                    <InfoCard icon={Schedule} text="Расписание тренировок" onClick={goToSchedule} />
                    <InfoCard icon={Progress} text="Отследить прогресс" onClick={goToProgress} />
                </div>
            </div>
        </main>
    );
}
