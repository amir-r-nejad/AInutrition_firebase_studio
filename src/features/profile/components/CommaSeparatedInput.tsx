import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Control, FieldPath, FieldValues } from 'react-hook-form';

type CommaSeparatedInputProps<T extends FieldValues> = {
  fieldName: FieldPath<T>;
  label: string;
  placeholder: string;
  control: Control<T>;
};

function CommaSeparatedInput<T extends FieldValues>({
  fieldName,
  label,
  placeholder,
  control,
}: CommaSeparatedInputProps<T>) {
  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => {
        const displayValue = Array.isArray(field.value)
          ? field.value.join(',')
          : field.value || '';
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div>
                <Textarea
                  placeholder={placeholder}
                  value={displayValue}
                  onChange={(e) => field.onChange(e.target.value.split(','))}
                  className='h-10 resize-none'
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export default CommaSeparatedInput;
