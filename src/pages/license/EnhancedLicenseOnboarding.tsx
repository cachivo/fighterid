import { useState, useEffect } from 'react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Award, Upload, FileText, AlertTriangle, Phone, Heart, Shield } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';

export default function EnhancedLicenseOnboarding() {
  const { user, refreshLicense } = useLicenseAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    nickname: '',
    country: 'HN',
    weightClass: '',
    heightCm: '',
    weightKg: '',
    reachCm: '',
    martialArts: [] as string[],
    gymName: '',
    fightingStyle: '',
    stance: '' as 'Ortodoxo' | 'Zurdo' | 'Switch' | '',
    level: '' as 'Amateur' | 'Semi-profesional' | 'Profesional' | '',
    bio: '',
    phone: '',
    birthdate: '',
    gender: '' as 'M' | 'F' | 'Otro' | '',
    recordType: '' as 'Amateur' | 'Profesional' | '',
    recordWins: '',
    recordLosses: '',
    recordDraws: '',
    boxrecUrl: '',
    tapologyUrl: '',
    
    // Phase 1: Critical Safety Information
    documentType: '' as 'Cedula' | 'Pasaporte' | 'Licencia' | '',
    documentNumber: '',
    birthplace: '',
    bloodType: '' as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    medicalAllergies: '',
    medicalConditions: '',
    insuranceCompany: '',
    insurancePolicy: ''
  });

  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [fighterPhoto, setFighterPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const weightClasses = [
    'Strawweight', 'Flyweight', 'Bantamweight', 'Featherweight',
    'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight'
  ];

  const martialArts = [
    'Baile', 'Boxeo', 'Canto'
  ];

  const documentTypes = ['Cedula', 'Pasaporte', 'Licencia'];
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const relationshipTypes = ['Padre', 'Madre', 'Esposo/a', 'Hermano/a', 'Hijo/a', 'Tío/a', 'Abuelo/a', 'Amigo/a'];

  const handleMartialArtsChange = (art: string, checked: boolean) => {
    if (checked) {
      setFormData({...formData, martialArts: [...formData.martialArts, art]});
    } else {
      setFormData({...formData, martialArts: formData.martialArts.filter(a => a !== art)});
    }
  };

  // Check if user already has a profile and attempt reactivation
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return;

      try {
        // Intentar reactivar perfil existente
        const { data: reactivation, error: reactivationError } = await supabase
          .rpc('reactivate_fighter_profile', {
            p_auth_user_id: user.id,
            p_email: user.email || ''
          });

        if (!reactivationError && reactivation) {
          const result = reactivation as { action?: string; message?: string };
          if (result.action === 'reactivated') {
            toast.success('Tu perfil ha sido reactivado exitosamente');
            navigate('/license/pending', { replace: true });
            return;
          } else if (result.action === 'exists') {
            toast.info('Ya tienes un perfil activo');
            navigate('/license/pending', { replace: true });
            return;
          }
        }

        // Si no hay perfil para reactivar, continuar con el onboarding
      } catch (error) {
        console.error('Error checking/reactivating profile:', error);
      } finally {
        setCheckingExisting(false);
      }
    };

    checkExistingProfile();
  }, [user, navigate]);

  const validateStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return formData.firstName && formData.lastName && formData.weightClass && 
               formData.martialArts.length > 0 && formData.heightCm && formData.weightKg;
      case 2:
        return formData.documentType && formData.documentNumber && formData.birthdate && 
               formData.bloodType && formData.emergencyContactName && formData.emergencyContactPhone;
      case 3:
        return identityDocument; // At least identity document is required
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      toast.error('Por favor completa todos los campos requeridos antes de continuar.');
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateStep(3)) {
      toast.error('Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    setUploading(true);
    
    try {
      // Verificar reactivación de perfil primero
      const { data: reactivation } = await supabase
        .rpc('reactivate_fighter_profile', {
          p_auth_user_id: user.id,
          p_email: user.email || ''
        });

      if (reactivation) {
        const result = reactivation as { action?: string; message?: string };
        if (result.action === 'exists') {
          toast.error('Ya tienes un perfil activo. Redirigiendo...');
          setTimeout(() => navigate('/license/pending', { replace: true }), 2000);
          return;
        }
      }

      // Check if user already has a profile
      const { data: existingAppUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      let userId = existingAppUser?.id;
      
      if (!userId) {
        // Create app_user with conflict handling
        const { data: newAppUser, error: appUserError } = await supabase
          .from('app_user')
          .insert({
            auth_user_id: user.id,
            email: user.email,
            phone: formData.phone,
            birthdate: formData.birthdate || null,
            handle: `${formData.firstName}_${formData.lastName}_${Date.now()}`.toLowerCase().replace(/\s+/g, '_')
          })
          .select('id')
          .single();

        if (appUserError) {
          // Si falla por duplicado, intentar obtener el existente
          if (appUserError.message.includes('duplicate') || appUserError.message.includes('already exists')) {
            const { data: existing } = await supabase
              .from('app_user')
              .select('id')
              .eq('email', user.email)
              .maybeSingle();
            
            if (existing) {
              userId = existing.id;
            } else {
              throw appUserError;
            }
          } else {
            throw appUserError;
          }
        } else {
          userId = newAppUser.id;
        }
      }

      // Create enhanced fighter profile
      const profileData = {
        user_id: userId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        nickname: formData.nickname || null,
        country: formData.country,
        weight_class: formData.weightClass,
        height_cm: parseInt(formData.heightCm),
        weight_kg: parseFloat(formData.weightKg),
        reach_cm: formData.reachCm ? parseInt(formData.reachCm) : null,
        discipline: formData.martialArts.length > 0 ? formData.martialArts[0] as 'Baile' | 'Boxeo' | 'Canto' : null,
        martial_arts: formData.martialArts,
        gym_name: formData.gymName || null,
        fighting_style: formData.fightingStyle || null,
        stance: formData.stance || null,
        level: formData.level || null,
        record_wins: formData.recordWins ? parseInt(formData.recordWins) : 0,
        record_losses: formData.recordLosses ? parseInt(formData.recordLosses) : 0,
        record_draws: formData.recordDraws ? parseInt(formData.recordDraws) : 0,
        gender: formData.gender || null,
        boxrec_url: formData.boxrecUrl || null,
        tapology_url: formData.tapologyUrl || null,
        bio: formData.bio || null,
        
        // Phase 1: Critical Safety Information
        document_type: formData.documentType || null,
        document_number: formData.documentNumber || null,
        birthdate: formData.birthdate || null,
        birthplace: formData.birthplace || null,
        blood_type: formData.bloodType || null,
        emergency_contact_name: formData.emergencyContactName || null,
        emergency_contact_relation: formData.emergencyContactRelation || null,
        emergency_contact_phone: formData.emergencyContactPhone || null,
        medical_allergies: formData.medicalAllergies || null,
        medical_conditions: formData.medicalConditions || null,
        insurance_company: formData.insuranceCompany || null,
        insurance_policy: formData.insurancePolicy || null
      };
      
      const { data: profile, error: profileError } = await supabase
        .from('fighter_profiles')
        .insert(profileData)
        .select('id')
        .single();

      if (profileError) throw profileError;

      // Create license
      const { data: licenseNumber, error: licenseGenError } = await supabase
        .rpc('generate_license_number');

      if (licenseGenError) throw licenseGenError;

      const licenseData = {
        fighter_id: profile.id,
        discipline: formData.martialArts.length > 0 ? formData.martialArts[0] as 'Baile' | 'Boxeo' | 'Canto' : null,
        license_level: 'AMATEUR' as const,
        status: 'PENDING_REVIEW' as const,
        is_primary: true,
        license_number: licenseNumber
      };
      
      const { data: license, error: licenseError } = await supabase
        .from('fighter_licenses')
        .insert(licenseData)
        .select('id')
        .single();

      if (licenseError) throw licenseError;

      // Upload documents
      if (identityDocument) {
        const identityFileName = `${user.id}/identity-${Date.now()}.${identityDocument.type.split('/')[1]}`;
        
        const { error: identityUploadError } = await supabase.storage
          .from('license-documents')
          .upload(identityFileName, identityDocument, {
            contentType: identityDocument.type,
            upsert: false
          });

        if (identityUploadError) throw new Error(`Error uploading identity document: ${identityUploadError.message}`);

        await supabase
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
      }

      if (fighterPhoto) {
        const photoFileName = `${user.id}/photo-${Date.now()}.${fighterPhoto.type.split('/')[1]}`;
        
        const { error: photoUploadError } = await supabase.storage
          .from('fighter-photos')
          .upload(photoFileName, fighterPhoto, {
            contentType: fighterPhoto.type,
            upsert: false
          });

        if (!photoUploadError) {
          const { data: publicUrl } = supabase.storage
            .from('fighter-photos')
            .getPublicUrl(photoFileName);

          await supabase
            .from('fighter_profiles')
            .update({ avatar_url: publicUrl.publicUrl })
            .eq('id', profile.id);
        }
      }

      await refreshLicense();
      toast.success('¡Fighter ID creado exitosamente con información completa!');
      
      setTimeout(() => {
        navigate('/license/pending', { replace: true });
      }, 500);
      
    } catch (error) {
      console.error('Error creating enhanced profile:', error);
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
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {step === 1 ? (
              <User className="h-12 w-12 text-gray-800" />
            ) : step === 2 ? (
              <AlertTriangle className="h-12 w-12 text-red-600" />
            ) : (
              <Award className="h-12 w-12 text-gray-800" />
            )}
          </div>
          <CardTitle className="text-2xl">Fighter ID Completo</CardTitle>
          <CardDescription>
            Paso {step} de 3 - Creando tu licencia profesional con información crítica de seguridad
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 w-8 rounded ${
                    s <= step ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Información Básica del Peleador</h3>
                  <p className="text-sm text-muted-foreground">Datos fundamentales para tu perfil deportivo</p>
                </div>
                
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nickname">Apodo</Label>
                    <Input
                      id="nickname"
                      value={formData.nickname}
                      onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                      placeholder="Ej: El Tigre"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Género *</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value as any})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="heightCm">Altura (cm) *</Label>
                    <Input
                      id="heightCm"
                      type="number"
                      value={formData.heightCm}
                      onChange={(e) => setFormData({...formData, heightCm: e.target.value})}
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
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reachCm">Alcance (cm)</Label>
                    <Input
                      id="reachCm"
                      type="number"
                      value={formData.reachCm}
                      onChange={(e) => setFormData({...formData, reachCm: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="weightClass">División *</Label>
                  <Select value={formData.weightClass} onValueChange={(value) => setFormData({...formData, weightClass: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu división" />
                    </SelectTrigger>
                    <SelectContent>
                      {weightClasses.map(wc => (
                        <SelectItem key={wc} value={wc}>{wc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Artes Marciales *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {martialArts.map((art) => (
                      <div key={art} className="flex items-center space-x-2">
                        <Checkbox
                          id={art}
                          checked={formData.martialArts.includes(art)}
                          onCheckedChange={(checked) => handleMartialArtsChange(art, checked as boolean)}
                        />
                        <Label htmlFor={art} className="text-sm">{art}</Label>
                      </div>
                    ))}
                  </div>
                  {formData.martialArts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.martialArts.map((art) => (
                        <Badge key={art} variant="secondary">{art}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2 text-red-700">Información Crítica de Seguridad</h3>
                  <p className="text-sm text-muted-foreground">Esta información es esencial para emergencias médicas</p>
                </div>

                {/* Document Information */}
                <Card className="border-red-200 bg-red-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <FileText className="h-5 w-5" />
                      Identificación Oficial
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="documentType">Tipo de Documento *</Label>
                        <Select value={formData.documentType} onValueChange={(value) => setFormData({...formData, documentType: value as any})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="documentNumber">Número de Documento *</Label>
                        <Input
                          id="documentNumber"
                          value={formData.documentNumber}
                          onChange={(e) => setFormData({...formData, documentNumber: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="birthdate">Fecha de Nacimiento *</Label>
                        <Input
                          id="birthdate"
                          type="date"
                          value={formData.birthdate}
                          onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="birthplace">Lugar de Nacimiento</Label>
                        <Input
                          id="birthplace"
                          value={formData.birthplace}
                          onChange={(e) => setFormData({...formData, birthplace: e.target.value})}
                          placeholder="Ciudad, País"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Medical Information */}
                <Card className="border-red-200 bg-red-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <Heart className="h-5 w-5" />
                      Información Médica Crítica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="bloodType">Tipo de Sangre *</Label>
                      <Select value={formData.bloodType} onValueChange={(value) => setFormData({...formData, bloodType: value as any})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu tipo de sangre" />
                        </SelectTrigger>
                        <SelectContent>
                          {bloodTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="medicalAllergies">Alergias Conocidas</Label>
                      <Textarea
                        id="medicalAllergies"
                        value={formData.medicalAllergies}
                        onChange={(e) => setFormData({...formData, medicalAllergies: e.target.value})}
                        placeholder="Medicamentos, alimentos, materiales..."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="medicalConditions">Condiciones Médicas</Label>
                      <Textarea
                        id="medicalConditions"
                        value={formData.medicalConditions}
                        onChange={(e) => setFormData({...formData, medicalConditions: e.target.value})}
                        placeholder="Diabetes, asma, lesiones previas..."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card className="border-red-200 bg-red-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <Phone className="h-5 w-5" />
                      Contacto de Emergencia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="emergencyContactName">Nombre Completo *</Label>
                      <Input
                        id="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergencyContactRelation">Relación</Label>
                        <Select value={formData.emergencyContactRelation} onValueChange={(value) => setFormData({...formData, emergencyContactRelation: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona la relación" />
                          </SelectTrigger>
                          <SelectContent>
                            {relationshipTypes.map(rel => (
                              <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactPhone">Teléfono *</Label>
                        <Input
                          id="emergencyContactPhone"
                          type="tel"
                          value={formData.emergencyContactPhone}
                          onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Insurance Information */}
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Shield className="h-5 w-5" />
                      Seguro Médico (Opcional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="insuranceCompany">Compañía de Seguros</Label>
                        <Input
                          id="insuranceCompany"
                          value={formData.insuranceCompany}
                          onChange={(e) => setFormData({...formData, insuranceCompany: e.target.value})}
                          placeholder="Ej: Seguros Atlántida"
                        />
                      </div>
                      <div>
                        <Label htmlFor="insurancePolicy">Número de Póliza</Label>
                        <Input
                          id="insurancePolicy"
                          value={formData.insurancePolicy}
                          onChange={(e) => setFormData({...formData, insurancePolicy: e.target.value})}
                          placeholder="Número de póliza"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Documentos y Fotografías</h3>
                  <p className="text-sm text-muted-foreground">Sube los documentos requeridos para completar tu Fighter ID</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-orange-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-700">
                        <FileText className="h-5 w-5" />
                        Documento de Identidad *
                      </CardTitle>
                      <CardDescription>
                        Cédula, pasaporte o documento oficial de identificación
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FileUpload
                        onFileSelect={setIdentityDocument}
                        accept="image/*,.pdf"
                        maxSize={5}
                        preview={identityDocument ? URL.createObjectURL(identityDocument) : undefined}
                        onRemoveFile={() => setIdentityDocument(null)}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Fotografía del Peleador
                      </CardTitle>
                      <CardDescription>
                        Foto oficial para tu Fighter ID (opcional)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FileUpload
                        onFileSelect={setFighterPhoto}
                        accept="image/*"
                        maxSize={3}
                        preview={fighterPhoto ? URL.createObjectURL(fighterPhoto) : undefined}
                        onRemoveFile={() => setFighterPhoto(null)}
                        autoResize={true}
                        resizeOptions={{ maxWidth: 400, maxHeight: 400, quality: 0.85 }}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Información Adicional</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="gymName">Gimnasio/Academia</Label>
                      <Input
                        id="gymName"
                        value={formData.gymName}
                        onChange={(e) => setFormData({...formData, gymName: e.target.value})}
                        placeholder="Nombre del gimnasio"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="boxrecUrl">Perfil BoxRec (URL)</Label>
                        <Input
                          id="boxrecUrl"
                          type="url"
                          value={formData.boxrecUrl}
                          onChange={(e) => setFormData({...formData, boxrecUrl: e.target.value})}
                          placeholder="https://boxrec.com/..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="tapologyUrl">Perfil Tapology (URL)</Label>
                        <Input
                          id="tapologyUrl"
                          type="url"
                          value={formData.tapologyUrl}
                          onChange={(e) => setFormData({...formData, tapologyUrl: e.target.value})}
                          placeholder="https://tapology.com/..."
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bio">Biografía</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        placeholder="Cuéntanos sobre tu trayectoria en las artes marciales..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              {step > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep}
                  disabled={loading}
                >
                  Anterior
                </Button>
              )}
              
              {step < 3 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  className="ml-auto bg-purple-600 hover:bg-purple-700"
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || !validateStep(3)}
                  className="ml-auto bg-green-600 hover:bg-green-700"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {uploading ? 'Subiendo documentos...' : 'Crear Fighter ID Completo'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}