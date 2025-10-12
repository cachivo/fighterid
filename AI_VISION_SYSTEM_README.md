# 🥊 Sistema de Visión por Computadora - Fighter ID

Sistema de detección automática de golpes en tiempo real usando Computer Vision + Deep Learning.

## 📋 Stack Técnico

- **Inferencia**: Python 3.10+, FastAPI, PyTorch, ONNX Runtime
- **Video Processing**: OpenCV, GStreamer (opcional)
- **Modelos**: YOLOv8-pose + Clasificador Temporal
- **Backend**: Supabase (ya integrado en tu app)
- **Deployment**: Docker + docker-compose

---

## 🏗️ Arquitectura del Sistema

```
OBS/ATEM (RTMP/SRT)
    ↓
FFmpeg Splitter
    ↓ (Output A → CDN público)
    ↓ (Output B → Microservicio IA)
    ↓
FastAPI Inference Service
    ↓ (Eventos JSON)
    ↓
Supabase Edge Function (/ai-strike-ingest)
    ↓
PostgreSQL + Realtime
    ↓
React UI (Dashboard + Overlay)
```

---

## 🚀 Parte 1: Backend Ya Implementado ✅

### Tablas Creadas
- ✅ `ai_strike_events` - Eventos de golpes detectados
- ✅ `ai_inference_sessions` - Sesiones de inferencia activas
- ✅ `ai_model_versions` - Versionamiento de modelos
- ✅ `ai_inference_logs` - Logs del sistema
- ✅ `ai_config` - Configuración de umbrales

### Edge Function Desplegado
- ✅ `/ai-strike-ingest/event` - Recibir eventos
- ✅ `/ai-strike-ingest/start` - Iniciar sesión
- ✅ `/ai-strike-ingest/stop` - Detener sesión
- ✅ `/ai-strike-ingest/log` - Logging
- ✅ `/ai-strike-ingest/health` - Health check
- ✅ `/ai-strike-ingest/metrics` - Métricas

**URL del Edge Function:**
```
https://eeshomcqztvjkvycdfwi.supabase.co/functions/v1/ai-strike-ingest
```

### UI Creada
- ✅ **Dashboard Admin**: `/admin/ai-strike-monitor`
  - Monitoreo en tiempo real
  - Configuración de umbrales
  - Stats por peleador
  - Gestión de sesiones

- ✅ **Overlay para OBS**: `/ai-overlay?fightId={id}&round={n}&layout={tipo}`
  - Layouts: `side-by-side`, `compact`, `minimal`
  - Transparente para chroma key
  - Actualización en tiempo real

---

## 🐍 Parte 2: Microservicio Python (Por Implementar)

### Estructura de Archivos
```
ai-strike-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── models/
│   │   ├── __init__.py
│   │   ├── pose_detector.py # YOLOv8-pose wrapper
│   │   └── strike_classifier.py # Clasificador de golpes
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── video_ingest.py  # SRT/RTSP consumer
│   │   └── strike_detector.py # Pipeline principal
│   └── utils/
│       ├── __init__.py
│       ├── debouncer.py     # Anti-duplicación
│       └── http_client.py   # Cliente para Supabase
├── weights/                  # Modelos pre-entrenados
│   ├── yolov8n-pose.pt
│   └── strike_classifier.onnx
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

### 📄 requirements.txt
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
opencv-python==4.8.1.78
torch==2.1.0
torchvision==0.16.0
ultralytics==8.0.196
onnxruntime-gpu==1.16.3  # o onnxruntime para CPU
numpy==1.24.3
httpx==0.25.0
python-dotenv==1.0.0
pydantic==2.5.0
```

