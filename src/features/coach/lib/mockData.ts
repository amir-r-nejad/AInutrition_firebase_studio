export const mockCoachProfile = {
  user_id: "coach_001",
  first_name: "Sarah",
  last_name: "Johnson",
  email_address: "sarah.johnson@nutriplan.com",
  profile_picture: null,
  age: 32,
  gender: "female" as const,
  location: "San Francisco, CA",
  joined_date: "March 2023",
  description:
    "Certified nutritionist with 8+ years of experience helping clients achieve their health goals through personalized meal planning and lifestyle coaching. I specialize in sustainable weight management and sports nutrition.",
  specializations: ["Weight Loss", "Sports Nutrition", "Meal Planning", "Diabetes Management"],
  total_clients: 24,
  years_experience: 8,
  rating: 4.9,
  total_reviews: 127,
  certification: "Registered Dietitian Nutritionist (RDN)",
  languages: ["English", "Spanish"],
}

export const mockDashboardStats = {
  total_clients: 24,
  active_clients: 18,
  monthly_sessions: 42,
  success_rate: 94,
  pending_requests: 4,
  new_clients_month: 3,
  sessions_completed: 38,
}

export const mockClientsStats = {
  total_clients: 24,
  active_clients: 18,
  inactive_clients: 6,
  average_progress: 87,
}

export const mockRequestsStats = {
  available_clients: 156,
  pending_requests: 4,
  accepted_today: 2,
  declined_today: 1,
  total_this_month: 12,
}

export const mockCoachStats = {
  monthly_sessions: 42,
  success_rate: 94,
  retention_rate: 89,
  new_clients_month: 3,
  sessions_completed: 38,
  avg_response_time: "< 2h",
}

export const mockRecentActivity = [
  {
    id: "activity_001",
    type: "message",
    title: "New message from client",
    description: "Jessica Wong sent you a message about her meal plan",
    client_name: "Jessica Wong",
    time: "2 hours ago",
  },
  {
    id: "activity_002",
    type: "progress",
    title: "Client progress update",
    description: "Alex Martinez completed his weekly check-in",
    client_name: "Alex Martinez",
    time: "4 hours ago",
  },
  {
    id: "activity_003",
    type: "new_client",
    title: "Client accepted request",
    description: "Sophia Patel accepted your coaching request",
    client_name: "Sophia Patel",
    time: "1 day ago",
  },
  {
    id: "activity_004",
    type: "session",
    title: "Session completed",
    description: "Completed nutrition consultation with James Wilson",
    client_name: "James Wilson",
    time: "2 days ago",
  },
]

export const mockUpcomingTasks = [
  {
    id: "task_001",
    title: "Review meal plan",
    client_name: "Jessica Wong",
    due_date: "Today",
    priority: "high",
  },
  {
    id: "task_002",
    title: "Weekly check-in call",
    client_name: "Alex Martinez",
    due_date: "Tomorrow",
    priority: "medium",
  },
  {
    id: "task_003",
    title: "Update nutrition goals",
    client_name: "Sophia Patel",
    due_date: "This week",
    priority: "low",
  },
  {
    id: "task_004",
    title: "Progress report review",
    client_name: "James Wilson",
    due_date: "Friday",
    priority: "medium",
  },
]

// Potential clients that coaches can send requests to
export const mockPotentialClients = [
  {
    user_id: "potential_001",
    first_name: "Michael",
    last_name: "Chen",
    email_address: "michael.chen@email.com",
    profile_picture: null,
    age: 28,
    gender: "male" as const,
    current_goal: "Weight Loss",
    joined_date: "Jan 2024",
  },
  {
    user_id: "potential_002",
    first_name: "Emma",
    last_name: "Rodriguez",
    email_address: "emma.rodriguez@email.com",
    profile_picture: null,
    age: 25,
    gender: "female" as const,
    current_goal: "Sports Nutrition",
    joined_date: "Feb 2024",
  },
  {
    user_id: "potential_003",
    first_name: "David",
    last_name: "Kim",
    email_address: "david.kim@email.com",
    profile_picture: null,
    age: 32,
    gender: "male" as const,
    current_goal: "Plant-based Diet",
    joined_date: "Dec 2023",
  },
  {
    user_id: "potential_004",
    first_name: "Lisa",
    last_name: "Thompson",
    email_address: "lisa.thompson@email.com",
    profile_picture: null,
    age: 29,
    gender: "female" as const,
    current_goal: "Diabetes Management",
    joined_date: "Mar 2024",
  },
  {
    user_id: "potential_005",
    first_name: "Robert",
    last_name: "Davis",
    email_address: "robert.davis@email.com",
    profile_picture: null,
    age: 35,
    gender: "male" as const,
    current_goal: "Muscle Gain",
    joined_date: "Jan 2024",
  },
  {
    user_id: "potential_006",
    first_name: "Maria",
    last_name: "Garcia",
    email_address: "maria.garcia@email.com",
    profile_picture: null,
    age: 27,
    gender: "female" as const,
    current_goal: "Weight Loss",
    joined_date: "Feb 2024",
  },
]

