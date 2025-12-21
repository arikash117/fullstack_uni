import { useState } from 'react';
import styles from './Schedule.module.css'
import AddWorkoutModal from '../../components/AddWorkoutModal/AddWorkoutModal';
import WorkoutCard from '../../components/WorkoutCard/WorkoutCard';

export default function Schedule() {

    const [viewMode, setViewMode] = useState('day');
    const [workouts, setWorkouts] = useState([
        { id: 0, time: '09:00', name: 'Утренняя тренировка', type: 'Силовая' },
        { id: 1, time: '18:30', name: 'Вечерняя тренировка', type: 'Кардио' },
        { id: 2, time: '20:00', name: 'Растяжка', type: 'Гибкость' },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddWorkout = (newWorkoutData) => {
        const newId = Math.max(...workouts.map(w => w.id), -1) + 1;
        const newWorkout = {
            id: newId,
            ...newWorkoutData,
            isNew: true,
        };
        setWorkouts(prev => [...prev, newWorkout]);
    };

    const handleRemoveWorkout = (id) => {
        setWorkouts(prev => prev.filter(workout => workout.id !== id));
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
                        Сегодня
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
                            time={workout.time}
                            name={workout.name}
                            type={workout.type}
                            isNew={workout.isNew}
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