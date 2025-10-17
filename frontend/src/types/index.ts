export interface User {
  user_id: string;
  user_key: string;
  username: string | null;
  is_admin: boolean;
  esh: number;
}

export interface ChatMessage {
  id: string; // Unique ID for React keys
  from: string;
  text: string;
  pinned: boolean;
  timestamp: number;
}

export interface LeaderboardUser {
    username: string;
    esh: number;
}
