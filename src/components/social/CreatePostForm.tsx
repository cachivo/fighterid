import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image, X, Plus, Loader2 } from 'lucide-react';
import { CreatePostData } from '@/hooks/useSocialPosts';

interface CreatePostFormProps {
  onSubmit: (data: CreatePostData) => Promise<void>;
  authorName: string;
  authorNickname?: string;
  authorAvatar?: string;
  authorType: 'fighter' | 'admin';
  loading?: boolean;
}

export default function CreatePostForm({ 
  onSubmit, 
  authorName, 
  authorNickname, 
  authorAvatar, 
  authorType,
  loading = false 
}: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    const postData: CreatePostData = {
      content: content.trim(),
      media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
      post_type: mediaUrls.length > 0 ? 'image' : 'text'
    };

    await onSubmit(postData);
    
    // Reset form
    setContent('');
    setMediaUrls([]);
    setNewImageUrl('');
    setShowImageInput(false);
  };

  const addImageUrl = () => {
    if (newImageUrl.trim() && !mediaUrls.includes(newImageUrl.trim())) {
      setMediaUrls([...mediaUrls, newImageUrl.trim()]);
      setNewImageUrl('');
      setShowImageInput(false);
    }
  };

  const removeImageUrl = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const getAuthorInitials = () => {
    return authorName.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';
  };

  const isSubmitDisabled = !content.trim() || content.length > 2000 || loading;

  return (
    <div className="space-y-4">
      {/* Author info */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={authorAvatar || ''} alt={authorName} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
            {getAuthorInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{authorName}</span>
          {authorNickname && (
            <span className="text-sm text-muted-foreground">"{authorNickname}"</span>
          )}
          {authorType === 'admin' && (
            <Badge variant="secondary" className="text-xs">Oficial</Badge>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Content textarea */}
        <div className="space-y-2">
          <Textarea
            placeholder="¿Qué está pasando en tu entrenamiento?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none border-0 bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 p-0"
            maxLength={2000}
          />
          {content.length > 0 && (
            <div className="text-xs text-muted-foreground text-right">
              {content.length}/2000
            </div>
          )}
        </div>

        {/* Media URLs */}
        {mediaUrls.length > 0 && (
          <div className="space-y-3">
            {mediaUrls.map((url, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden border border-border/50">
                <img
                  src={url}
                  alt="Preview"
                  className="w-full max-h-64 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImageUrl(index)}
                  className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add image URL */}
        {showImageInput && (
          <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
            <Input
              placeholder="URL de la imagen"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0"
            />
            <Button
              type="button"
              onClick={addImageUrl}
              size="sm"
              disabled={!newImageUrl.trim()}
              variant="ghost"
            >
              Agregar
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowImageInput(false);
                setNewImageUrl('');
              }}
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowImageInput(true)}
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Image className="h-4 w-4 mr-2" />
            Foto
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            size="sm"
            className="px-6"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}