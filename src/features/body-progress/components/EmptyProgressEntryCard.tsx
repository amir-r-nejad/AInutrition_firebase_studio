import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

function EmptyProgressEntryCard({ monthLabel }: { monthLabel: string }) {
  return (
    <Card className='shadow-lg'>
      <CardHeader>
        <CardTitle className='text-xl flex items-center gap-2 text-primary'>
          <FileText className='h-5 w-5' />
          Progress Entries - {monthLabel}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-center h-32 text-muted-foreground'>
          <div className='text-center'>
            <FileText className='h-8 w-8 mx-auto mb-2 opacity-50' />
            <p>No entries recorded for {monthLabel}</p>
            <p className='text-sm'>Add your first measurement above!</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EmptyProgressEntryCard;
