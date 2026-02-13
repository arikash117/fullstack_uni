import styles from './InfoCard.module.css'

export default function InfoCard({icon, text, onClick}) {
    return (
        <div className={styles.container} onClick={onClick}>
            <img src={icon} alt="icon" className={styles.icon}/>
            <span>{text}</span>
        </div>
    )
}
