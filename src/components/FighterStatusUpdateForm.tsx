import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Camera, Send, X, ImageIcon, Loader2 } from 'lucide-react';
import { useFighterUpdates } from '@/hooks/useFighterUpdates';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface FighterUpdateFormProps {
  fighterId: string;
  onUpdateCreated?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function FighterUpdateForm({ fighterId, onUpdateCreated }: FighterUpdateFormProps) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createUpdate, loading, uploading } = useFighterUpdates();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    try {
      await createUpdate(
        fighterId,
        { content: content.trim() },
        imageFile || undefined
      );
      
      setContent('');
      removeImage();
      onUpdateCreated?.();
    } catch (error) {
      console.error('Error creating update:', error);
    }
  };

  const characterCount = content.length;
  const maxCharacters = 500;
  const isOverLimit = characterCount > maxCharacters;
  const isSubmitting = loading || uploading;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Publicar Actualización
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="¿Qué está pasando en tu entrenamiento? Comparte una actualización con tus fans..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-24 resize-none"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between text-sm">
              <div className={`text-muted-foreground ${isOverLimit ? 'text-destructive' : ''}`}>
                {characterCount}/{maxCharacters}
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5"
                >
                  <ImageIcon className="h-4 w-4" />
                  Foto
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.setAttribute('capture', 'environment');
                      fileInputRef.current.click();
                      fileInputRef.current.removeAttribute('capture');
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5"
                >
                  <Camera className="h-4 w-4" />
                  Cámara
                </Button>
              </div>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img
                src={imagePreview}
                alt="Vista previa"
                className="w-full max-h-64 object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                onClick={removeImage}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </Button>
              {imageFile && (
                <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded">
                  {(imageFile.size / (1024 * 1024)).toFixed(1)} MB
                </div>
              )}
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Subiendo imagen...
              </div>
              <Progress value={65} className="h-2" />
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim() || isOverLimit}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSubmitting ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
