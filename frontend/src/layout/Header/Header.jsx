import React from 'react';
import styles from './Header.module.css';

function Header() {
    return (
        <header className={styles.header}>
            <a className={styles.link} href="/">
                <img className={styles.logo} src="/label.svg" alt="Main logo" />
                <span className={styles.text}>Train!</span>
            </a>
        </header>
    )
}

export default Header;
