import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ReactNode } from 'react';

type ItemProps = {
  value: string;
  label: string;
  children: ReactNode;
};

function ProfileAccordionItem({ value, label, children }: ItemProps) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className='text-xl font-semibold'>
        {label}
      </AccordionTrigger>
      <AccordionContent className='space-y-6 pt-4 px-1'>
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

export default ProfileAccordionItem;
