import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../../components/Notification/NotificationProvider';
import { isAxiosError } from 'axios';
import api from '../../api/client';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { Trainee } from '../../types/trainee';
import styles from './DashBoard.module.css';
import Schedule from '../../assets/schedule.svg'
import TraineeCard from '../../components/TraineeCard/TraineeCard';

function DashBoard() {
    const { show } = useNotification();
    const [confirmDelete, setConfirmDelete] = useState<{ id: number; type: 'trainee' } | null>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('userId');

    const [coachName, setCoachName] = useState<string | null>(null);
    const [coachLoading, setCoachLoading] = useState(false);

    const [trainees, setTrainees] = useState<Trainee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(4);

    useEffect(() => {
        if (!userId) {
            setCoachName(null);
            return;
        }

        const fetchCoachName = async () => {
            setCoachLoading(true);
            try {
                const response = await api.get(`/admin/users/${userId}`);
                setCoachName(response.data.username);
            } catch (err) {
                console.error('Failed to fetch coach name:', err);
                setCoachName(null);
            } finally {
                setCoachLoading(false);
            }
        };

        fetchCoachName();
    }, [userId]);

    const fetchTrainees = async () => {
        try {
            const params: Record<string, string> = {};
            if (userId) {
            params.coach_id = userId;
            }

            const response = await api.get<Trainee[]>('/trainees', { params });
            
            const sortedTrainees = [...response.data].sort((a, b) => {
                if (!a.next_training) return 1;
                if (!b.next_training) return -1;
                return new Date(a.next_training).getTime() - new Date(b.next_training).getTime();
            });

            setTrainees(sortedTrainees);
            setVisibleCount(4);
        } catch (err) {
            setError('Ошибка загрузки тренирующихся');
            console.error('Fetch trainees error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainees();

        const handleTraineesUpdated = () => fetchTrainees();

        window.addEventListener('traineesUpdated', handleTraineesUpdated);
        return () => window.removeEventListener('traineesUpdated', handleTraineesUpdated);
    }, [userId]); 

    const formatDateTime = (isoString: string | undefined): string => {
        if (!isoString) {
            return '--.--.--';
        }
        
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime()) || date.getFullYear() < 1970) {
                return '--.--.--';
            }
            
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
            });
        } catch {
            return '--.--.--';
        }
    };

    const handleAddTrainee = () => {
        navigate('/trainee/add');
    };

    const handleTraineeClick = (id: number) => {
        navigate(`/trainee/${id}`, { 
            state: { backUrl: location.pathname + location.search } 
        });
    };

    const handleRemoveTrainee = (id: number) => {
        setConfirmDelete({ id, type: 'trainee' });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDelete) return;

        try {
            await api.delete(`/trainees/${confirmDelete.id}`);

            setTrainees(prev => prev.filter(t => t.id !== confirmDelete.id));
            show({
                type: 'success',
                message: 'Тренирующийся удалён',
            });
        } catch (err) {
            let detail = 'Ошибка при удалении тренирующегося';
            if (isAxiosError(err)) {
                detail = err.response?.data?.detail || detail;
            }
            show({
                type: 'error',
                title: 'Ошибка',
                message: detail,
            });
            console.error('Delete error:', err);
        }
    };

    const visibleTrainees = trainees.slice(0, visibleCount);
    const getPageTitle = () => {
        if (!userId) {
            return 'Мои трейни | Дашборд';
        }
        if (coachLoading) {
            return 'Загрузка... | Дашборд';
        }
        if (coachName) {
            return `Список трейни пользователя: ${coachName}`;
        }
        return `Список трейни пользователя  id:${userId}`;
    };

    return (
        <>
            <Helmet>
                <title>{getPageTitle()}</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <main className={styles.main}>
                <span>-----------------------Мои трейни-----------------------</span>
                <div className={styles.content}>
                    <div className={styles.aside}>
                        <div className={styles.calendar}>
                            <img src={Schedule} alt="icon" className={styles.icon}/>
                        </div>
                        <button className={styles.button} onClick={handleAddTrainee}>
                            Добавить трейни
                        </button>
                    </div>
                    <div className={styles.trainees}>
                        {visibleTrainees.map((trainee) => (
                            <div
                                key={trainee.id}
                                className={styles.traineeCardWrapper}
                                onClick={() => handleTraineeClick(trainee.id)}
                            >
                                <TraineeCard
                                    id={trainee.id}
                                    name={trainee.name}
                                    date={formatDateTime(trainee.next_training)} 
                                    isNew={trainee.isNew}
                                    onRemove={handleRemoveTrainee}
                                />
                            </div>
                        ))}
                        {visibleCount < trainees.length && (
                            <button className={styles.button} onClick={() => setVisibleCount(prev => prev + 6)}>
                                Ещё
                            </button>
                        )}
                    </div>
                </div>
                <ConfirmModal
                    isOpen={!!confirmDelete}
                    onClose={() => setConfirmDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title="Удаление тренирующегося"
                    message="Вы уверены, что хотите удалить этого тренирующегося?"
                    confirmText="Удалить"
                />
            </main>
        </>

    )
}

export default DashBoard;