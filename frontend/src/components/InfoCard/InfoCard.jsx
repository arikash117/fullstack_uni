import styles from './InfoCard.module.css'

export default function InfoCard({icon, text}) {
    return (
        <div className={styles.container}>
            <img src={icon} alt="icon" className={styles.icon}/>
            <span>{text}</span>
        </div>
    )
}
