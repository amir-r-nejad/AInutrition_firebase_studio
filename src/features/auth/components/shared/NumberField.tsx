'use client';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

type NumberFiledProps<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  placeholder: string;
  description?: string;
  step: string;
  control: Control<T>;
};

function NumberField<T extends FieldValues>({
  name,
  label,
  placeholder,
  description,
  step = '1',
  control,
}: NumberFiledProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div>
              <Input
                type='number'
                placeholder={placeholder}
                {...field}
                value={
                  field.value === undefined ||
                  field.value === null ||
                  isNaN(Number(field.value))
                    ? ''
                    : String(field.value)
                }
                onChange={(e) =>
                  field.onChange(
                    e.target.value === ''
                      ? undefined
                      : parseFloat(e.target.value)
                  )
                }
                step={step}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default NumberField;
