import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';


export default function LogIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log('Вход:', { email, password });

        navigate('/dashboard');
    };

    return (
        <main className={styles.container}>
            <div className={styles.formBox}>
                <h2 className={styles.title}>Вход</h2>
                <form onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="password">Пароль</label>
                    <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    />
                </div>

                <button type="submit" className={styles.submitButton}>
                    Войти
                </button>
                </form>

                <p className={styles.footerText}>
                    Нет аккаунта?{' '}
                    <span
                        className={styles.link}
                        onClick={() => navigate('/register')}
                    >
                        Зарегистрироваться
                    </span>
                </p>
            </div>
        </main>
    );
}
