
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from './card';

interface PageLoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function PageLoadingSpinner({ 
  message = 'Loading...', 
  size = 'md' 
}: PageLoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
