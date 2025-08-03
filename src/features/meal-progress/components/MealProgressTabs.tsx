import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BarChart3 } from 'lucide-react';

function MealProgressTabs() {
  return (
    <TabsList className='grid w-full grid-cols-2 bg-muted'>
      <TabsTrigger
        value='daily-tracking'
        className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2'
      >
        <Activity className='h-4 w-4' />
        Daily Tracking
      </TabsTrigger>
      <TabsTrigger
        value='overall-progress'
        className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2'
      >
        <BarChart3 className='h-4 w-4' />
        Overall Progress
      </TabsTrigger>
    </TabsList>
  );
}

export default MealProgressTabs;
