'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQueryParams } from '@/hooks/useQueryParams';
import { format } from 'date-fns';
import {
  Calendar,
  ExternalLink,
  Mail,
  Mars,
  Transgender,
  Venus,
} from 'lucide-react';
import Link from 'next/link';
import NoClientsCard from './NoClientsCard';

type ClientData = {
  user_id: string;
  full_name: string;
  email?: string;
  age: number;
  biological_sex: string;
  primary_diet_goal: string;
  created_at: string;
  avatar_url?: string;
  client_id?: string;
};

type SortField = 'created_at' | 'full_name' | 'age';

function ClientsList({ clients }: { clients: ClientData[] }) {
  const { getQueryParams } = useQueryParams();

  const searchedName = getQueryParams('client_name');
  const selectedGender = getQueryParams('biological_sex');
  const selectedDietGoal = getQueryParams('diet_goal');
  const sortBy = getQueryParams('sort_by') || 'created_at-desc';

  const searchedClients = searchedName
    ? clients.filter((client) =>
        client.full_name.toLowerCase().includes(searchedName.toLowerCase())
      )
    : clients;

  const filterClientsByGender =
    selectedGender && selectedGender !== 'all'
      ? searchedClients.filter(
          (client) => client.biological_sex === selectedGender
        )
      : searchedClients;

  const filterClientsByDietGoal =
    selectedDietGoal && selectedDietGoal !== 'all'
      ? filterClientsByGender.filter(
          (client) => client.primary_diet_goal === selectedDietGoal
        )
      : filterClientsByGender;

  const [field, direction] = sortBy.split('-') as [SortField, 'asc' | 'desc'];
  const modifier = direction === 'asc' ? 1 : -1;
  const sortedClients = filterClientsByDietGoal.sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];

    if (typeof aValue === 'number' && typeof bValue === 'number')
      return (aValue - bValue) * modifier;

    return aValue.toString().localeCompare(bValue.toString()) * modifier;
  });

  if (sortedClients.length === 0) return <NoClientsCard />;

  return (
    <div className='space-y-4'>
      {sortedClients.map((client) => (
        <Card
          key={client.user_id}
          className='border border-border/50 hover:border-border/80 transition-all duration-200'
        >
          <CardContent className='p-6'>
            <div className='flex flex-col lg:flex-row gap-6 lg:items-center justify-between'>
              <div className='flex items-start gap-4 flex-1'>
                <div className='relative'>
                  <Avatar className='size-14 ring-2 ring-border/50'>
                    <AvatarImage
                      src={client?.avatar_url || '/placeholder.svg'}
                    />
                    <AvatarFallback className='bg-primary/10 text-primary font-semibold text-lg'>
                      {client.full_name
                        ? client.full_name?.split(' ').map((name) => name.at(0))
                        : client?.email?.split('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className='space-y-3 flex-1'>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-3 flex-wrap'>
                      <h4 className='font-semibold text-lg text-primary transition-colors'>
                        {client.full_name}
                      </h4>
                      <div className='flex items-center gap-2'>
                        <Badge variant='outline' className='text-xs'>
                          {client.biological_sex === 'male' && (
                            <Mars className='size-3' />
                          )}
                          {client.biological_sex === 'female' && (
                            <Venus className='size-3' />
                          )}
                          {client.biological_sex === 'other' && (
                            <Transgender className='size-3' />
                          )}{' '}
                          {client.biological_sex}
                        </Badge>
                        <Badge variant='outline' className='text-xs'>
                          {client.age} years
                        </Badge>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Mail className='h-4 w-4' />
                      <span>{client.email || 'No email provided'}</span>
                    </div>
                  </div>

                  <div className='flex items-center gap-4 flex-wrap'>
                    <Badge variant='secondary'>
                      {client.primary_diet_goal.split('_').join(' ')}
                    </Badge>

                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <Calendar className='h-3 w-3' />
                      <span>
                        Joined{' '}
                        {format(new Date(client.created_at), 'MMMM dd yy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href={`/coach-dashboard/clients/${
                  client.client_id || client.user_id
                }`}
                className='flex-1 lg:flex-none'
              >
                <Button className='w-full'>
                  <ExternalLink className='h-4 w-4' />
                  View Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default ClientsList;
