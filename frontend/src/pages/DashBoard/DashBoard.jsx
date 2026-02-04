import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import styles from './DashBoard.module.css';
import Schedule from '../../assets/schedule.svg'
import TraineeCard from '../../components/TraineeCard/TraineeCard';

function DashBoard() {
    const navigate = useNavigate();
    const [trainees, setTrainees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTrainees = async () => {
            try {
                const response = await api.get('/trainees');
                const sortedTrainees = [...response.data].sort((a, b) => {
                    const dateA = new Date(a.next_training);
                    const dateB = new Date(b.next_training);
                    return dateA - dateB;
                });
                setTrainees(sortedTrainees);
            } catch (err) {
                setError('Ошибка загрузки тренирующихся');
                console.error('Fetch trainees error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTrainees();
    }, []);

    const formatDateTime = (isoString) => {
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

    const handleAddTrainee = () => {
        navigate('/trainee/add');
    };

    const handleTraineeClick = (id) => {
        navigate(`/trainee/${id}`);
    };

    const handleRemoveTrainee = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить этого тренирующегося?')) {
            return;
        }

        try {
            await api.delete(`/trainees/${id}`);

            setTrainees(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            alert('Ошибка при удалении тренирующегося');
            console.error('Delete error:', err);
        }
    };

    return (
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
                    {trainees.map((trainee) => (
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
                </div>
            </div>
            
        </main>
    )
}

export default DashBoard;