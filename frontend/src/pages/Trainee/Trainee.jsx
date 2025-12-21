import { useParams } from 'react-router-dom';
import styles from './Trainee.module.css'
import pfp from '../../assets/pfp.jpg'
import InfoCard from '../../components/InfoCard/InfoCard'

export default function Trainee() {

    const { id } = useParams();

    // заглушка
    const trainee = {
        id,
        name: `Трейни ${id}`,
        phone: '+7 (999) 123-45-67',
        goal: 'Набрать мышечную массу',
        membershipPeriod: '01.01.2026 - 01.01.2027',
        nextTrainingDay: '05.01.2026',
    };

    return (
        <main className={styles.main}>
            <div className={styles.content}>
                <div className={styles.infoContainer}>
                    <img src={pfp} alt="pfp" className={styles.photo}/>
                    <div className={styles.infoText}>
                        <p>{trainee.name}</p>
                        <p>{trainee.phone}</p>
                        <p>{trainee.goal}</p>
                    </div>
                </div>
                <div className={styles.textContainer}>
                    <span>Действие абонемента: {trainee.membershipPeriod}</span>
                    <span className={styles.tooltip} data-tooltip="Дата следующей тренировки">
                        {trainee.nextTrainingDay}
                    </span>
                </div>
                <div className={styles.cards}>
                    <InfoCard />
                    <InfoCard />
                    <InfoCard />
                </div>
            </div>
            
        </main>
    )
}

