import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, useLocation} from 'react-router-dom';
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
import TraineeEditModal from '../../components/EditTraineeModal/EditTraineeModal';

export default function Trainee() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const backUrl = location.state?.backUrl as string | undefined;
    const [trainee, setTrainee] = useState<Trainee | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

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

    const fetchPhotoUrl = async () => {
        if (!trainee?.photo_path) {
            setPhotoUrl(null);
            return;
        }
        
        try {
            const response = await api.get<{ photo_url: string }>(`/trainees/${id}/photo-url`);
            setPhotoUrl(response.data.photo_url);
        } catch (err) {
            console.error('Error fetching photo URL:', err);
            setPhotoUrl(null);
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

    useEffect(() => {
        if (trainee?.photo_path) {
            fetchPhotoUrl();
        } else {
            setPhotoUrl(null);
        }
    }, [trainee?.photo_path]);

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

    const goToHealth = () => navigate(`/trainee/${id}/health`, { 
        state: { backUrl: backUrl || `/trainee/${id}` } 
    });
    
    const goToSchedule = () => navigate(`/trainee/${id}/schedule`, { 
        state: { backUrl: backUrl || `/trainee/${id}` } 
    });
    
    const goToProgress = () => navigate(`/trainee/${id}/progress`, { 
        state: { backUrl: backUrl || `/trainee/${id}` } 
    });

    const getPageTitle = () => {
        if (loading) {
            return 'Загрузка... | Фитнес-трекер';
        }
        if (error || !trainee) {
            return 'Трейни не найден | Фитнес-трекер';
        }
        return `Информация о трейни: ${trainee.name}`;
    };

    return (
        <>
            <Helmet>
                <title>{getPageTitle()}</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            <main className={styles.main}>
                <div className={styles.content}>
                    <section className={styles.infoContainer}>
                        <div className={styles.left}>
                            <img
                                src={photoUrl || pfp}
                                alt={`Фото: ${trainee.name}`}
                                className={styles.photo}
                                onError={() => setPhotoUrl(null)}
                            />
                            <div className={styles.infoText}>
                                <h2 className={styles.name}>{trainee.name}</h2>
                                <p className={styles.phone}>т. {trainee.phone}</p>
                                <p className={styles.goal}>Цель: {trainee.goal}</p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            className={styles.edit}
                            onClick={() => setShowEditModal(true)}
                            aria-label={`Редактировать профиль ${trainee.name}`}
                        >
                            <span>Изменить</span>
                            <img src={editIcon} alt="" aria-hidden="true" />
                        </button>
                    </section>


                    <section className={styles.textContainer} aria-label="Даты и сроки">
                        <p className={styles.subscriptionEnd}>
                            Окончание абонемента: <time dateTime={trainee.subscription_end}>{formattedSubscriptionEnd}</time>
                        </p>
                        <p className={styles.nextTraining} title="Дата следующей тренировки">
                            <time dateTime={trainee.next_training || undefined}>
                                {formattedNextTraining}
                            </time>
                        </p>
                    </section>
                    <nav className={styles.cards} aria-label="Разделы профиля трейни">
                        <InfoCard 
                            icon={Health} 
                            text="Трекинг здоровья" 
                            onClick={goToHealth}
                            ariaLabel="Перейти к трекингу здоровья"
                        />
                        <InfoCard 
                            icon={Schedule} 
                            text="Расписание тренировок" 
                            onClick={goToSchedule}
                            ariaLabel="Перейти к расписанию тренировок"
                        />
                        <InfoCard 
                            icon={Progress} 
                            text="Отследить прогресс" 
                            onClick={goToProgress}
                            ariaLabel="Перейти к отслеживанию прогресса"
                        />
                    </nav>
                </div>

                {showEditModal && (
                    <TraineeEditModal
                    trainee={trainee}
                    onClose={() => setShowEditModal(false)}
                    onSaved={() => {
                        fetchTrainee();
                    }}
                    />
                )}

            </main>        
        </>
    );
}
