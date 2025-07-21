import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactNode } from 'react';

type SectionHeaderProps = {
  children?: ReactNode;
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
};

function SectionHeader({
  children,
  description,
  title,
  icon,
  className,
}: SectionHeaderProps) {
  return (
    <CardHeader>
      <div className='flex items-center gap-2'>
        {icon && icon}
        <CardTitle className={className}>{title}</CardTitle>
      </div>

      <CardDescription>{description}</CardDescription>
      {children}
    </CardHeader>
  );
}

export default SectionHeader;
