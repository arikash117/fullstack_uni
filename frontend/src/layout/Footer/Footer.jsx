import React from 'react';
import styles from './Footer.module.css';

function Footer() {
    return (
        <footer className={styles.footer}>
            <h1>
                <a className={styles.link} href="/">Train!</a>
            </h1>
        </footer>
    )
}

export default Footer;
