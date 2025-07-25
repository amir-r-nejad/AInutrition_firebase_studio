export interface CoachProfile {
  user_id: string
  first_name: string
  last_name: string
  email_address: string
  profile_picture: string | null
  age: number
  gender: "male" | "female" | "other"
  location: string
  joined_date: string
  description: string
  specializations: string[]
  total_clients: number
  years_experience: number
  rating: number
  total_reviews: number
  certification: string
  languages: string[]
}

export interface PotentialClient {
  user_id: string
  first_name: string
  last_name: string
  email_address: string
  profile_picture: string | null
  age: number
  gender: "male" | "female" | "other"
  current_goal: string
  joined_date: string
}

export interface PendingRequest {
  user_id: string
  full_name: string
  email_address: string
  profile_picture: string | null
  sent_date: string
}

export interface AcceptedClient {
  user_id: string
  first_name: string
  last_name: string
  email_address: string
  profile_picture: string | null
  age: number
  gender: "male" | "female" | "other"
  current_goal: string
  status: "active" | "inactive"
  joined_date: string
  last_activity: string
  progress_score: number
}

export interface RecentActivity {
  id: string
  type: "message" | "progress" | "new_client" | "session"
  title: string
  description: string
  client_name?: string
  time: string
}

export interface UpcomingTask {
  id: string
  title: string
  client_name: string
  due_date: string
  priority: "high" | "medium" | "low"
}

export interface DashboardStats {
  total_clients: number
  active_clients: number
  monthly_sessions: number
  success_rate: number
  pending_requests: number
  new_clients_month: number
  sessions_completed: number
}

export interface ClientsStats {
  total_clients: number
  active_clients: number
  inactive_clients: number
  average_progress: number
}

export interface RequestsStats {
  available_clients: number
  pending_requests: number
  accepted_today: number
  declined_today: number
  total_this_month: number
}

export interface CoachStats {
  monthly_sessions: number
  success_rate: number
  retention_rate: number
  new_clients_month: number
  sessions_completed: number
  avg_response_time: string
}
