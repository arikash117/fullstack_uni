import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './Trainee.module.css'
import api from '../../api/client';
import pfp from '../../assets/pfp.jpg'
import Progress from '../../assets/progress.svg'
import Schedule from '../../assets/schedule.svg'
import Health from '../../assets/health.svg'

import InfoCard from '../../components/InfoCard/InfoCard'

export default function Trainee() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trainee, setTrainee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTrainee = async () => {
            try {
                const response = await api.get(`/trainees/${id}`);
                setTrainee(response.data);
            } catch (err) {
                setError('Тренирующийся не найден');
                console.error('Fetch trainee error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTrainee();
    }, [id]);

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>{error}</div>;
    if (!trainee) return null;

    const formattedSubscriptionEnd = new Date(trainee.subscription_end)
        .toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });

    const formattedNextTraining = new Date(trainee.next_training)
        .toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

    const goToHealth = () => navigate(`/trainee/${id}/health`);
    const goToSchedule = () => navigate(`/trainee/${id}/schedule`);
    const goToProgress = () => navigate(`/trainee/${id}/progress`);

    return (
        <main className={styles.main}>
            <div className={styles.content}>
                <div className={styles.infoContainer}>
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