### 📄 app/main.py
\`\`\`python
import os
import asyncio
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
import httpx
from datetime import datetime

from app.pipeline.video_ingest import VideoIngester
from app.pipeline.strike_detector import StrikeDetectionPipeline

app = FastAPI(title="AI Strike Detection Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Estado global de sesiones
active_sessions: Dict[str, Dict] = {}

# Modelos
class SessionStart(BaseModel):
    source: str  # SRT/RTSP URL
    fightId: str
    round: int
    fighters: Dict[str, str]  # {"A": "John Doe", "B": "Jane Doe"}

class SessionStop(BaseModel):
    fightId: str

# Configuración
BACKEND_URL = os.getenv("BACKEND_URL", "https://eeshomcqztvjkvycdfwi.supabase.co/functions/v1/ai-strike-ingest")
MODEL_VERSION = os.getenv("MODEL_VERSION", "v2025.10.12")

@app.post("/start")
async def start_inference(session: SessionStart, background_tasks: BackgroundTasks):
    """Iniciar sesión de inferencia"""
    
    if session.fightId in active_sessions:
        raise HTTPException(400, f"Session for fight {session.fightId} already running")
    
    # Crear sesión en backend
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{BACKEND_URL}/start",
                json={
                    "fightId": session.fightId,
                    "source": session.source,
                    "fighters": session.fighters,
                    "model_version": MODEL_VERSION,
                },
                timeout=10.0
            )
            response.raise_for_status()
            backend_data = response.json()
            session_id = backend_data.get("sessionId")
            
        except Exception as e:
            raise HTTPException(500, f"Failed to register session: {str(e)}")
    
    # Iniciar pipeline en background
    pipeline = StrikeDetectionPipeline(
        source_url=session.source,
        fight_id=session.fightId,
        round_number=session.round,
        session_id=session_id,
        backend_url=BACKEND_URL,
        model_version=MODEL_VERSION,
    )
    
    active_sessions[session.fightId] = {
        "session_id": session_id,
        "pipeline": pipeline,
        "started_at": datetime.now().isoformat(),
        "fighters": session.fighters,
    }
    
    # Ejecutar en background
    background_tasks.add_task(pipeline.run)
    
    return {
        "success": True,
        "sessionId": session_id,
        "message": f"Inference started for fight {session.fightId}",
    }

@app.post("/stop")
async def stop_inference(stop: SessionStop):
    """Detener sesión de inferencia"""
    
    if stop.fightId not in active_sessions:
        raise HTTPException(404, f"No active session for fight {stop.fightId}")
    
    session_info = active_sessions[stop.fightId]
    pipeline: StrikeDetectionPipeline = session_info["pipeline"]
    
    # Detener pipeline
    stats = pipeline.stop()
    
    # Notificar al backend
    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                f"{BACKEND_URL}/stop",
                json={
                    "sessionId": session_info["session_id"],
                    "stats": stats,
                },
                timeout=10.0
            )
        except Exception as e:
            print(f"Failed to notify backend: {e}")
    
    del active_sessions[stop.fightId]
    
    return {
        "success": True,
        "message": f"Inference stopped for fight {stop.fightId}",
        "stats": stats,
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "active_sessions": len(active_sessions),
        "model_version": MODEL_VERSION,
        "timestamp": datetime.now().isoformat(),
    }

@app.get("/metrics")
async def get_metrics():
    """Obtener métricas de sesiones activas"""
    metrics = []
    
    for fight_id, session in active_sessions.items():
        pipeline: StrikeDetectionPipeline = session["pipeline"]
        metrics.append({
            "fightId": fight_id,
            "sessionId": session["session_id"],
            "started_at": session["started_at"],
            "stats": pipeline.get_current_stats(),
        })
    
    return {
        "active_sessions": len(active_sessions),
        "sessions": metrics,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
\`\`\`

### 📄 app/pipeline/strike_detector.py
\`\`\`python
import cv2
import numpy as np
import time
import httpx
from typing import Dict, Optional
from ultralytics import YOLO
import asyncio

class StrikeDetectionPipeline:
    def __init__(
        self,
        source_url: str,
        fight_id: str,
        round_number: int,
        session_id: str,
        backend_url: str,
        model_version: str,
        confidence_threshold: float = 0.75,
    ):
        self.source_url = source_url
        self.fight_id = fight_id
        self.round_number = round_number
        self.session_id = session_id
        self.backend_url = backend_url
        self.model_version = model_version
        self.confidence_threshold = confidence_threshold
        
        # Cargar modelo YOLOv8-pose
        self.pose_model = YOLO("weights/yolov8n-pose.pt")
        
        # Stats
        self.running = False
        self.total_frames = 0
        self.start_time = None
        self.latencies = []
        
        # Debouncing (evitar duplicados)
        self.last_strike_time = {"A": 0, "B": 0}
        self.debounce_ms = 300
    
    async def send_event(self, event_data: Dict):
        """Enviar evento al backend"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.backend_url}/event",
                    json=event_data,
                    timeout=5.0
                )
                response.raise_for_status()
            except Exception as e:
                print(f"Failed to send event: {e}")
    
    async def send_log(self, level: str, message: str, metadata: Optional[Dict] = None):
        """Enviar log al backend"""
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{self.backend_url}/log",
                    json={
                        "sessionId": self.session_id,
                        "fightId": self.fight_id,
                        "level": level,
                        "message": message,
                        "metadata": metadata or {},
                    },
                    timeout=5.0
                )
            except:
                pass  # No fallar por logs
    
    def detect_strike(self, keypoints: np.ndarray, fighter: str) -> Optional[Dict]:
        """
        Detectar si hay un golpe basado en keypoints.
        PLACEHOLDER: Implementar lógica real de detección.
        
        Retorna Dict con:
        - event: 'strike_attempted' | 'strike_connected'
        - strike_type: 'jab' | 'cross' | etc.
        - confidence: float 0-1
        """
        
        # PLACEHOLDER: Implementar detección real
        # Por ahora retorna None (no detecta nada)
        
        # Ejemplo de detección simplificada (velocidad de mano):
        # - Extraer posiciones de manos (keypoints 9, 10)
        # - Calcular velocidad
        # - Si velocidad > umbral → strike_attempted
        # - Analizar proximidad con oponente → strike_connected
        
        return None
    
    def identify_fighter_zone(self, bbox_center_x: float, frame_width: int) -> str:
        """
        Identificar si es Fighter A (izquierda) o B (derecha) basado en posición.
        """
        return "A" if bbox_center_x < frame_width / 2 else "B"
    
    def should_register(self, fighter: str, current_time_ms: int) -> bool:
        """Debouncing: evitar duplicados en ventana de tiempo"""
        if current_time_ms - self.last_strike_time[fighter] < self.debounce_ms:
            return False
        self.last_strike_time[fighter] = current_time_ms
        return True
    
    def run(self):
        """Pipeline principal de inferencia"""
        self.running = True
        self.start_time = time.time()
        
        # Abrir stream de video
        cap = cv2.VideoCapture(self.source_url)
        
        if not cap.isOpened():
            asyncio.run(self.send_log("error", f"Failed to open video source: {self.source_url}"))
            return
        
        asyncio.run(self.send_log("info", f"Inference session started for fight {self.fight_id}"))
        
        while self.running and cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_start = time.time()
            self.total_frames += 1
            
            # Detección de pose
            results = self.pose_model.predict(frame, verbose=False, conf=0.5)
            
            frame_height, frame_width = frame.shape[:2]
            current_time_ms = int(time.time() * 1000)
            
            # Procesar cada persona detectada
            for result in results:
                if result.keypoints is None:
                    continue
                
                for person_idx in range(len(result.keypoints)):
                    keypoints = result.keypoints[person_idx].cpu().numpy()
                    bbox = result.boxes[person_idx].xyxy[0].cpu().numpy()
                    
                    # Identificar fighter por zona
                    bbox_center_x = (bbox[0] + bbox[2]) / 2
                    fighter = self.identify_fighter_zone(bbox_center_x, frame_width)
                    
                    # Detectar strike
                    strike_event = self.detect_strike(keypoints, fighter)
                    
                    if strike_event and self.should_register(fighter, current_time_ms):
                        # Enviar evento al backend
                        event_data = {
                            "fightId": self.fight_id,
                            "round": self.round_number,
                            "timestamp_ms": current_time_ms,
                            "fighter": fighter,
                            "event": strike_event["event"],
                            "strike_type": strike_event["strike_type"],
                            "confidence": strike_event["confidence"],
                            "model_version": self.model_version,
                        }
                        
                        asyncio.run(self.send_event(event_data))
            
            # Calcular latencia
            frame_latency = (time.time() - frame_start) * 1000
            self.latencies.append(frame_latency)
            
            # Limitar buffer de latencias
            if len(self.latencies) > 100:
                self.latencies.pop(0)
        
        cap.release()
        asyncio.run(self.send_log("info", "Inference session ended"))
    
    def stop(self) -> Dict:
        """Detener pipeline y retornar stats"""
        self.running = False
        
        elapsed_time = time.time() - self.start_time if self.start_time else 0
        avg_fps = self.total_frames / elapsed_time if elapsed_time > 0 else 0
        avg_latency = np.mean(self.latencies) if self.latencies else 0
        
        return {
            "total_frames": self.total_frames,
            "avg_fps": round(avg_fps, 2),
            "avg_latency_ms": round(avg_latency, 2),
        }
    
    def get_current_stats(self) -> Dict:
        """Obtener stats actuales sin detener"""
        elapsed_time = time.time() - self.start_time if self.start_time else 0
        avg_fps = self.total_frames / elapsed_time if elapsed_time > 0 else 0
        avg_latency = np.mean(self.latencies[-50:]) if self.latencies else 0
        
        return {
            "total_frames": self.total_frames,
            "current_fps": round(avg_fps, 2),
            "current_latency_ms": round(avg_latency, 2),
        }
\`\`\`

### 📄 Dockerfile
\`\`\`dockerfile
FROM python:3.10-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \\
    libgl1-mesa-glx \\
    libglib2.0-0 \\
    ffmpeg \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Descargar modelo YOLOv8-pose (si no está en weights/)
RUN mkdir -p weights && \\
    python -c "from ultralytics import YOLO; YOLO('yolov8n-pose.pt')" || true

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
\`\`\`

### 📄 docker-compose.yml
\`\`\`yaml
version: '3.8'

services:
  ai-strike-service:
    build: .
    ports:
      - "8000:8000"
    environment:
      - BACKEND_URL=https://eeshomcqztvjkvycdfwi.supabase.co/functions/v1/ai-strike-ingest
      - MODEL_VERSION=v2025.10.12
    volumes:
      - ./weights:/app/weights
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]  # Requiere NVIDIA GPU
\`\`\`

### 📄 .env.example
\`\`\`bash
BACKEND_URL=https://eeshomcqztvjkvycdfwi.supabase.co/functions/v1/ai-strike-ingest
MODEL_VERSION=v2025.10.12
\`\`\`

---

## 🎬 Parte 3: Setup de OBS + FFmpeg

### Configuración de FFmpeg Splitter

Duplica el feed de OBS para enviar a CDN + Microservicio:

\`\`\`bash
# Recibir de OBS (SRT)
# Salida A → CDN (RTMP)
# Salida B → Microservicio IA (SRT)

ffmpeg -i srt://0.0.0.0:9999?mode=listener \\
  -c copy -f flv rtmp://tu-cdn.com/live/stream \\
  -c:v libx264 -preset ultrafast -tune zerolatency \\
  -b:v 6M -maxrate 6M -bufsize 12M \\
  -g 60 -keyint_min 60 -sc_threshold 0 \\
  -c:a aac -b:a 128k \\
  -f mpegts srt://microservicio-ip:9998
\`\`\`

### Configuración de OBS
1. **Settings → Stream**
   - Service: Custom
   - Server: `srt://tu-servidor-ffmpeg:9999`
   - Stream Key: (vacío)

