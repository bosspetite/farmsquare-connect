import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';

interface TimelineEvent {
  label: string;
  timestamp?: string;
  completed: boolean;
  current?: boolean;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events, className }) => {
  return (
    <div className={cn('space-y-0', className)}>
      {events.map((event, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                event.completed && 'bg-primary text-primary-foreground',
                event.current && !event.completed && 'bg-primary/20 border-2 border-primary',
                !event.completed && !event.current && 'bg-muted border border-border'
              )}
            >
              {event.completed ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Circle className="w-2 h-2 fill-current" />
              )}
            </div>
            {index < events.length - 1 && (
              <div
                className={cn(
                  'w-0.5 h-8',
                  event.completed ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
          
          <div className="pb-6 -mt-0.5">
            <p
              className={cn(
                'text-sm font-medium',
                event.completed || event.current ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {event.label}
            </p>
            {event.timestamp && (
              <p className="text-xs text-muted-foreground mt-0.5">{event.timestamp}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
