import { Helmet } from 'react-helmet-async';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useNotification } from '../../components/Notification/NotificationProvider';
import { isAxiosError } from 'axios';
import api from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import styles from './Schedule.module.css'
import { Workout } from '../../types/workout';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import AddWorkoutModal from '../../components/AddWorkoutModal/AddWorkoutModal';
import WorkoutCard from '../../components/WorkoutCard/WorkoutCard';
import AscIcon from '../../assets/asc-sort-icon.svg';
import DescIcon from '../../assets/desc-sort-icon.svg';


interface NewWorkoutData {
  date: string;
  time: string;
  name: string;
  type: 'Силовая' | 'Кардио' | 'Гибкость';
}
type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
type WorkoutType = 'Силовая' | 'Кардио' | 'Гибкость';
type SortOrder = 'asc' | 'desc';

export default function Schedule() {
    const { show } = useNotification();
    const [confirmDelete, setConfirmDelete] = useState<{ id: number; type: 'workout' } | null>(null);
    const { id } = useParams<{ id: string }>();
    const hasRestoredFilters = useRef(false);

    const [searchParams, setSearchParams] = useSearchParams();

    const [viewMode, setViewMode] = useState<'day' | 'month' | 'archive'>('day');
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // пагинация
    const ITEMS_PER_PAGE = 5;
    const [currentPage, setCurrentPage] = useState(1);

    // парметр для поиска
    const searchTerm = searchParams.get('search') || '';
    const debouncedSearch = useDebounce(searchTerm, 300);
    // мемо для фильтров
    const selectedTimeSlots = useMemo(() => {
        const timeParam = searchParams.get('time');
        return timeParam ? (timeParam.split(',') as TimeSlot[]) : [];
    }, [searchParams]);

    const selectedTypes = useMemo(() => {
        const typeParam = searchParams.get('type');
        return typeParam ? (typeParam.split(',') as WorkoutType[]) : [];
    }, [searchParams]);

    // параметр для сортировки
    const sortOrder = (searchParams.get('sort') as SortOrder) || 'asc';

    useEffect(() => {
        if (!id || hasRestoredFilters.current) return;
        
        const hasTime = searchParams.get('time');
        const hasType = searchParams.get('type');
        const hasSort = searchParams.get('sort');
        const hasSearch = searchParams.get('search');
        
        if (!hasTime && !hasType && !hasSort && !hasSearch) {
            const savedFilters = localStorage.getItem(`schedule_filters_${id}`);
            if (savedFilters) {
                try {
                    const filters = JSON.parse(savedFilters);
                    const newParams = new URLSearchParams();
                    
                    if (filters.search) newParams.set('search', filters.search);
                    if (filters.time?.length > 0) newParams.set('time', filters.time.join(','));
                    if (filters.type?.length > 0) newParams.set('type', filters.type.join(','));
                    if (filters.sort) newParams.set('sort', filters.sort);

                    if (newParams.toString()) {
                        setSearchParams(newParams, { replace: true });
                        hasRestoredFilters.current = true;
                    }
                } catch (e) {
                    console.error('Failed to parse saved filters:', e);
                }
            }
        } else {
            hasRestoredFilters.current = true;
        }
    }, [id, searchParams, setSearchParams]);

    useEffect(() => {
        if (id) {
            const filters = {
                search: debouncedSearch,
                time: selectedTimeSlots,
                type: selectedTypes,
                sort: sortOrder,
            };
            localStorage.setItem(`schedule_filters_${id}`, JSON.stringify(filters));
        }
    }, [id, debouncedSearch, selectedTimeSlots, selectedTypes, sortOrder]);

    const updateFilters = useCallback((updates: Partial<{
        search: string;
        time: TimeSlot[];
        type: WorkoutType[];
        sort: SortOrder;
    }>) => {
        const newParams = new URLSearchParams(searchParams);
        
        if (updates.search !== undefined) {
            updates.search ? newParams.set('search', updates.search) : newParams.delete('search');
        }
        if (updates.time !== undefined) {
            updates.time.length > 0 
                ? newParams.set('time', updates.time.join(',')) 
                : newParams.delete('time');
        }
        if (updates.type !== undefined) {
            updates.type.length > 0 
                ? newParams.set('type', updates.type.join(',')) 
                : newParams.delete('type');
        }
        if (updates.sort !== undefined) {
            newParams.set('sort', updates.sort);
        }
        
        setSearchParams(newParams);
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        const fetchWorkouts = async () => {
            if (!id) {
                setError('ID тренирующегося не указан');
                setLoading(false);
                return;
            }

            try {
                const params: any = { trainee_id: id };
                if (debouncedSearch) params.name = debouncedSearch;
                
                if (selectedTimeSlots.length > 0) {
                    params.time_slots = selectedTimeSlots.join(',');
                }
                if (selectedTypes.length > 0) {
                    params.types = selectedTypes.join(',');
                }
                
                params.sort = sortOrder;

                const response = await api.get<Workout[]>('/workouts', { params });
                setWorkouts(response.data);

            } catch (err) {
                setError('Ошибка загрузки тренировок');
                console.error('Fetch workouts error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkouts();
        
        const handleTraineesUpdated = () => {
            fetchWorkouts();
        };
        
        window.addEventListener('traineesUpdated', handleTraineesUpdated);
        
        return () => {
            window.removeEventListener('traineesUpdated', handleTraineesUpdated);
        };
    }, [id, debouncedSearch, selectedTimeSlots, selectedTypes, sortOrder]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, selectedTimeSlots, selectedTypes, sortOrder]);

    const toggleTimeSlot = (slot: TimeSlot) => {
        const updated = selectedTimeSlots.includes(slot)
            ? selectedTimeSlots.filter(s => s !== slot)
            : [...selectedTimeSlots, slot];
        updateFilters({ time: updated });
    };

    const toggleType = (type: WorkoutType) => {
        const updated = selectedTypes.includes(type)
            ? selectedTypes.filter(t => t !== type)
            : [...selectedTypes, type];
        updateFilters({ type: updated });
    };


    const clearFilters = () => {
        updateFilters({ search: '', time: [], type: [], sort: 'asc' });
    };

    const handleSearchChange = (value: string) => {
        updateFilters({ search: value });
    };

    const toggleSortOrder = () => {
        updateFilters({ sort: sortOrder === 'asc' ? 'desc' : 'asc' });
    };

    const goToPreviousPage = () => {
        setCurrentPage(prev => (prev === 1 ? totalPages : prev - 1));
    };

    const goToNextPage = () => {
        setCurrentPage(prev => (prev === totalPages ? 1 : prev + 1));
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

    const totalPages = Math.max(1, Math.ceil(futureWorkouts.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentWorkouts = futureWorkouts.slice(startIndex, endIndex);

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

            await api.post<Workout>(`/workouts/trainee/${id}`, apiData);
            window.dispatchEvent(new Event('traineesUpdated'));
            setIsModalOpen(false);
            show({ type: 'success', message: 'Тренировка добавлена' });
        } catch (err) {
            let detail = 'Ошибка при создании тренировки';
            if (isAxiosError(err)) {
                detail = err.response?.data?.detail || detail;
            }
            show({ type: 'error', title: 'Ошибка', message: detail });
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
        <>
            <Helmet>
                <title>Расписание тренировок</title>
                <meta name="robots" content="noindex, nofollow" />                
            </Helmet>

            <main className={styles.main} key={id}>
                <header className={styles.header}>
                    <h1>Расписание тренировок</h1>
                </header>

                <div className={styles.layout}>
                    <aside className={styles.filtersSidebar} aria-label="Фильтры тренировок">
                        <div className={styles.sidebarHeader}>
                            <h2>Фильтры</h2>
                            {activeFiltersCount > 0 && (
                                <span className={styles.badge} aria-label={`${activeFiltersCount} активных фильтров`}>
                                    {activeFiltersCount}
                                </span>
                            )}
                        </div>

                        <div className={styles.filterSection}>
                            <h3 className={styles.sectionTitle}>Время</h3>
                            <fieldset className={styles.checkboxGroup}>
                                {(['morning', 'afternoon', 'evening', 'night'] as TimeSlot[]).map(slot => (
                                    <label key={slot} className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        checked={selectedTimeSlots.includes(slot)}
                                        onChange={() => toggleTimeSlot(slot)}
                                        id={`time-${slot}`}
                                    />
                                    <span>
                                        {slot === 'morning' && 'Утро (5:00 - 12:00)'}
                                        {slot === 'afternoon' && 'День (12:00 - 17:00)'}
                                        {slot === 'evening' && 'Вечер (17:00 - 23:00)'}
                                        {slot === 'night' && 'Ночь (23:00 - 5:00)'}
                                    </span>
                                    </label>
                                ))}
                            </fieldset>
                        </div>

                        <div className={styles.filterSection}>
                            <h3 className={styles.sectionTitle}>Тип</h3>
                            <fieldset className={styles.checkboxGroup}>
                                {(['Силовая', 'Кардио', 'Гибкость'] as WorkoutType[]).map(type => (
                                    <label key={type} className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        checked={selectedTypes.includes(type)}
                                        onChange={() => toggleType(type)}
                                        id={`type-${type}`}
                                    />
                                    <span>
                                        {type === 'Силовая' && 'Силовая'}
                                        {type === 'Кардио' && 'Кардио'}
                                        {type === 'Гибкость' && 'Гибкость'}
                                    </span>
                                    </label>
                                ))}
                            </fieldset>
                        </div>

                        {activeFiltersCount > 0 && (
                            <button className={styles.clearFiltersBtn} onClick={clearFilters}>
                                Сбросить все фильтры
                            </button>
                        )}
                    </aside>


                    <div className={styles.contentArea}>

                    <div className={styles.searchRow}>
                        <input
                            type="text"
                            placeholder="Поиск по названию..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className={styles.searchInput}
                            aria-label="Поиск тренировок по названию"
                        />
                        <button
                            className={styles.sortBtn}
                            onClick={toggleSortOrder}
                            title={sortOrder === 'asc' ? 'Сортировать по убыванию' : 'Сортировать по возрастанию'}
                            aria-label={`Сортировка: ${sortOrder === 'asc' ? 'по возрастанию' : 'по убыванию'}`}
                        >
                            <img 
                            src={sortOrder === 'asc' ? AscIcon : DescIcon} 
                            alt={`Сортировка ${sortOrder === 'asc' ? 'по возрастанию' : 'по убыванию'}`}
                            />
                        </button>
                    </div>

                    <div className={styles.switcher} role="tablist" aria-label="Режим просмотра расписания">
                        <button
                            className={`${styles.switchBtn} ${viewMode === 'day' ? styles.active : ''}`}
                            onClick={() => setViewMode('day')}
                            role="tab"
                            aria-selected={viewMode === 'day'}
                            aria-controls="day-panel"
                            id="day-tab"
                        >
                            Ближайшие
                        </button>
                        <button
                            className={`${styles.switchBtn} ${viewMode === 'month' ? styles.active : ''}`}
                            onClick={() => setViewMode('month')}
                            role="tab"
                            aria-selected={viewMode === 'month'}
                            aria-controls="month-panel"
                            id="month-tab"
                        >
                            Месяц
                        </button>
                        <button
                            className={`${styles.switchBtn} ${viewMode === 'archive' ? styles.active : ''} ${styles.archiveBtn}`}
                            onClick={() => setViewMode('archive')}
                            role="tab"
                            aria-selected={viewMode === 'archive'}
                            aria-controls="archive-panel"
                            id="archive-tab"
                        >
                            Архив
                        </button>
                    </div>

                    {viewMode === 'day' && (
                        <div className={styles.dayList} role="tabpanel" id="day-panel" aria-labelledby="day-tab">
                            <ul className={styles.workoutList} aria-label="Список предстоящих тренировок">
                                {currentWorkouts.map((workout) => (
                                    <li key={workout.id} className={styles.workoutItem}>
                                        <WorkoutCard
                                            id={workout.id}
                                            date={formatDate(workout.date)}
                                            time={formatTime(workout.date)}
                                            isoDate={workout.date}
                                            name={workout.name}
                                            type={workout.type}
                                            isNew={false}
                                            onRemove={handleRemoveWorkout}
                                        />
                                    </li>
                                ))}
                            </ul>

                            <button className={styles.addWorkoutCard} onClick={openModal}>
                            + Добавить тренировку
                            </button>

                            {totalPages > 1 && (
                                <nav className={styles.pagination} aria-label="Пагинация тренировок">
                                    <button 
                                        className={styles.paginationBtn} 
                                        onClick={goToPreviousPage}
                                        aria-label="Предыдущая страница"
                                    >
                                    ←
                                    </button>
                                    <span className={styles.paginationInfo} aria-live="polite">
                                        {currentPage}/{totalPages}
                                    </span>
                                    <button 
                                        className={styles.paginationBtn} 
                                        onClick={goToNextPage}
                                        aria-label="Следующая страница"
                                    >
                                    →
                                    </button>
                                </nav>
                            )}
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
        </>
    )
}