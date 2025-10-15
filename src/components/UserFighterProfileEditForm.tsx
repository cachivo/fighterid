import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FighterProfile } from '@/hooks/useFighterProfiles';
import { Upload, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { uploadFighterAvatar } from '@/lib/photoUtils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const fighterProfileSchema = z.object({
  first_name: z.string().min(1, 'Nombre es requerido').max(50, 'Máximo 50 caracteres'),
  last_name: z.string().min(1, 'Apellido es requerido').max(50, 'Máximo 50 caracteres'),
  nickname: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  birthdate: z.string().optional().or(z.literal('')),
  birthplace: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  document_type: z.string().optional().or(z.literal('')),
  document_number: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  blood_type: z.string().optional().or(z.literal('')),
  weight_class: z.string().optional().or(z.literal('')),
  height_cm: z.string().optional().or(z.literal('')),
  weight_kg: z.string().optional().or(z.literal('')),
  reach_cm: z.string().optional().or(z.literal('')),
  stance: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  fighting_style: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  gym_name: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  level: z.string().optional().or(z.literal('')),
  record_wins: z.string().optional().or(z.literal('')),
  record_losses: z.string().optional().or(z.literal('')),
  record_draws: z.string().optional().or(z.literal('')),
  record_type: z.string().optional().or(z.literal('')),
  bio: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  emergency_contact_name: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  emergency_contact_phone: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  emergency_contact_relation: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  medical_conditions: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  medical_allergies: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  insurance_company: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  insurance_policy: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  boxrec_url: z.string().url('URL inválida').optional().or(z.literal('')),
  tapology_url: z.string().url('URL inválida').optional().or(z.literal(''))
});

type FighterProfileFormData = z.infer<typeof fighterProfileSchema>;

