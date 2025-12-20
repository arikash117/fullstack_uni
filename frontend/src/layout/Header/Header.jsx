import React from 'react';
import styles from './Header.module.css';

function Header() {
    return (
        <div className={styles.header}>
            <a className={styles.link} href="/">
                <img className={styles.logo} src="/label.svg" alt="Main logo" />
                <span className={styles.text}>Train!</span>
            </a>
            <div className={styles.container}>
                <button className={styles.cover}>
                    Войти
                </button>
                <button className={styles.cover}>
                    Зарегестрироваться
                </button>
            </div>
        </div>
    )
}

export default Header;
