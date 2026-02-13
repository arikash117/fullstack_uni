export interface Workout {
  id: number;
  date: string;
  name: string;
  type: 'Силовая' | 'Кардио' | 'Гибкость';
  trainee_id: number;
}
