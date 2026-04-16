import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../components/Notification/NotificationProvider';
import api from '../../api/client';
import styles from './Register.module.css';


export default function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const { show } = useNotification();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        if (password !== confirmPassword) {
            show({
                type: 'error',
                title: 'Ошибка регистрации',
                message: 'Пароли не совпадают',
                duration: 4000
            });
            setIsLoading(false);
            return;
        }

        try {
            await api.post('/auth/signup', {
                email,
                username,
                password,
                confirm_password: confirmPassword,
            });

            navigate('/login');
        } catch (error: any) {
            const detail = error.response?.data?.detail || 'Ошибка регистрации';
            show({
                type: 'error',
                title: 'Ошибка регистрации',
                message: detail,
                duration: 4000
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Регистрация | Фитнес-трекер</title>
                <meta name="robots" content="noindex, nofollow" />                
            </Helmet>

            <main className={styles.container}>
                <div className={styles.formBox}>
                    <h2 className={styles.title}>Регистрация</h2>
                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Username */}
                        <div className={styles.inputGroup}>
                            <label htmlFor="username">Логин</label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                minLength={3}
                                maxLength={20}
                                pattern="[a-zA-Z0-9_]+"
                                title="Только буквы, цифры и подчеркивания, минимум 3 символа"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password */}
                        <div className={styles.inputGroup}>
                            <label htmlFor="password">Пароль</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={isLoading}
                            />
                        </div>

                        {/* Confirm */}
                        <div className={styles.inputGroup}>
                            <label htmlFor="confirm">Подтвердите пароль</label>
                            <input
                                id="confirm"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className={styles.submitButton}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Создание...' : 'Зарегистрироваться'}
                        </button>
                    </form>

                    <p className={styles.footerText}>
                        Уже есть аккаунт?{' '}
                        <span
                            className={styles.link}
                            onClick={() => !isLoading && navigate('/login')}
                        >
                            Войти
                        </span>
                    </p>
                </div>
            </main>        
        </>

    );
}