interface UserFighterProfileEditFormProps {
  profile: FighterProfile;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UserFighterProfileEditForm({ profile, onSuccess, onCancel }: UserFighterProfileEditFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<FighterProfileFormData>({
    resolver: zodResolver(fighterProfileSchema),
    defaultValues: {
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      nickname: profile.nickname || '',
      gender: profile.gender || '',
      country: profile.country || 'HN',
      birthdate: profile.birthdate || '',
      birthplace: profile.birthplace || '',
      document_type: profile.document_type || '',
      document_number: profile.document_number || '',
      blood_type: profile.blood_type || '',
      weight_class: profile.weight_class || '',
      height_cm: profile.height_cm ? profile.height_cm.toString() : '',
      weight_kg: profile.weight_kg ? profile.weight_kg.toString() : '',
      reach_cm: profile.reach_cm ? profile.reach_cm.toString() : '',
      stance: profile.stance || '',
      fighting_style: profile.fighting_style || '',
      gym_name: profile.gym_name || '',
      level: profile.level || '',
      record_wins: profile.record_wins ? profile.record_wins.toString() : '0',
      record_losses: profile.record_losses ? profile.record_losses.toString() : '0',
      record_draws: profile.record_draws ? profile.record_draws.toString() : '0',
      record_type: profile.record_type || 'Amateur',
      bio: profile.bio || '',
      emergency_contact_name: profile.emergency_contact_name || '',
      emergency_contact_phone: profile.emergency_contact_phone || '',
      emergency_contact_relation: profile.emergency_contact_relation || '',
      medical_conditions: profile.medical_conditions || '',
      medical_allergies: profile.medical_allergies || '',
      insurance_company: profile.insurance_company || '',
      insurance_policy: profile.insurance_policy || '',
      boxrec_url: profile.boxrec_url || '',
      tapology_url: profile.tapology_url || ''
    }
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "La imagen no puede superar los 5MB",
          variant: "destructive",
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FighterProfileFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Campos que se pueden actualizar directamente (sin aprobación)
      const directUpdateFields = ['bio', 'boxrec_url', 'tapology_url'];
      
      // Campos que requieren aprobación admin
      const criticalFields = [
        'first_name', 'last_name', 'nickname', 'country', 'birthdate', 'birthplace',
        'height_cm', 'weight_kg', 'reach_cm', 'weight_class', 'fighting_style', 
        'stance', 'gender', 'gym_name', 'martial_arts',
        'document_type', 'document_number', 'blood_type',
        'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
        'medical_conditions', 'medical_allergies', 
        'insurance_company', 'insurance_policy'
      ];

      // Separar cambios directos de cambios que requieren aprobación
      const directUpdates: any = {};
      const requestedChanges: any = {};
      let hasAvatarChange = false;

      Object.entries(data).forEach(([key, value]) => {
        if (value !== profile[key as keyof typeof profile]) {
          if (directUpdateFields.includes(key)) {
            directUpdates[key] = value;
          } else if (criticalFields.includes(key)) {
            requestedChanges[key] = value;
          }
        }
      });

      // Manejar avatar por separado
      if (avatarFile) {
        hasAvatarChange = true;
        console.log("Avatar change detected, will be included in change request");
        
        const newAvatarUrl = await uploadFighterAvatar(avatarFile, user.id, profile.id, profile.avatar_url);
        requestedChanges.avatar_url = newAvatarUrl;
      }

      // Aplicar actualizaciones directas si las hay
      if (Object.keys(directUpdates).length > 0) {
        const { error: directError } = await supabase
          .from('fighter_profiles')
          .update(directUpdates)
          .eq('id', profile.id);

        if (directError) {
          console.error("Direct update error:", directError);
          throw directError;
        }
      }

      // Crear solicitud de cambio si hay campos críticos modificados
      if (Object.keys(requestedChanges).length > 0 || hasAvatarChange) {
        // Validar los cambios antes de crear la solicitud
        const { data: validation } = await supabase.rpc('validate_profile_change_request', {
          p_fighter_id: profile.id,
          p_requested_changes: requestedChanges
        });

        const validationResult = validation as { valid: boolean; error?: string; field?: string } | null;

        if (validationResult && !validationResult.valid) {
          toast({
            variant: "destructive",
            title: "Error de validación",
            description: validationResult.error
          });
          return;
        }

        // Convertir valores numéricos
        if (requestedChanges.height_cm) requestedChanges.height_cm = Number(requestedChanges.height_cm);
        if (requestedChanges.weight_kg) requestedChanges.weight_kg = Number(requestedChanges.weight_kg);
        if (requestedChanges.reach_cm) requestedChanges.reach_cm = Number(requestedChanges.reach_cm);

        // CRÍTICO: profile_change_requests.user_id es FK a app_user.id (no auth.uid())
        // Obtener app_user.id antes de insertar
        const { data: appUser, error: userError } = await supabase
          .from('app_user')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (userError || !appUser) {
          console.error("User lookup error:", userError);
          toast({
            variant: "destructive",
            title: "Error de autenticación",
            description: "No se pudo identificar tu usuario. Por favor, vuelve a iniciar sesión."
          });
          return;
        }

        const { error: requestError } = await supabase
          .from('profile_change_requests')
          .insert({
            fighter_profile_id: profile.id,
            user_id: appUser.id, // Usar app_user.id, NO auth.uid()
            requested_changes: requestedChanges,
            status: 'PENDING'
          });

        if (requestError) {
          console.error("Change request error:", requestError);
          throw requestError;
        }

        toast({
          title: "Solicitud enviada",
          description: "Los cambios críticos serán revisados por un administrador. Los cambios no críticos se aplicaron inmediatamente."
        });
      } else if (Object.keys(directUpdates).length > 0) {
        toast({
          title: "Perfil actualizado",
          description: "Los cambios se han guardado exitosamente"
        });
      } else {
        toast({
          title: "Sin cambios",
          description: "No se detectaron modificaciones en el perfil"
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la actualización",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={avatarPreview || profile.avatar_url || '/placeholder-avatar.png'}
                    alt="Avatar"
                    className="h-24 w-24 rounded-xl object-cover border-2 border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      <Upload className="h-4 w-4" />
                      Cambiar Foto
                    </div>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Máximo 5MB. Formatos: JPG, PNG, WebP
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apodo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Nacimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthplace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lugar de Nacimiento</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ciudad, País" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="document_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Documento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DNI">DNI</SelectItem>
                          <SelectItem value="Cédula">Cédula</SelectItem>
                          <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                          <SelectItem value="Licencia">Licencia</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="document_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Documento</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="blood_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Sangre</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Género</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar género" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Femenino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="HN" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Información Física */}
          <Card>
            <CardHeader>
              <CardTitle>Información Física</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="height_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reach_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alcance (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="stance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postura</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar postura" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Orthodox">Orthodox</SelectItem>
                          <SelectItem value="Southpaw">Southpaw</SelectItem>
                          <SelectItem value="Switch">Switch</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fighting_style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estilo de Pelea</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ej: Striker, Grappler" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gym_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gimnasio/Academia</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Información de Combate */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Combate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight_class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría de Peso</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Strawweight">Strawweight</SelectItem>
                          <SelectItem value="Flyweight">Flyweight</SelectItem>
                          <SelectItem value="Bantamweight">Bantamweight</SelectItem>
                          <SelectItem value="Featherweight">Featherweight</SelectItem>
                          <SelectItem value="Lightweight">Lightweight</SelectItem>
                          <SelectItem value="Welterweight">Welterweight</SelectItem>
                          <SelectItem value="Middleweight">Middleweight</SelectItem>
                          <SelectItem value="Light Heavyweight">Light Heavyweight</SelectItem>
                          <SelectItem value="Heavyweight">Heavyweight</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar nivel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AMATEUR">Amateur</SelectItem>
                          <SelectItem value="SEMI_PRO">Semi-Profesional</SelectItem>
                          <SelectItem value="PROFESSIONAL">Profesional</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <Label className="text-base font-semibold">Récord de Peleas</Label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                  <FormField
                    control={form.control}
                    name="record_wins"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Victorias</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="record_losses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Derrotas</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="record_draws"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empates</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="record_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Amateur">Amateur</SelectItem>
                            <SelectItem value="Profesional">Profesional</SelectItem>
                            <SelectItem value="Mixto">Mixto</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografía</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="Cuéntanos sobre tu trayectoria en las artes marciales..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contacto de Emergencia */}
          <Card>
            <CardHeader>
              <CardTitle>Contacto de Emergencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="emergency_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_contact_relation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relación</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ej: Padre, Madre, Hermano" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Información Médica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Médica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="medical_conditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condiciones Médicas</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe cualquier condición médica relevante" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medical_allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alergias</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe cualquier alergia conocida" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="insurance_company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compañía de Seguro</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="insurance_policy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Póliza</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Enlaces de Perfil Deportivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="boxrec_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de BoxRec</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://boxrec.com/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tapology_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de Tapology</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://tapology.com/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}