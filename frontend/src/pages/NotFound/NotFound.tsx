import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import styles from './NotFound.module.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Страница не найдена | Фитнес-трекер</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <main className={styles.main}>
        <h1>404</h1>
        <p>Страница не найдена</p>
        <button onClick={() => navigate('/')}>На главную</button>
      </main>
    </>
  );
}