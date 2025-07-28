import { Button } from '@/components/ui/button';
import {
  BrainCircuit,
  ChefHat,
  FileText,
  SlidersHorizontal,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import Link from 'next/link';

function CoachClientQuickActions({ clientId }: { clientId: string }) {
  const clientLinks = [
    {
      href: `/coach-dashboard/clients/${clientId}/profile`,
      icon: <User />,
      text: 'View Profile',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/meal-plan/current`,
      icon: <UtensilsCrossed />,
      text: 'Current Meal Plan',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/meal-plan/optimized`,
      icon: <ChefHat />,
      text: 'Optimized Meal Plan',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/tools/macro-splitter`,
      icon: <SlidersHorizontal />,
      text: 'Macro Splitter',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/tools/smart-calorie-planner`,
      icon: <BrainCircuit />,
      text: 'Smart Calorie Planner',
    },
    {
      href: `/coach-dashboard/clients/${clientId}/reports`,
      icon: <FileText />,
      text: 'Reports',
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
