'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import FilterField from '@/components/ui/FilterField';
import SearchForm from '@/components/ui/SearchForm';
import { useQueryParams } from '@/hooks/useQueryParams';
import { ArrowUpDown, FilterIcon, Target, Users, X } from 'lucide-react';
import { useState } from 'react';
import {
  biologicalSexOptions,
  dietGoalOptions,
  sortOptions,
} from '../../lib/constant';

export function ClientsFilterSection() {
  const [showFilters, setShowFilters] = useState(false);
  const { removeQueryParams, getQueryParams } = useQueryParams();

  const biologicalSex = getQueryParams('biological_sex');
  const dietGoal = getQueryParams('diet_goal');

  const isActiveFilters = !!dietGoal || !!biologicalSex;

  function clearFilters() {
    removeQueryParams([
      'client_name',
      'biological_sex',
      'diet_goal',
      'sort_by',
    ]);
  }

  return (
    <Card className='border border-border/50 shadow-sm'>
      <CardContent className='p-6'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <SearchForm
            searchQuery='client_name'
            className='flex-1'
            placeholder='Search clients by name or email...'
            inputClassName='bg-background'
          />

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className='h-4 w-4' />
              Filters
            </Button>

            {isActiveFilters && (
              <Button variant='ghost' size='sm' onClick={clearFilters}>
                <X className='h-4 w-4' />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className='border-t border-border/50 pt-4 space-y-4 mt-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              <FilterField
                options={biologicalSexOptions}
                label='Gender'
                icon={<Users className='h-4 w-4' />}
                queryName='biological_sex'
                placeholder='Select gender'
              />

              <FilterField
                options={dietGoalOptions}
                label='Diet Goal'
                icon={<Target className='h-4 w-4' />}
                queryName='diet_goal'
                placeholder='Select goal'
              />

              <FilterField
                options={sortOptions}
                label='Sort By'
                icon={<ArrowUpDown className='h-4 w-4' />}
                queryName='sort_by'
                placeholder='Sort by'
              />

              <div className='flex flex-wrap items-center gap-2 self-end'>
                {biologicalSex && (
                  <Badge variant='outline' className='gap-1'>
                    Gender:{' '}
                    {
                      biologicalSexOptions.find(
                        (opt) => opt.value === biologicalSex
                      )?.label
                    }
                    <X
                      className='h-3 w-3 cursor-pointer hover:text-destructive'
                      onClick={() => removeQueryParams('biological_sex')}
                    />
                  </Badge>
                )}
                {dietGoal && (
                  <Badge variant='outline' className='gap-1'>
                    Goal:{' '}
                    {
                      dietGoalOptions.find((opt) => opt.value === dietGoal)
                        ?.label
                    }
                    <X
                      className='h-3 w-3 cursor-pointer hover:text-destructive'
                      onClick={() => removeQueryParams('diet_goal')}
                    />
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
