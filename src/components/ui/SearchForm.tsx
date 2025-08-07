import { Input } from '@/components/ui/input';
import { useQueryParams } from '@/hooks/useQueryParams';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { ComponentPropsWithoutRef, FormEvent } from 'react';

type SearchFormProps = {
  searchQuery: string;
  placeholder: string;
  inputClassName?: string;
} & ComponentPropsWithoutRef<'form'>;

function SearchForm({
  searchQuery,
  placeholder,
  inputClassName,
  className,
  ...props
}: SearchFormProps) {
  const { updateQueryParams } = useQueryParams();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const query = formData.get('query') as string;

    e.currentTarget.reset();
    updateQueryParams(searchQuery, query);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative', className)}
      {...props}
    >
      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4' />
      <Input
        name='query'
        placeholder={placeholder}
        className={cn('pl-10', inputClassName)}
      />
    </form>
  );
}

export default SearchForm;
