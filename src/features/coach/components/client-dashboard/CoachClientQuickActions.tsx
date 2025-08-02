import { Button } from '@/components/ui/button';
import {
  Calculator,
  Calendar,
  FileText,
  PieChart,
  Sparkles,
  TrendingUp,
  User,
  Utensils,
} from 'lucide-react';
import Link from 'next/link';

function CoachClientQuickActions({ clientId }: { clientId: string }) {
  const clientLinks = [
    {
      href: `/coach-dashboard/clients/${clientId}/profile`,
      icon: <User />,
      text: 'Client Profile',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/meal-plan/current`,
      icon: <Calendar />,
      text: 'Current Meal Plan',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/meal-plan/optimized`,
      icon: <Sparkles />,
      text: 'Generate Optimized Plan',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/tools/macro-splitter`,
      icon: <PieChart />,
      text: 'Macro Calculator',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/tools/smart-calorie-planner`,
      icon: <Calculator />,
      text: 'Calorie Planner',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/body-progress`,
      icon: <TrendingUp />,
      text: 'Body Progress',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/meal-progress`,
      icon: <Utensils />,
      text: 'Meal Progress',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/reports`,
      icon: <FileText />,
      text: 'Progress Reports',
    },
  ];
  return (
    <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-4'>
      {clientLinks.map((link) => (
        <Link key={link.href} href={link.href}>
          <Button variant='outline' className='w-full justify-start'>
            {link.icon}
            {link.text}
          </Button>
        </Link>
      ))}
    </div>
  );
}

export default CoachClientQuickActions;
