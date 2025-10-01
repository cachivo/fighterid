import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText } from 'lucide-react';
import type { DopingTestType } from '@/hooks/useDopingTests';

interface DopingTestUploadFormProps {
  onUpload: (file: File, data: {
    test_type: DopingTestType;
    test_date: string;
    testing_agency: string;
    notes?: string;
  }) => Promise<void>;
  uploading: boolean;
}

export function DopingTestUploadForm({ onUpload, uploading }: DopingTestUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [testType, setTestType] = useState<DopingTestType>('ANNUAL');
  const [testDate, setTestDate] = useState('');
  const [testingAgency, setTestingAgency] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !testDate || !testingAgency) return;

    await onUpload(file, {
      test_type: testType,
      test_date: testDate,
      testing_agency: testingAgency,
      notes: notes || undefined,
    });

    // Reset form
    setFile(null);
    setTestDate('');
    setTestingAgency('');
    setNotes('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Subir Reporte de Dopaje
        </CardTitle>
        <CardDescription>
          Sube un nuevo reporte de prueba antidopaje. Los formatos aceptados son PDF, JPG y PNG (máx. 10MB).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-type">Tipo de Prueba *</Label>
            <Select value={testType} onValueChange={(value) => setTestType(value as DopingTestType)}>
              <SelectTrigger id="test-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANNUAL">Anual</SelectItem>
                <SelectItem value="PRE_FIGHT">Pre-Pelea</SelectItem>
                <SelectItem value="POST_FIGHT">Post-Pelea</SelectItem>
                <SelectItem value="RANDOM">Aleatorio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-date">Fecha de la Prueba *</Label>
            <Input
              id="test-date"
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testing-agency">Agencia de Pruebas *</Label>
            <Input
              id="testing-agency"
              type="text"
              value={testingAgency}
              onChange={(e) => setTestingAgency(e.target.value)}
              placeholder="Ej: WADA, USADA, VADA, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Información adicional sobre la prueba..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Documento de Reporte *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="cursor-pointer"
              />
              {file && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos: PDF, JPG, PNG. Tamaño máximo: 10MB
            </p>
          </div>

          <Button type="submit" disabled={uploading || !file} className="w-full">
            {uploading ? 'Subiendo...' : 'Subir Reporte'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