2. **Settings → Output**
   - Output Mode: Advanced
   - Encoder: x264
   - Rate Control: CBR
   - Bitrate: 6000 Kbps
   - Keyframe Interval: 2s
   - Preset: veryfast

3. **Settings → Video**
   - Base Resolution: 1920x1080
   - Output Resolution: 1920x1080
   - FPS: 30

---

## 🧪 Testing Rápido (Sin Microservicio)

Puedes testear la UI con datos simulados:

\`\`\`bash
# Simular evento de golpe
curl -X POST https://eeshomcqztvjkvycdfwi.supabase.co/functions/v1/ai-strike-ingest/event \\
  -H "Content-Type: application/json" \\
  -d '{
    "fightId": "demo-fight",
    "round": 1,
    "timestamp_ms": '$(date +%s)'000',
    "fighter": "A",
    "event": "strike_connected",
    "strike_type": "jab",
    "confidence": 0.85,
    "model_version": "v2025.10.12"
  }'
\`\`\`

---

## 📊 URLs de tu Sistema

### Admin Dashboard
```
https://tu-app.lovable.app/admin/ai-strike-monitor
```

### Overlays para OBS
```
# Side-by-side (recomendado)
https://tu-app.lovable.app/ai-overlay?fightId=demo-fight&round=1&layout=side-by-side

