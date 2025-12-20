import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css';


export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
        alert('Пароли не совпадают');
        return;
        }

    // Позже — отправка на бэкенд
    console.log('Регистрация:', { email, password });
    
    // После успешной регистрации — редирект на dashboard
    navigate('/dashboard');
    };

    return (
        <main className={styles.container}>
            <div className={styles.formBox}>
                <h2 className={styles.title}>Регистрация</h2>
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

                <div className={styles.inputGroup}>
                    <label htmlFor="confirm">Подтвердите пароль</label>
                    <input
                    id="confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    />
                </div>

                <button type="submit" className={styles.submitButton}>
                    Зарегистрироваться
                </button>
                </form>

                <p className={styles.footerText}>
                Уже есть аккаунт?{' '}
                <span
                    className={styles.link}
                    onClick={() => navigate('/login')}
                >
                    Войти
                </span>
                </p>
            </div>
        </main>
  );
}
