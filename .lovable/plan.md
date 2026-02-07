

# Plan: Mostrar Enlaces Externos (BoxRec/Tapology) en Perfiles Públicos de Peleadores

## Problema Identificado

Cuando un usuario busca peleadores y accede a un perfil público en `/fighter/:id`, **no se muestran** los enlaces profesionales externos (BoxRec para boxeadores, Tapology para MMA), aunque:

1. Los campos `boxrec_url` y `tapology_url` están definidos en la interfaz `FighterProfile`
2. La función `getFighterById` trae correctamente estos datos con `select('*')`
3. Los enlaces **SÍ aparecen** en otros lugares:
   - Dashboard de licencia del peleador (`LicenseDashboard.tsx`)
   - Tarjeta de identificación digital (`EnhancedFighterID.tsx`)
   - Modal de detalle en admin (`FighterDetailModal.tsx`)

## Solución

Agregar una sección de "Enlaces Profesionales" en la página pública del perfil del peleador (`FighterProfile.tsx`), siguiendo el patrón ya implementado en otros componentes.

---

## Cambios Técnicos

### Archivo: `src/pages/FighterProfile.tsx`

**Ubicación**: Dentro de la sección "Perfil del Peleador" (CardContent), después del gimnasio y entrenador.

```tsx
// Importar icono de enlace externo
import { ExternalLink } from 'lucide-react';

// Nueva sección después del entrenador (línea ~478)
{/* External Profile Links */}
{(fighter.boxrec_url || fighter.tapology_url) && (
  <>
    <Separator />
    <div>
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <ExternalLink className="h-4 w-4" />
        Perfiles Externos
      </h4>
      <div className="flex flex-wrap gap-2">
        {fighter.boxrec_url && (
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
            className="min-h-[44px] touch-manipulation"
          >
            <a 
              href={fighter.boxrec_url} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              BoxRec
            </a>
          </Button>
        )}
        {fighter.tapology_url && (
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="min-h-[44px] touch-manipulation"
          >
            <a 
              href={fighter.tapology_url} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Tapology
            </a>
          </Button>
        )}
      </div>
    </div>
  </>
)}
```

---

## Comportamiento por Disciplina

| Disciplina | Enlace Principal | Enlace Secundario |
|------------|------------------|-------------------|
| **Boxeo** | BoxRec | Tapology (opcional) |
| **MMA** | Tapology | BoxRec (opcional) |

Ambos enlaces se muestran si están disponibles, ya que algunos peleadores compiten en ambas disciplinas o tienen perfiles en ambas plataformas.

---

## Flujo Visual

```text
+--------------------------------+
|     Perfil del Peleador        |
+--------------------------------+
| Biografía                      |
| -------------------------      |
| Artes Marciales                |
| -------------------------      |
| Ligas Activas                  |
| -------------------------      |
| Estilo de Pelea                |
| -------------------------      |
| Gimnasio                       |
| -------------------------      |
| Entrenador                     |
| -------------------------      |
| 🔗 Perfiles Externos  (NUEVO)  |
| [BoxRec] [Tapology]            |
+--------------------------------+
```

---

## Optimización Móvil

- Botones con `min-h-[44px]` para touch targets accesibles
- `touch-manipulation` para mejor respuesta táctil
- `flex-wrap` para que los botones fluyan en pantallas pequeñas
- Atributos `rel="noopener noreferrer"` para seguridad

---

## Verificación Post-Implementación

1. Ir a `/fighters` y buscar un peleador de **Boxeo** con BoxRec configurado
2. Abrir su perfil y verificar que aparece el botón "BoxRec"
3. Buscar un peleador de **MMA** con Tapology configurado
4. Abrir su perfil y verificar que aparece el botón "Tapology"
5. Verificar que los enlaces abren en nueva pestaña correctamente
6. Probar en dispositivo móvil que los botones son fáciles de tocar

