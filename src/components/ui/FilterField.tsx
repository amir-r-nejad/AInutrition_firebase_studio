import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQueryParams } from '@/hooks/useQueryParams';
import { LucideProps } from 'lucide-react';
import { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';

type FilterFieldProps = {
  placeholder?: string;
  icon?: ReactNode;
  label: string;
  queryName: string;
  options: {
    value: string;
    label: string;
    icon?: ForwardRefExoticComponent<
      Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
    >;
  }[];
};

function FilterField({
  options,
  icon,
  label,
  queryName,
  placeholder,
}: FilterFieldProps) {
  const { getQueryParams, updateQueryParams } = useQueryParams();

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium text-foreground flex items-center gap-2'>
        {icon && icon}
        {label}
      </label>
      <Select
        value={getQueryParams(queryName) || undefined}
        onValueChange={(value) => updateQueryParams(queryName, value)}
      >
        <SelectTrigger className='bg-background'>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className='flex items-center gap-2'>
                {option.icon && <option.icon className='h-4 w-4' />}
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default FilterField;
