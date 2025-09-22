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
    if (authorType === 'admin') return 'BG';
    return authorName.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';
  };

  const isSubmitDisabled = !content.trim() || content.length > 2000 || loading;

  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={authorAvatar || ''} alt={authorName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {getAuthorInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">
              Crear nueva publicación
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {authorName}
              </span>
              {authorNickname && (
                <span className="text-sm text-muted-foreground">
                  "{authorNickname}"
                </span>
              )}
              {authorType === 'admin' && (
                <Badge variant="secondary" className="text-xs">
                  Oficial
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content textarea */}
          <div className="space-y-2">
            <Textarea
              placeholder="¿Qué está pasando?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none border-border/50 focus:border-primary"
              maxLength={2000}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{content.length}/2000 caracteres</span>
              {content.length > 1900 && (
                <span className="text-yellow-500">
                  {2000 - content.length} caracteres restantes
                </span>
              )}
            </div>
          </div>

          {/* Media URLs */}
          {mediaUrls.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Imágenes:</h4>
              <div className="grid grid-cols-1 gap-2">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                      <span className="text-sm text-muted-foreground truncate flex-1 mr-2">
                        {url}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImageUrl(index)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    {/* Image preview */}
                    <div className="mt-2">
                      <img
                        src={url}
                        alt="Preview"
                        className="w-full max-h-48 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add image URL */}
          {showImageInput ? (
            <div className="flex space-x-2">
              <Input
                placeholder="URL de la imagen"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addImageUrl}
                size="sm"
                disabled={!newImageUrl.trim()}
              >
                Agregar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowImageInput(false);
                  setNewImageUrl('');
                }}
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImageInput(true)}
              className="w-full"
            >
              <Image className="h-4 w-4 mr-2" />
              Agregar imagen
            </Button>
          )}

          {/* Submit button */}
          <div className="flex justify-end pt-4 border-t border-border/50">
            <Button
              type="submit"
              disabled={isSubmitDisabled}
              className="min-w-[120px]"
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
      </CardContent>
    </Card>
  );
}