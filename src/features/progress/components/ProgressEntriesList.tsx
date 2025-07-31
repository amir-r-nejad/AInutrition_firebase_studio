'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatValue } from '@/lib/utils';
import { formatDate } from 'date-fns';
import { Activity, Calendar, FileText, Ruler, Scale } from 'lucide-react';
import { BodyProgressEntry } from '../types';
import DeleteProgressButton from './DeleteProgressButton';
import EditProgressButton from './EditProgressButton';

interface ProgressEntriesListProps {
  entries: BodyProgressEntry[];
  selectedMonth: string;
}

export function ProgressEntriesList({
  entries,
  selectedMonth,
}: ProgressEntriesListProps) {
  const monthLabel = formatDate(new Date(selectedMonth), 'MMMM dd, yyyy');
  const sortedEntries = entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (entries.length === 0) {
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

  return (
    <Card className='shadow-lg'>
      <CardHeader>
        <CardTitle className='text-xl flex items-center gap-2 text-primary'>
          <FileText className='h-5 w-5' />
          Progress Entries - {monthLabel}
          <Badge variant='secondary' className='ml-auto'>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {sortedEntries.map((entry) => (
            <Card
              key={entry.id}
              className='border border-border/50 hover:border-border transition-colors'
            >
              <CardContent className='p-4'>
                <div className='flex items-start justify-between'>
                  <div className='space-y-3 flex-1'>
                    {/* Date Header */}
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4 text-primary' />
                        <span className='font-semibold text-foreground'>
                          {formatDate(
                            new Date(entry.date),
                            'EEEE MMMM dd yyyy'
                          )}
                        </span>
                      </div>

                      <div className='flex items-center gap-1'>
                        <EditProgressButton entry={entry} />
                        <DeleteProgressButton entry={entry} />
                      </div>
                    </div>

                    {/* Measurements Grid */}
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                      <div className='flex flex-col items-start p-3 bg-primary/5 rounded-lg'>
                        <div className='flex items-center gap-2'>
                          <Scale className='h-4 w-4 text-primary' />
                          <p className='text-sm text-muted-foreground'>
                            Weight
                          </p>
                        </div>
                        <p className='font-semibold text-foreground'>
                          {formatValue(entry.weight_kg, ' kg')}
                        </p>
                      </div>

                      <div className='flex flex-col items-start p-3 bg-chart-2/10 rounded-lg'>
                        <div className='flex items-center gap-2'>
                          <Activity className='h-4 w-4 text-primary' />
                          <p className='text-sm text-muted-foreground'>
                            Body Fat
                          </p>
                        </div>
                        <p className='font-semibold text-foreground'>
                          {formatValue(entry.bf_percentage, '%')}
                        </p>
                      </div>

                      <div className='flex flex-col items-start p-3 bg-chart-3/10 rounded-lg'>
                        <div className='flex items-center gap-2'>
                          <Ruler className='h-4 w-4 text-chart-3' />
                          <p className='text-sm text-muted-foreground'>Waist</p>
                        </div>
                        <p className='font-semibold text-foreground'>
                          {formatValue(entry.waist_cm, ' cm')}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {entry.notes && (
                      <div className='p-3 bg-muted/50 rounded-lg'>
                        <p className='text-sm text-muted-foreground mb-1'>
                          Notes:
                        </p>
                        <p className='text-sm text-foreground'>
                          &quot;{entry.notes}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
