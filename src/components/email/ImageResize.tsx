import { NodeViewWrapper } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Trash2, Settings, Maximize2 } from 'lucide-react';

export default function ImageResize({ node, updateAttributes, deleteNode, selected }: any) {
  const [isResizing, setIsResizing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);

  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      setAspectRatio(imageRef.current.naturalWidth / imageRef.current.naturalHeight);
    }
  }, [node.attrs.src]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setAspectRatio(imageRef.current.naturalWidth / imageRef.current.naturalHeight);
      if (!node.attrs.width && !node.attrs.height) {
        updateAttributes({
          width: imageRef.current.naturalWidth,
          height: imageRef.current.naturalHeight,
        });
      }
    }
  };

  const startResize = (e: React.MouseEvent, corner: 'se' | 'sw' | 'ne' | 'nw') => {
    e.preventDefault();
    setIsResizing(true);

    const currentWidth = node.attrs.width || imageRef.current?.offsetWidth || 300;
    const currentHeight = node.attrs.height || imageRef.current?.offsetHeight || 200;

    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: currentWidth,
      startHeight: currentHeight,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeRef.current) return;
      const deltaX = moveEvent.clientX - resizeRef.current.startX;
      let newWidth: number;

      switch (corner) {
        case 'se': case 'ne':
          newWidth = resizeRef.current.startWidth + deltaX;
          break;
        case 'sw': case 'nw':
          newWidth = resizeRef.current.startWidth - deltaX;
          break;
      }

      const newHeight = newWidth! / aspectRatio;
      updateAttributes({
        width: Math.round(Math.max(100, Math.min(800, newWidth!))),
        height: Math.round(Math.max(100, Math.min(800, newHeight))),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const resetSize = () => {
    if (imageRef.current) {
      updateAttributes({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  };

  const setSize = (width: number, height?: number) => {
    updateAttributes({
      width,
      height: Math.round(height || width / aspectRatio),
    });
  };

  return (
    <NodeViewWrapper className="image-resizer inline-block relative group my-4">
      <div
        className={`relative inline-block ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
        style={{ width: node.attrs.width || 'auto', height: node.attrs.height || 'auto' }}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          className={`max-w-full h-auto ${isResizing ? 'pointer-events-none' : ''}`}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onLoad={handleImageLoad}
          draggable={false}
        />

        {selected && (
          <>
            <div className="absolute -top-12 left-0 flex items-center gap-2 bg-background border rounded-lg shadow-lg p-1 z-50">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Dimensiones</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="img-width" className="text-xs">Ancho</Label>
                          <Input id="img-width" type="number" value={node.attrs.width || ''} onChange={(e) => setSize(parseInt(e.target.value))} className="h-8" />
                        </div>
                        <div>
                          <Label htmlFor="img-height" className="text-xs">Alto</Label>
                          <Input id="img-height" type="number" value={node.attrs.height || ''} onChange={(e) => setSize(node.attrs.width, parseInt(e.target.value))} className="h-8" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Tamaños predefinidos</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSize(300)}>Pequeño</Button>
                        <Button variant="outline" size="sm" onClick={() => setSize(500)}>Mediano</Button>
                        <Button variant="outline" size="sm" onClick={() => setSize(700)}>Grande</Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="img-alt" className="text-xs">Texto alternativo</Label>
                      <Input id="img-alt" type="text" value={node.attrs.alt || ''} onChange={(e) => updateAttributes({ alt: e.target.value })} placeholder="Descripción de la imagen" className="h-8" />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="sm" onClick={resetSize} title="Tamaño original">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteNode()} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Resize handles */}
            {(['se', 'sw', 'ne', 'nw'] as const).map((corner) => (
              <div
                key={corner}
                className={`absolute w-4 h-4 bg-primary rounded-full cursor-${corner}-resize border-2 border-background shadow-lg hover:scale-125 transition-transform z-50
                  ${corner.includes('s') ? '-bottom-2' : '-top-2'}
                  ${corner.includes('e') ? '-right-2' : '-left-2'}`}
                onMouseDown={(e) => startResize(e, corner)}
              />
            ))}

            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-background border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg z-50">
              {node.attrs.width} × {node.attrs.height} px
            </div>
          </>
        )}
      </div>

      {isResizing && (
        <div className="fixed inset-0 cursor-se-resize" style={{ zIndex: 9999 }} />
      )}
    </NodeViewWrapper>
  );
}
