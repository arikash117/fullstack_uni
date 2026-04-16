import styles from './InfoCard.module.css'

interface InfoCardProps {
    icon: string;
    text: string;
    onClick: () => void;
    ariaLabel?: string;
}

export default function InfoCard({ icon, text, onClick, ariaLabel }: InfoCardProps) {
    return (
        <button
            type="button"
            className={styles.container}
            onClick={onClick}
            aria-label={ariaLabel || text}
        >
            <img 
                src={icon} 
                alt={`Иконка: ${text.toLowerCase()}`} 
                className={styles.icon}
            />
            <span>{text}</span>
        </button>
    )
}