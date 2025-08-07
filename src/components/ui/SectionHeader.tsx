import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactNode } from 'react';

type SectionHeaderProps = {
  children?: ReactNode;
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  headerClassName?: string;
};

function SectionHeader({
  children,
  description,
  title,
  icon,
  className,
  headerClassName,
}: SectionHeaderProps) {
  return (
    <CardHeader className={headerClassName}>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-2'>
          {icon && icon}
          <CardTitle className={className}>{title}</CardTitle>
        </div>

        {description && (
          <CardDescription className='text-sm text-muted-foreground'>
            {description}
          </CardDescription>
        )}
      </div>

      {children}
    </CardHeader>
  );
}

export default SectionHeader;
