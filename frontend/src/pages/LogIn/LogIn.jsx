import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { useAuth } from '../../hooks/useAuth'


export default function LogIn() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(identifier, password);
        
        if (result.success) {
            if (result.role === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    };

    return (
        <main className={styles.container}>
            <div className={styles.formBox}>
                <h2 className={styles.title}>Вход</h2>
                <form onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                    <label htmlFor="identifier">Email</label>
                    <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
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
