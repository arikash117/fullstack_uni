export interface Trainee {
  id: number;
  name: string;
  phone: string;
  goal: string;
  photo_url?: string;
  subscription_end: string;
  next_training?: string;
  isNew?: boolean;
}

export interface TraineeFormData {
  name: string;
  phone: string;
  goal: string;
  subscriptionEnd: string;
  photo: File | null;
}
