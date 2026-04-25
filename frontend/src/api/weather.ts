import axios from 'axios';

const API_URL = 'http://localhost:8000';

export interface WeatherData {
  city: string;
  temperature: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  updated_at: string;
}

export const weatherApi = {
  getWeather: async (city: string = 'Moscow'): Promise<WeatherData> => {
    const response = await axios.get(`${API_URL}/weather`, {
      params: { city },
      timeout: 15000
    });
    return response.data.data;
  }
};