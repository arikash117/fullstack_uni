import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNotification } from '../../components/Notification/NotificationProvider';
import { isAxiosError } from 'axios';
import api from '../../api/client';
import styles from './Schedule.module.css'
import { Workout } from '../../types/workout';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import AddWorkoutModal from '../../components/AddWorkoutModal/AddWorkoutModal';
import WorkoutCard from '../../components/WorkoutCard/WorkoutCard';

interface NewWorkoutData {
  date: string;
  time: string;
  name: string;
  type: 'Силовая' | 'Кардио' | 'Гибкость';
}
type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
type WorkoutType = 'Силовая' | 'Кардио' | 'Гибкость';

export default function Schedule() {
    const { show } = useNotification();
    const [confirmDelete, setConfirmDelete] = useState<{ id: number; type: 'workout' } | null>(null);
    const { id } = useParams<{ id: string }>();
    const [viewMode, setViewMode] = useState<'day' | 'month' | 'archive'>('day');
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // стейт для поиска
    const [searchTerm, setSearchTerm] = useState('');

    // стейты для фильтров
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<WorkoutType[]>([]);

    useEffect(() => {
        const fetchWorkouts = async () => {
            if (!id) {
                setError('ID тренирующегося не указан');
                setLoading(false);
                return;
            }

            try {
                const params: any = { trainee_id: id };
                if (searchTerm) params.name = searchTerm;
                if (selectedTimeSlots.length > 0) params.time_slots = selectedTimeSlots.join(',');
                if (selectedTypes.length > 0) params.types = selectedTypes.join(',');

                const response = await api.get<Workout[]>('/workouts', { params });
                setWorkouts(sortWorkouts(response.data));
            } catch (err) {
                setError('Ошибка загрузки тренировок');
                console.error('Fetch workouts error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkouts();
    }, [id, searchTerm, selectedTimeSlots, selectedTypes]);

    const toggleTimeSlot = (slot: TimeSlot) => {
        setSelectedTimeSlots(prev => 
            prev.includes(slot) 
                ? prev.filter(s => s !== slot)
                : [...prev, slot]
        );
    };

    const toggleType = (type: WorkoutType) => {
        setSelectedTypes(prev => 
            prev.includes(type) 
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const clearFilters = () => {
        setSelectedTimeSlots([]);
        setSelectedTypes([]);
        setSearchTerm('');
    };

    // сортировка по ближайшей дате
    const sortWorkouts = (workouts: Workout[]): Workout[] => {
        return [...workouts].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA.getTime() - dateB.getTime();
        });
    };

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>{error}</div>;

    const now = new Date();

    const futureWorkouts: Workout[] = workouts.filter(
        (w) => new Date(w.date) > now
    );
    const pastWorkouts: Workout[] = workouts.filter(
        (w) => new Date(w.date) < now
    );

    const formatDate = (isoString: string): string => {
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return '—';
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
            });
        } catch {
        return '—';
        }
    };

    const formatTime = (isoString: string): string => {
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

    const handleAddWorkout = async (newWorkoutData: NewWorkoutData) => {
        try {
            const isoString = `${newWorkoutData.date}T${newWorkoutData.time}:00`;

            const apiData = {
                date: isoString,
                name: newWorkoutData.name,
                type: newWorkoutData.type,
            };

            const response = await api.post<Workout>(`/workouts/trainee/${id}`, apiData);
            setWorkouts(prev => sortWorkouts([...prev, response.data]));

            window.dispatchEvent(new Event('traineesUpdated'));
            setIsModalOpen(false);
            show({
                type: 'success',
                message: 'Тренировка добавлена',
            });
        } catch (err) {
            let detail = 'Ошибка при создании тренировки';
            if (isAxiosError(err)) {
                detail = err.response?.data?.detail || detail;
            }
            
            show({
                type: 'error',
                title: 'Ошибка',
                message: detail,
            });
            console.error('Create workout error:', err);
        }
    };

    const handleRemoveWorkout = (workoutId: number) => {
        setConfirmDelete({ id: workoutId, type: 'workout' });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDelete) return;

        try {
            await api.delete(`/workouts/${confirmDelete.id}`);

            setWorkouts(prev => prev.filter(w => w.id !== confirmDelete.id));
            show({
                type: 'success',
                message: 'Тренировка удалена',
            });
        } catch (err) {
            let detail = 'Ошибка при удалении тренировки';
            if (isAxiosError(err)) {
                detail = err.response?.data?.detail || detail;
            }
            
            show({
                type: 'error',
                title: 'Ошибка',
                message: detail,
            });
            console.error('Delete workout error:', err);
        }
    };

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const activeFiltersCount = selectedTimeSlots.length + selectedTypes.length + (searchTerm ? 1 : 0);

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <h1>Расписание тренировок</h1>
            </div>

            <div className={styles.layout}>
                <aside className={styles.filtersSidebar}>
                    <div className={styles.sidebarHeader}>
                        <h3>Фильтры</h3>
                        {activeFiltersCount > 0 && (
                            <span className={styles.badge}>{activeFiltersCount}</span>
                        )}
                    </div>

                    <div className={styles.filterSection}>
                        <h4 className={styles.sectionTitle}>Время</h4>
                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={selectedTimeSlots.includes('morning')}
                                    onChange={() => toggleTimeSlot('morning')}
                                />
                                <span>Утро (5:00 - 12:00)</span>
                            </label>
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={selectedTimeSlots.includes('afternoon')}
                                    onChange={() => toggleTimeSlot('afternoon')}
                                />
                                <span>День (12:00 - 17:00)</span>
                            </label>
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={selectedTimeSlots.includes('evening')}
                                    onChange={() => toggleTimeSlot('evening')}
                                />
                                <span>Вечер (17:00 - 23:00)</span>
                            </label>
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={selectedTimeSlots.includes('night')}
                                    onChange={() => toggleTimeSlot('night')}
                                />
                                <span>Ночь (23:00 - 5:00)</span>
                            </label>
                        </div>
                    </div>

                    <div className={styles.filterSection}>
                        <h4 className={styles.sectionTitle}>Тип</h4>
                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.includes('Силовая')}
                                    onChange={() => toggleType('Силовая')}
                                />
                                <span>Силовая</span>
                            </label>
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.includes('Кардио')}
                                    onChange={() => toggleType('Кардио')}
                                />
                                <span>Кардио</span>
                            </label>
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.includes('Гибкость')}
                                    onChange={() => toggleType('Гибкость')}
                                />
                                <span>Гибкость</span>
                            </label>
                        </div>
                    </div>

                    {activeFiltersCount > 0 && (
                        <button className={styles.clearFiltersBtn} onClick={clearFilters}>
                            Сбросить все фильтры
                        </button>
                    )}
                </aside>


                <div className={styles.contentArea}>
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />

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
                        <button
                            className={`${styles.switchBtn} ${viewMode === 'archive' ? styles.active : ''} ${styles.archiveBtn}`}
                            onClick={() => setViewMode('archive')}
                        >
                            Архив
                        </button>
                    </div>

                    {viewMode === 'day' && (
                        <div className={styles.dayList}>
                            {futureWorkouts.map((workout) => (
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

                    {viewMode === 'archive' && (
                        <div className={styles.archiveList}>
                            {pastWorkouts.length === 0 ? (
                                <div className={styles.empty}>Нет прошедших тренировок</div>
                            ) : (
                                pastWorkouts.map((workout) => (
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
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AddWorkoutModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onAdd={handleAddWorkout}
            />
            <ConfirmModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Удаление тренировки"
                message="Вы уверены, что хотите удалить эту тренировку?"
                confirmText="Удалить"
            />
        </main>
    )
}