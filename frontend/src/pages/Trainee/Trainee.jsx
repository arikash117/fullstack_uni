import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './Trainee.module.css'
import pfp from '../../assets/pfp.jpg'
import Progress from '../../assets/progress.svg'
import Schedule from '../../assets/schedule.svg'
import Health from '../../assets/health.svg'

import InfoCard from '../../components/InfoCard/InfoCard'

export default function Trainee() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trainee, setTrainee] = useState(null);
    const location = useLocation();

    useEffect(() => {
        if (location.state) {
            // Данные пришли из формы
            setTrainee({
                id,
                ...location.state,
            });
        } else {
            // Заглушка (например, при прямом заходе)
            setTrainee({
                id,
                name: `Трейни ${id}`,
                phone: '+7 (999) 123-45-67',
                goal: 'Набрать мышечную массу',
                membershipPeriod: '01.01.2026 - 01.01.2027',
                nextTrainingDay: '05.01.2026',
                photo: null,
            });
        }
    }, [location.state, id]);

    const [photoUrl, setPhotoUrl] = useState(null);

    useEffect(() => {
        if (trainee?.photo instanceof File) {
            const url = URL.createObjectURL(trainee.photo);
            setPhotoUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPhotoUrl(null);
        }
    }, [trainee]);

    const goToHealth = () => navigate(`/trainee/${id}/health`);
    const goToSchedule = () => navigate(`/trainee/${id}/schedule`);
    const goToProgress = () => navigate(`/trainee/${id}/progress`);

    if (!trainee) return null;

    return (
        <main className={styles.main}>
            <div className={styles.content}>
                <div className={styles.infoContainer}>
                    <img
                        src={photoUrl || pfp}
                        alt="pfp"
                        className={styles.photo}
                    />
                    <div className={styles.infoText}>
                        <p>{trainee.name}</p>
                        <p>т. {trainee.phone}</p>
                        <p>Цель: {trainee.goal}</p>
                    </div>
                </div>
                <div className={styles.textContainer}>
                    <span>Действие абонемента: {trainee.membershipPeriod}</span>
                    <span className={styles.tooltip} data-tooltip="Дата следующей тренировки">
                        {trainee.nextTrainingDay}
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

