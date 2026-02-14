import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered,
  Undo, Redo,
  Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Table as TableIcon, Trash2, Eye, Save, Clock, Upload,
} from 'lucide-react';
import ImageResize from './ImageResize';
import { CampaignImageService } from '@/services/emailCampaignService';

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null, renderHTML: (attrs) => ({ width: attrs.width }) },
      height: { default: null, renderHTML: (attrs) => ({ height: attrs.height }) },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageResize);
  },
});

interface EmailTipTapEditorProps {
  campaignId: string;
  initialContent?: string;
  initialJsonContent?: any;
  onSave?: (html: string, json: any) => void;
  onAutoSave?: (html: string, json: any) => void;
}

export function EmailTipTapEditor({
  campaignId,
  initialContent = '',
  initialJsonContent = null,
  onSave,
  onAutoSave,
}: EmailTipTapEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomImage,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialJsonContent || initialContent || '<p>Escribe tu mensaje aquí...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[500px] px-4 py-6',
      },
    },
  });

  // Auto-save with debounce
  const debouncedContent = useDebounce(editor?.getHTML() || '', 2000);

  useEffect(() => {
    if (debouncedContent && editor && onAutoSave) {
      const html = editor.getHTML();
      const json = editor.getJSON();
      onAutoSave(html, json);
      setLastSaved(new Date());
      localStorage.setItem(`email-draft-${campaignId}`, JSON.stringify({
        html, json, timestamp: new Date().toISOString(),
      }));
    }
  }, [debouncedContent]);

  // Restore from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem(`email-draft-${campaignId}`);
    if (savedDraft && !initialContent && !initialJsonContent) {
      try {
        const draft = JSON.parse(savedDraft);
        if (editor && draft.json) {
          editor.commands.setContent(draft.json);
          toast.info('Borrador restaurado', {
            description: `Guardado el ${new Date(draft.timestamp).toLocaleString()}`,
          });
        }
      } catch (error) {
        console.error('Error al restaurar borrador:', error);
      }
    }
  }, [campaignId, editor]);

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      await onSave?.(editor.getHTML(), editor.getJSON());
      setLastSaved(new Date());
      toast.success('Campaña guardada');
      localStorage.removeItem(`email-draft-${campaignId}`);
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = useCallback(async (file: File) => {
    setUploadingImage(true);
    try {
      const image = await CampaignImageService.upload(file, campaignId);
      editor?.chain().focus().setImage({ src: image.public_url || '' }).run();
      setShowImageDialog(false);
      toast.success('Imagen subida');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  }, [campaignId, editor]);

  const handleInsertImageUrl = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageDialog(false);
    }
  };

  if (!editor) return <div className="p-8 text-center text-muted-foreground">Cargando editor...</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant={isPreviewMode ? 'default' : 'outline'} size="sm" onClick={() => setIsPreviewMode(!isPreviewMode)}>
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? 'Editar' : 'Vista Previa'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
            {lastSaved && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Guardado {formatTimeAgo(lastSaved)}
              </div>
            )}
          </div>

          {!isPreviewMode && (
            <>
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-1">
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo className="h-4 w-4" /></Button>
                <Separator orientation="vertical" className="mx-1 h-8" />
                <Button variant={editor.isActive('bold') ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Button>
                <Button variant={editor.isActive('italic') ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Button>
                <Button variant={editor.isActive('underline') ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Button>
                <Button variant={editor.isActive('strike') ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Button>
                <Separator orientation="vertical" className="mx-1 h-8" />
                <Button variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></Button>
                <Button variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Button>
                <Button variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Button>
                <Separator orientation="vertical" className="mx-1 h-8" />
                <Button variant={editor.isActive('bulletList') ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Button>
                <Button variant={editor.isActive('orderedList') ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Button>
                <Separator orientation="vertical" className="mx-1 h-8" />
                <Button variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft className="h-4 w-4" /></Button>
                <Button variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter className="h-4 w-4" /></Button>
                <Button variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight className="h-4 w-4" /></Button>
                <Button variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustify className="h-4 w-4" /></Button>
                <Separator orientation="vertical" className="mx-1 h-8" />

                {/* Image dialog */}
                <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm"><ImageIcon className="h-4 w-4" /></Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Insertar Imagen</DialogTitle>
                      <DialogDescription>Sube una imagen o ingresa una URL</DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="upload">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload">Subir</TabsTrigger>
                        <TabsTrigger value="url">URL</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="space-y-4">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8">
                          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                          <Button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                            {uploadingImage ? 'Subiendo...' : 'Seleccionar Imagen'}
                          </Button>
                        </div>
                      </TabsContent>
                      <TabsContent value="url" className="space-y-4">
                        <div>
                          <Label htmlFor="image-url">URL de la Imagen</Label>
                          <Input id="image-url" type="url" placeholder="https://ejemplo.com/imagen.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                        </div>
                        <Button onClick={handleInsertImageUrl} className="w-full">Insertar Imagen</Button>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>

                {/* Table */}
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                  <TableIcon className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Editor / Preview */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          {isPreviewMode ? (
            <div className="h-full overflow-auto">
              <div className="max-w-3xl mx-auto p-8">
                <div className="email-preview" dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <EditorContent editor={editor} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'hace unos segundos';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`;
  return `hace ${Math.floor(seconds / 86400)}d`;
}
