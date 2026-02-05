import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import styles from './Schedule.module.css'
import AddWorkoutModal from '../../components/AddWorkoutModal/AddWorkoutModal';
import WorkoutCard from '../../components/WorkoutCard/WorkoutCard';

export default function Schedule() {
    const { id } = useParams();
    const [viewMode, setViewMode] = useState('day');
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchWorkouts = async () => {
        try {
            const response = await api.get('/workouts', {
                params: {
                    trainee_id: id,
                },
            });
            const sortedWorkouts = [...response.data].sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    return dateA - dateB;
                });
                
                setWorkouts(sortedWorkouts);
        } catch (err) {
            setError('Ошибка загрузки тренировок');
            console.error('Fetch workouts error:', err);
        } finally {
            setLoading(false);
        }
        };

        fetchWorkouts();
    }, [id]);

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>{error}</div>;

    const formatDate = (isoString) => {
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return '—';
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
        } catch {
            return '—';
        }
    };

    const formatTime = (isoString) => {
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return '—';
            return date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '—';
        }
    };

    const handleAddWorkout = async (newWorkoutData) => {
        try {
            const isoString = `${newWorkoutData.date}T${newWorkoutData.time}:00`;

            const apiData = {
                date: isoString,
                name: newWorkoutData.name,
                type: newWorkoutData.type,
            };

            const response = await api.post(`/workouts/trainee/${id}`, apiData);
            setWorkouts(prev => [...prev, response.data]);
            
            window.dispatchEvent(new Event('traineesUpdated'));
            
            setIsModalOpen(false);
        } catch (err) {
            const detail = err.response?.data?.detail || 'Ошибка при создании тренировки';
            alert(detail);
            console.error('Create workout error:', err);
        }
    };

    const handleRemoveWorkout = async (workoutId) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту тренировку?')) {
            return;
        }

        try {
            await api.delete(`/workouts/${workoutId}`);
            setWorkouts(prev => prev.filter(w => w.id !== workoutId));
        } catch (err) {
            alert('Ошибка при удалении тренировки');
            console.error('Delete workout error:', err);
        }
    };

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <h1>Расписание тренировок</h1>
                
                <div className={styles.switcher}>
                    <button
                        className={`${styles.switchBtn} ${viewMode === 'day' ? styles.active : ''}`}
                        onClick={() => setViewMode('day')}
                    >
                        Ближайщие
                    </button>
                    <button
                        className={`${styles.switchBtn} ${viewMode === 'month' ? styles.active : ''}`}
                        onClick={() => setViewMode('month')}
                    >
                        Месяц
                    </button>
                </div>
            </div>

            {viewMode === 'day' && (
                <div className={styles.dayList}>
                    {workouts.map((workout) => (
                        <WorkoutCard
                            key={workout.id}
                            id={workout.id}
                            date={formatDate(workout.date)}
                            time={formatTime(workout.date)}
                            name={workout.name}
                            type={workout.type}
                            isNew={false}
                            onRemove={handleRemoveWorkout}
                        />
                    ))}
                    <button className={styles.addWorkoutCard} onClick={openModal}>
                        + Добавить тренировку
                    </button>
                </div>
            )}

            {viewMode === 'month' && (
                <div className={styles.monthPlaceholder}>
                    <p>Здесь будет календарь с тренировками за месяц.</p>
                    <p>Пока заглушка — функционал добавим позже.</p>
                </div>
            )}

            <AddWorkoutModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onAdd={handleAddWorkout}
            />
        </main>
    )
}