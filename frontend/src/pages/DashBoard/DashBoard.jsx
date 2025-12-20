import { useState } from 'react';
import styles from './DashBoard.module.css';
import TraineeCard from '../../components/TraineeCard/TraineeCard';

function DashBoard() {

    const [trainees, setTrainees] = useState(
        Array.from({ length: 1 }, (_, i) => ({
            id: i,
            name: `Трейни ${i + 1}`,
            date: '01.01.26',
            isNew: false,
        }))
    );

    const handleAddTrainee = () => {
        const newId = trainees.length + 1;
        const newTrainee = {
            id: newId,
            name: `Трейни ${newId}`,
            date: '01.01.26', // можно сделать динамически позже
            isNew: true,
        };
        setTrainees((prev) => [...prev, newTrainee]);
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
                        <TraineeCard
                        key={trainee.id}
                        name={trainee.name}
                        date={trainee.date}
                        isNew={trainee.isNew}
                        />
                    ))}
                </div>
            </div>
            
        </main>
    )
}

export default DashBoard;