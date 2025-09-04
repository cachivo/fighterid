import { useState, useEffect } from 'react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Award, Upload, FileText } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';

export default function LicenseOnboarding() {
  const { user, refreshLicense } = useLicenseAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    country: 'HN',
    weightClass: '',
    heightCm: '',
    weightKg: '',
    discipline: 'MMA' as const,
    fightingStyle: '',
    bio: '',
    phone: ''
  });

  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [fighterPhoto, setFighterPhoto] = useState<File | null>(null);
  const [identityPreview, setIdentityPreview] = useState<string | null>(null);
  const [fighterPhotoPreview, setFighterPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const weightClasses = [
    'Strawweight', 'Flyweight', 'Bantamweight', 'Featherweight',
    'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight'
  ];

  // Check if user already has a profile
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return;

      try {
        console.log('Checking for existing profile...');
        
        // Check for app_user
        const { data: appUser } = await supabase
          .from('app_user')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (appUser) {
          console.log('App user found, checking for fighter profile...');
          
          // Check for fighter profile
          const { data: profile } = await supabase
            .from('fighter_profiles')
            .select('id')
            .eq('user_id', appUser.id)
            .eq('active', true)
            .maybeSingle();

          if (profile) {
            console.log('Fighter profile found, redirecting to pending...');
            navigate('/license/pending', { replace: true });
            return;
          }
        }

        console.log('No existing profile found, can proceed with onboarding');
      } catch (error) {
        console.error('Error checking existing profile:', error);
      } finally {
        setCheckingExisting(false);
      }
    };

    checkExistingProfile();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setUploading(true);
    
    try {
      // Check if user already has a profile (should not happen due to useEffect check)
      const { data: existingAppUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (existingAppUser) {
        const { data: existingProfile } = await supabase
          .from('fighter_profiles')
          .select('id')
          .eq('user_id', existingAppUser.id)
          .eq('active', true)
          .maybeSingle();

        if (existingProfile) {
          toast.success('Ya tienes un perfil creado. Redirigiendo...');
          navigate('/license/pending', { replace: true });
          return;
        }
      }

      // Create app_user if it doesn't exist
      console.log('Checking for existing app_user...');
      const { data: appUser, error: appUserSelectError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (appUserSelectError) {
        console.error('Error checking app_user:', appUserSelectError);
        throw appUserSelectError;
      }

      let userId = appUser?.id;
      console.log('Existing app_user:', userId);
      
      if (!userId) {
        console.log('Creating new app_user...');
        const { data: newAppUser, error: appUserError } = await supabase
          .from('app_user')
          .insert({
            auth_user_id: user.id,
            email: user.email,
            phone: formData.phone,
            handle: `${formData.firstName}_${formData.lastName}_${Date.now()}`.toLowerCase().replace(/\s+/g, '_')
          })
          .select('id')
          .single();

        if (appUserError) {
          console.error('Error creating app_user:', appUserError);
          throw appUserError;
        }
        userId = newAppUser.id;
        console.log('Created app_user with ID:', userId);
      }

      // Create fighter profile
      console.log('Creating fighter profile...');
      const profileData = {
        user_id: userId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        nickname: formData.nickname || null,
        country: formData.country,
        weight_class: formData.weightClass,
        height_cm: parseInt(formData.heightCm),
        weight_kg: parseFloat(formData.weightKg),
        discipline: formData.discipline,
        fighting_style: formData.fightingStyle || null,
        bio: formData.bio || null
      };
      
      console.log('Profile data:', profileData);
      
      const { data: profile, error: profileError } = await supabase
        .from('fighter_profiles')
        .insert(profileData)
        .select('id')
        .single();

      if (profileError) {
        console.error('Error creating fighter profile:', profileError);
        throw profileError;
      }
      
      console.log('Created fighter profile with ID:', profile.id);

      // Create initial license with generated license number
      console.log('Generating license number...');
      const { data: licenseNumber, error: licenseGenError } = await supabase
        .rpc('generate_license_number');

      if (licenseGenError) {
        console.error('Error generating license number:', licenseGenError);
        throw licenseGenError;
      }

      console.log('Generated license number:', licenseNumber);

      const licenseData = {
        fighter_id: profile.id,
        discipline: formData.discipline,
        license_level: 'AMATEUR' as const,
        status: 'PENDING_REVIEW' as const,
        is_primary: true,
        license_number: licenseNumber
      };
      
      console.log('License data:', licenseData);
      
      const { data: license, error: licenseError } = await supabase
        .from('fighter_licenses')
        .insert(licenseData)
        .select('id')
        .single();

      if (licenseError) {
        console.error('Error creating fighter license:', licenseError);
        throw licenseError;
      }

      console.log('License created successfully with ID:', license.id);

      // Upload identity document
      if (identityDocument) {
        console.log('Uploading identity document...');
        const identityFileName = `${user.id}/identity-${Date.now()}.${identityDocument.type.split('/')[1]}`;
        
        const { error: identityUploadError } = await supabase.storage
          .from('license-documents')
          .upload(identityFileName, identityDocument, {
            contentType: identityDocument.type,
            upsert: false
          });

        if (identityUploadError) {
          console.error('Error uploading identity document:', identityUploadError);
          throw new Error(`Error uploading identity document: ${identityUploadError.message}`);
        }

        // Create document record
        const { error: docRecordError } = await supabase
          .from('license_documents')
          .insert({
            license_id: license.id,
            document_type: 'identity',
            file_path: identityFileName,
            file_name: identityDocument.name,
            file_size: identityDocument.size,
            mime_type: identityDocument.type,
            uploaded_by: user.id
          });

        if (docRecordError) {
          console.error('Error creating document record:', docRecordError);
          // Don't throw here, document uploaded but record creation failed
        }

        console.log('Identity document uploaded successfully');
      }

      // Upload fighter photo if provided - store directly in fighter_profiles.avatar_url
      if (fighterPhoto) {
        console.log('Uploading fighter photo...');
        const photoFileName = `${user.id}/photo-${Date.now()}.${fighterPhoto.type.split('/')[1]}`;
        
        const { error: photoUploadError } = await supabase.storage
          .from('fighter-photos')
          .upload(photoFileName, fighterPhoto, {
            contentType: fighterPhoto.type,
            upsert: false
          });

        if (photoUploadError) {
          console.error('Error uploading fighter photo:', photoUploadError);
          // Don't throw here, photo is optional
        } else {
          // Get public URL for the uploaded photo
          const { data: publicUrl } = supabase.storage
            .from('fighter-photos')
            .getPublicUrl(photoFileName);

          // Update fighter profile with avatar URL
          const { error: avatarUpdateError } = await supabase
            .from('fighter_profiles')
            .update({ avatar_url: publicUrl.publicUrl })
            .eq('id', profile.id);

          if (avatarUpdateError) {
            console.error('Error updating avatar URL:', avatarUpdateError);
          }

          console.log('Fighter photo uploaded and avatar URL updated successfully');
        }
      }

      // Refresh license data to update the auth context
      await refreshLicense();

      toast.success('¡Perfil creado exitosamente! Tu Fighter ID está pendiente de revisión.');
      
      // Small delay to ensure context is updated
      setTimeout(() => {
        navigate('/license/pending', { replace: true });
      }, 500);
      
    } catch (error) {
      console.error('Error creating profile:', error);
      
      // Log more detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // If it's a Supabase error, log the details
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('Supabase error code:', (error as any).code);
        console.error('Supabase error details:', (error as any).details);
        console.error('Supabase error hint:', (error as any).hint);
        
        // Handle specific error cases
        if ((error as any).code === '23505') {
          // Duplicate key constraint - user already has a profile
          toast.success('Ya tienes un perfil de peleador. Redirigiendo al dashboard...');
          setTimeout(() => {
            navigate('/license/dashboard', { replace: true });
          }, 1000);
          return;
        } else if ((error as any).code === '42501') {
          // RLS policy violation - license creation issue
          toast.error('Tu perfil se creó pero hubo un problema con la licencia. Contacta al administrador.');
          setTimeout(() => {
            navigate('/license/dashboard', { replace: true });
          }, 2000);
          return;
        }
      }
      
      toast.error(`Error al crear el perfil: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (!user) {
    return <div>No autorizado</div>;
  }

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-800" />
              <p className="text-muted-foreground">Verificando perfil existente...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {step === 1 ? (
              <User className="h-12 w-12 text-gray-800" />
            ) : (
              <Award className="h-12 w-12 text-gray-800" />
            )}
          </div>
          <CardTitle className="text-2xl">Configurar Tu Perfil de Peleador</CardTitle>
          <CardDescription>
            Necesitamos algunos datos para crear tu perfil y solicitar tu primera licencia
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nickname">Apodo (Opcional)</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                    placeholder="Ej: El Tigre"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+504 9999-9999"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="heightCm">Altura (cm) *</Label>
                    <Input
                      id="heightCm"
                      type="number"
                      value={formData.heightCm}
                      onChange={(e) => setFormData({...formData, heightCm: e.target.value})}
                      placeholder="170"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="weightKg">Peso (kg) *</Label>
                    <Input
                      id="weightKg"
                      type="number"
                      step="0.1"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({...formData, weightKg: e.target.value})}
                      placeholder="70.5"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="weightClass">Categoría de Peso *</Label>
                  <Select value={formData.weightClass} onValueChange={(value) => setFormData({...formData, weightClass: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {weightClasses.map((weightClass) => (
                        <SelectItem key={weightClass} value={weightClass}>
                          {weightClass}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setStep(2)}
                    disabled={!formData.firstName || !formData.lastName || !formData.heightCm || !formData.weightKg || !formData.weightClass || !formData.phone}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="identityDocument">Documento de Identidad * <span className="text-sm text-gray-500">(Cédula, pasaporte, etc.)</span></Label>
                  <FileUpload
                    onFileSelect={(file) => {
                      setIdentityDocument(file);
                      const previewUrl = URL.createObjectURL(file);
                      setIdentityPreview(previewUrl);
                    }}
                    onRemoveFile={() => {
                      setIdentityDocument(null);
                      if (identityPreview) {
                        URL.revokeObjectURL(identityPreview);
                        setIdentityPreview(null);
                      }
                    }}
                    accept="image/*"
                    preview={identityPreview || undefined}
                    loading={uploading}
                    required
                    className="mb-4"
                  />
                </div>

                <div>
                  <Label htmlFor="fighterPhoto">Foto del Peleador <span className="text-sm text-gray-500">(Opcional - para tu perfil)</span></Label>
                  <FileUpload
                    onFileSelect={(file) => {
                      setFighterPhoto(file);
                      const previewUrl = URL.createObjectURL(file);
                      setFighterPhotoPreview(previewUrl);
                    }}
                    onRemoveFile={() => {
                      setFighterPhoto(null);
                      if (fighterPhotoPreview) {
                        URL.revokeObjectURL(fighterPhotoPreview);
                        setFighterPhotoPreview(null);
                      }
                    }}
                    accept="image/*"
                    preview={fighterPhotoPreview || undefined}
                    loading={uploading}
                    className="mb-4"
                  />
                </div>

                <div>
                  <Label htmlFor="fightingStyle">Estilo de Pelea</Label>
                  <Input
                    id="fightingStyle"
                    value={formData.fightingStyle}
                    onChange={(e) => setFormData({...formData, fightingStyle: e.target.value})}
                    placeholder="Ej: Muay Thai, BJJ, Boxing"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Biografía (Opcional)</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Cuéntanos sobre tu experiencia en artes marciales..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Atrás
                  </Button>
                  <Button type="submit" disabled={loading || !identityDocument}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando Perfil...
                      </>
                    ) : (
                      'Crear Perfil y Solicitar Licencia'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}