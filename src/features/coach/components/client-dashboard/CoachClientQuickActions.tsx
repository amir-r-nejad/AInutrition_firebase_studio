import { Button } from '@/components/ui/button';
import {
  Activity,
  BarChart4,
  ChefHat,
  ClipboardList,
  FileBarChart,
  Settings2,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';

function CoachClientQuickActions({ clientId }: { clientId: string }) {
  const clientLinks = [
    {
      href: `/coach-dashboard/clients/${clientId}/profile`,
      icon: <UserRound />,
      text: 'Client Profile',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/meal-plan/current`,
      icon: <ClipboardList />,
      text: 'Current Meal Plan',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/meal-plan/optimized`,
      icon: <ChefHat />,
      text: 'Generate Optimized Plan',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/tools/macro-splitter`,
      icon: <Settings2 />,
      text: 'Adjust Macro Targets',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/tools/smart-calorie-planner`,
      icon: <Activity />,
      text: 'Smart Calorie Planner',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/body-progress`,
      icon: <BarChart4 />,
      text: 'Track Body Progress',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/reports`,
      icon: <FileBarChart />,
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
