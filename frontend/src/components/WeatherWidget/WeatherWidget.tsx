import { useState, useEffect, useRef } from 'react';
import { weatherApi, WeatherData } from '../../api/weather';
import styles from './WeatherWidget.module.css';

interface Position {
  x: number;
  y: number;
}

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<Position>({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await weatherApi.getWeather('Moscow');
      setWeather(data);
    } catch (err) {
      setError('Не удалось загрузить погоду');
      console.error('Weather error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (widgetRef.current) {
      setIsDragging(true);
      const rect = widgetRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  if (loading) {
    return (
      <div data-testid="weather-widget" className={styles.widget} style={{ left: position.x, top: position.y }} ref={widgetRef}>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div data-testid="weather-widget" className={styles.widget} style={{ left: position.x, top: position.y }} ref={widgetRef}>
        <div className={styles.error}>
          <p>⚠️ {error}</p>
          <button onClick={fetchWeather}>Повторить</button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="weather-widget" 
      className={`${styles.widget} ${isDragging ? styles.dragging : ''}`} 
      style={{ left: position.x, top: position.y }} 
      ref={widgetRef}
    >
      <div className={styles.header} onMouseDown={handleMouseDown}>
        <span>🌤️ Погода</span>
        <span className={styles.dragHint}>⋮⋮</span>
      </div>
      
      <div className={styles.content}>
        <div className={styles.main}>
          <img src={getWeatherIcon(weather.icon)} alt={weather.description} />
          <div className={styles.temperature}>
            <span className={styles.temp}>{weather.temperature}°C</span>
            <span className={styles.feels}>Ощущается как {weather.feels_like}°C</span>
          </div>
        </div>
        
        <div className={styles.details}>
          <div className={styles.detail}>
            <span>💧</span>
            <span>{weather.humidity}%</span>
          </div>
          <div className={styles.detail}>
            <span>💨</span>
            <span>{weather.wind_speed} м/с</span>
          </div>
        </div>
        
        <p className={styles.description}>{weather.description}</p>
        <p className={styles.city}>{weather.city}</p>
      </div>
    </div>
  );
};