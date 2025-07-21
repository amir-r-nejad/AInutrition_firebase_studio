import { AlertTriangle, Utensils } from 'lucide-react';

type StatusMessageProps = {
  error: string | null;
  isEmpty: boolean;
};

function EmptyStateMessage({ error, isEmpty }: StatusMessageProps) {
  return (
    <>
      {error && (
        <p className='text-destructive text-center py-4'>
          <AlertTriangle className='inline mr-2' /> {error}
        </p>
      )}

      {isEmpty && !error && (
        <div className='text-center py-10 text-muted-foreground col-span-2'>
          <Utensils className='mx-auto h-12 w-12 mb-4' />
          <p className='text-lg'>
            Your AI-generated meal plan will appear here.
          </p>
          <p>Click &quot;Generate New Plan&quot; to get started!</p>
        </div>
      )}
    </>
  );
}

export default EmptyStateMessage;
