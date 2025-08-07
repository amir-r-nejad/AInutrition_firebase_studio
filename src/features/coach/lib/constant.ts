import { BarChart3, UserCheck, UserPen, Users, UserPlus } from 'lucide-react';

export const coachMenuItems = [
  {
    title: 'Dashboard',
    url: '/coach-dashboard',
    icon: BarChart3,
  },
  {
    title: 'My Clients',
    url: '/coach-dashboard/clients',
    icon: UserCheck,
  },
  {
    title: 'Client Requests',
    url: '/coach-dashboard/requests',
    icon: Users,
  },
  {
    title: 'Your Profile',
    url: '/coach-dashboard/profile',
    icon: UserPen,
  },
];

export const primaryActions = [
  {
    title: 'Find New Clients',
    description: 'Browse and connect with potential clients',
    icon: UserPlus,
    href: '/coach-dashboard/requests',
    color:
      'hover:bg-accent/5 hover:border-accent/50 text-foreground hover:text-accent',
    iconColor: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    title: 'View My Clients',
    description: 'Manage your active client relationships',
    icon: Users,
    href: '/coach-dashboard/clients',
    color:
      'hover:bg-primary/5 hover:border-primary/50 text-foreground hover:text-primary',
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
  },
];

export const biologicalSexOptions = [
  { value: 'all', label: 'All Genders' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const dietGoalOptions = [
  { value: 'all', label: 'All Goals' },
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'recomp', label: 'Body Recomposition' },
];

export const sortOptions = [
  { value: 'created_at-desc', label: 'Sort by join date (recent first)' },
  { value: 'created_at-asc', label: 'Sort by join date (earlier first)' },
  { value: 'full_name-asc', label: 'Sort by name (A–Z)' },
  { value: 'full_name-desc', label: 'Sort by name (Z–A)' },
  { value: 'age-asc', label: 'Sort by age (youngest first)' },
  { value: 'age-desc', label: 'Sort by age (oldest first)' },
];