// Requests that the coach has sent and are pending client response
export const mockPendingRequests = [
  {
    user_id: "pending_001",
    full_name: "John Smith",
    email_address: "john.smith@email.com",
    profile_picture: null,
    sent_date: "2 days ago",
  },
  {
    user_id: "pending_002",
    full_name: "Anna Wilson",
    email_address: "anna.wilson@email.com",
    profile_picture: null,
    sent_date: "1 week ago",
  },
  {
    user_id: "pending_003",
    full_name: "Carlos Martinez",
    email_address: "carlos.martinez@email.com",
    profile_picture: null,
    sent_date: "3 days ago",
  },
  {
    user_id: "pending_004",
    full_name: "Sarah Lee",
    email_address: "sarah.lee@email.com",
    profile_picture: null,
    sent_date: "5 days ago",
  },
]

// Clients who have accepted the coach's requests
export const mockAcceptedClients = [
  {
    user_id: "client_001",
    first_name: "Alex",
    last_name: "Martinez",
    email_address: "alex.martinez@email.com",
    profile_picture: null,
    age: 28,
    gender: "male" as const,
    current_goal: "Muscle Gain",
    status: "active" as const,
    joined_date: "Jan 2024",
    last_activity: "2 hours ago",
    progress_score: 85,
  },
  {
    user_id: "client_002",
    first_name: "Jessica",
    last_name: "Wong",
    email_address: "jessica.wong@email.com",
    profile_picture: null,
    age: 34,
    gender: "female" as const,
    current_goal: "Weight Loss",
    status: "active" as const,
    joined_date: "Dec 2023",
    last_activity: "1 day ago",
    progress_score: 92,
  },
  {
    user_id: "client_003",
    first_name: "Ryan",
    last_name: "O'Connor",
    email_address: "ryan.oconnor@email.com",
    profile_picture: null,
    age: 25,
    gender: "male" as const,
    current_goal: "Maintenance",
    status: "inactive" as const,
    joined_date: "Nov 2023",
    last_activity: "1 week ago",
    progress_score: 67,
  },
  {
    user_id: "client_004",
    first_name: "Sophia",
    last_name: "Patel",
    email_address: "sophia.patel@email.com",
    profile_picture: null,
    age: 29,
    gender: "female" as const,
    current_goal: "Fat Loss",
    status: "active" as const,
    joined_date: "Feb 2024",
    last_activity: "3 hours ago",
    progress_score: 78,
  },
  {
    user_id: "client_005",
    first_name: "James",
    last_name: "Wilson",
    email_address: "james.wilson@email.com",
    profile_picture: null,
    age: 31,
    gender: "male" as const,
    current_goal: "Muscle Gain",
    status: "active" as const,
    joined_date: "Jan 2024",
    last_activity: "5 hours ago",
    progress_score: 89,
  },
  {
    user_id: "client_006",
    first_name: "Olivia",
    last_name: "Davis",
    email_address: "olivia.davis@email.com",
    profile_picture: null,
    age: 26,
    gender: "female" as const,
    current_goal: "Weight Loss",
    status: "active" as const,
    joined_date: "Mar 2024",
    last_activity: "1 hour ago",
    progress_score: 94,
  },
]

export type CoachProfile = typeof mockCoachProfile
export type PotentialClient = (typeof mockPotentialClients)[0]
export type PendingRequest = (typeof mockPendingRequests)[0]
export type AcceptedClient = (typeof mockAcceptedClients)[0]
export type RecentActivity = (typeof mockRecentActivity)[0]
export type UpcomingTask = (typeof mockUpcomingTasks)[0]
