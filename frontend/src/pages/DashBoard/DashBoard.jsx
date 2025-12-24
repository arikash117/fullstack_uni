import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import styles from './DashBoard.module.css';
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
                setTrainees(response.data);
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

    const handleRemoveTrainee = (id) => {
        setTrainees(prev => prev.filter(t => t.id !== id));
    };

    return (
        <main className={styles.main}>
            <span>-----------------------Мои трейни-----------------------</span>
            <div className={styles.content}>
                <div className={styles.aside}>
                    <div className={styles.calendar}></div>
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