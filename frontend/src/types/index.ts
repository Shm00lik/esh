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
  is_admin: boolean;
  timestamp: number;
}

export interface LeaderboardUser {
    user_id: string;
    username: string;
    esh: number;
}

// New type for the user list in transfer screen
export interface SimpleUser {
  user_id: string;
  username: string;
  is_admin: boolean;
}
