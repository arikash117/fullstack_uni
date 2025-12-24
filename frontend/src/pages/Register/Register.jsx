import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css';


export default function Register() {
    const [email, setEmail] = useState('');
     const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }

        try {
            const response = await api.post('/auth/signup', {
                email,
                username,   
                password,
                confirm_password: confirmPassword, 
            });

            navigate('/login');
        } catch (error) {
            const detail = error.response?.data?.detail || 'Ошибка регистрации';
            alert(detail);
        }
    };

    return (
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
                    minLength="3"
                    pattern="[a-zA-Z0-9_]+"
                    title="Только буквы, цифры и подчеркивания, минимум 3 символа"
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