# Compact (esquina)
https://tu-app.lovable.app/ai-overlay?fightId=demo-fight&round=1&layout=compact

# Minimal (barra inferior)
https://tu-app.lovable.app/ai-overlay?fightId=demo-fight&round=1&layout=minimal
```

---

## 🔄 Próximos Pasos

### Fase 3: Implementar Microservicio (Tú)
1. Crear carpeta `ai-strike-service/`
2. Copiar código de arriba
3. Descargar modelo: `yolo export model=yolov8n-pose.pt format=onnx`
4. Entrenar clasificador de golpes (o usar reglas heurísticas)
5. `docker-compose up --build`

### Fase 4: Entrenar Clasificador de Golpes
- Dataset: Clips de golpes etiquetados (jab, cross, hook, etc.)
- Arquitectura: LSTM/GRU sobre secuencia de keypoints
- Export a ONNX para inferencia rápida

### Fase 5: MLOps (Opcional)
- Pipeline de re-entrenamiento
- A/B testing de modelos
- Métricas de precisión en producción

---

## 📞 Soporte

Para dudas sobre la integración backend/frontend, contacta al equipo de desarrollo.
Para el microservicio Python, revisa la documentación de YOLOv8 y FastAPI.

---

## 🎯 Estado Actual

✅ **Backend Completo** - Supabase + Edge Functions + Realtime  
✅ **UI Completa** - Admin Dashboard + Overlay Web  
⏳ **Microservicio Python** - Código de referencia provisto (por implementar)