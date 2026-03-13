import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, UserPlus, Heart, MessageCircle, Newspaper, Info, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Notification } from '@/hooks/useNotifications';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const iconMap = {
  friend_request: UserPlus,
  friend_accepted: UserPlus,
  post_like: Heart,
  post_comment: MessageCircle,
  news: Newspaper,
  system: Info,
};

const colorMap = {
  friend_request: 'text-fighter-info',
  friend_accepted: 'text-fighter-success',
  post_like: 'text-fighter-danger',
  post_comment: 'text-primary',
  news: 'text-fighter-warning',
  system: 'text-muted-foreground',
};

export const NotificationCard = ({ notification, onMarkAsRead, onDelete }: NotificationCardProps) => {
  const Icon = iconMap[notification.type] || Bell;
  const iconColor = colorMap[notification.type] || 'text-muted-foreground';
  
  // Check if notification has redirect action
  const redirectPath = notification.data?.redirect;
  const hasAction = notification.data?.action === 'update_discipline';

  return (
    <Card 
      className={`p-4 transition-colors ${
        notification.read 
          ? 'bg-background' 
          : 'bg-accent/20 border-l-4 border-l-primary'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
              {notification.title}
            </h4>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(notification.created_at), { 
                addSuffix: true,
                locale: es 
              })}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 pt-2">
            {hasAction && redirectPath && (
              <Button
                variant="default"
                size="sm"
                asChild
                className="text-xs"
              >
                <a href={redirectPath}>Actualizar ahora</a>
              </Button>
            )}
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs"
              >
                Marcar como leída
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(notification.id)}
              className="text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
