import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DashBoard.module.css';
import TraineeCard from '../../components/TraineeCard/TraineeCard';

function DashBoard() {
    const navigate = useNavigate();

    const [trainees, setTrainees] = useState(
        Array.from({ length: 1 }, (_, i) => ({
            id: i,
            name: `Трейни ${i + 1}`,
            date: '01.01.26',
            isNew: false,
        }))
    );

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
                                date={trainee.date}
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