import { useEffect, useRef, useState } from 'react';
import { conMayuscula, formatoDe, partesDe, partir } from '@/Components/Store/textoFicha';
import {
  ActionButton, Aperture, Bandwidth, Battery, BatteryCharge, BatteryCycle, Bluetooth, Brush, Cable, Calendar, Camera, CameraControl, ChevronLeft, ChevronRight, Clock, Pause, Play, Collection, Cpu, Display, Droplet, Fingerprint, Globe, Gpu, Grid,
  HardDrive, Headphones, Intelligence, Island, Keyboard, Layers, Link, Magnet, Mesh, Minus, Noise, Palette, Plug, Refresh, Resolution, Ruler, Scale, Scan, Selfie, ShieldCheck,
  Signal, SimCard, Smartphone, Sparkles, TagIcon, Telephoto, Video, Wifi, Ethernet, ExternalDisplay, Laptop, Mic, Ports, Speaker, Trackpad, Webcam,
  GraphicsCard, Upgrade,
  Certificate, Compression, Diamond, Factory, FastCharge, Gamepad, Install, Lab, Oleophobic, PowerBoost, PowerDelivery, Remote,
  ScreenFilter, SmartHome, Trigger, UsbC, Voice, Voltage, Zap,
  ApplePencil, ChargingCase, Controls, CpuCores, Ear, HeartPulse, SpatialAudio, Translate, UltraWideband, WatchCase, WristSize,
  Contactless, Contrast, Cube, FaceId, Haptic, Lens, MapPin, Memory, NeuralEngine, PhotoMagic, Pixels, Precision,
  Flag, ScreenSize, SelfieVideo, SoftwareUpdate, Sun, ZoomIn,
} from '@/Components/Store/Icons';

// Ficha técnica de los productos: la llena el admin (Productos en la tienda) y la muestra la ficha pública.
// Se guarda en `atributos` de la publicación. La salud y los ciclos de batería salen del inventario
// (si allí no hay un porcentaje claro, se cargan a mano).

/** campo(clave, etiqueta, ejemplo, ícono, qué significa). `hint`: lo que lee el admin bajo el campo (de dónde sale el dato). */
const c = (key, label, placeholder, icon, ayuda) => ({ key, label, placeholder, icon, ayuda });

export const CAMPOS_AUTOMATICOS = ['salud_bateria', 'ciclos_bateria', 'bateria_sellada'];

const GRUPOS = {
  celular: [
    { id: 'pantalla', label: 'Pantalla', icon: Smartphone, campos: [
      c('tamano_pantalla', 'Tamaño de pantalla', '6,1 pulgadas', ScreenSize, 'Medida en diagonal de la pantalla.'),
      c('pantalla', 'Tipo de pantalla', 'Super Retina XDR (OLED) con HDR', Pixels, 'OLED: negros profundos y más contraste que LCD.'),
      c('resolucion', 'Resolución', '2.532 × 1.170 px a 460 ppi', Resolution, 'Más píxeles por pulgada, imagen más nítida.'),
      c('tasa_refresco', 'Frecuencia', '60 Hz', Refresh, 'Qué tan fluido se ve el movimiento en pantalla.'),
      c('funciones_pantalla', 'Funciones de pantalla', 'Dynamic Island · Pantalla siempre activa · True Tone', Island, 'Avisos en la Dynamic Island, pantalla que muestra la hora sin encenderse del todo y color que se adapta a la luz.'),
      c('brillo', 'Brillo', '800 nits (1.200 nits en HDR)', Sun, 'Qué tan bien se ve a plena luz del día.'),
      c('contraste', 'Contraste', '2.000.000:1 (típico)', Contrast, 'Diferencia entre el blanco más claro y el negro más oscuro.'),
      c('respuesta_tactil', 'Respuesta táctil', 'Respuesta háptica', Haptic, 'Cómo responde la pantalla al tocarla o mantener presionado.'),
    ] },
    { id: 'rendimiento', label: 'Rendimiento', icon: Cpu, campos: [
      c('chip', 'Chip', 'A14 Bionic', Cpu, 'El cerebro del equipo: define velocidad y eficiencia.'),
      c('capacidad', 'Almacenamiento', '128 GB', HardDrive, 'Espacio para fotos, videos y apps.'),
      { ...c('ram', 'Memoria RAM', '6 GB', Memory, 'Permite tener más apps abiertas sin que se recarguen. Apple no la publica; la confirman fuentes independientes.'),
        hint: 'La trae el modelo. Apple no la publica: sale de fuentes independientes que coinciden (informe del 2026-09-15).' },
      c('cpu_cores', 'CPU', '6 núcleos', Grid, 'Núcleos que reparten el trabajo del equipo.'),
      c('gpu_cores', 'GPU', '4 núcleos', Gpu, 'Potencia para juegos, video y efectos.'),
      c('neural_engine', 'Neural Engine', '16 núcleos', NeuralEngine, 'Acelera fotos, reconocimiento de voz y funciones inteligentes.'),
      c('apple_intelligence', 'Apple Intelligence', 'Compatible', Intelligence, 'Funciones inteligentes de Apple para redactar y hacer tareas diarias; su disponibilidad depende del idioma y la región.'),
    ] },
    { id: 'camaras', label: 'Cámaras', icon: Camera, campos: [
      c('sistema_camaras', 'Cámaras traseras', 'Doble de 12 MP', Camera, 'Cuántas cámaras tiene atrás y de qué tipo.'),
      c('camara_principal', 'Cámara principal', '12 MP · estabilización óptica', Lens, 'La cámara de uso diario, con más detalle.'),
      c('camara_ultra', 'Ultra gran angular', '12 MP · 0,5x', Aperture, 'Encuadra más escena en espacios cerrados o paisajes.'),
      c('teleobjetivo', 'Teleobjetivo', '12 MP · zoom óptico 2x', Telephoto, 'Acerca sin perder calidad.'),
      c('zoom_optico', 'Zoom óptico', '0,5x, 1x y 2x', ZoomIn, 'Niveles de acercamiento con calidad óptica.'),
      c('lidar', 'Escáner LiDAR', 'Sí', Scan, 'Enfoca rápido con poca luz y mejora la realidad aumentada.'),
      c('funciones_foto', 'Funciones de foto', 'Modo Noche · Deep Fusion', PhotoMagic, 'Lo que hace el equipo para mejorar cada foto.'),
      c('video', 'Grabación de video', '4K hasta 60 fps', Video, 'Calidad máxima con la que graba.'),
      c('camara_frontal', 'Cámara frontal', '12 MP TrueDepth', Selfie, 'Para selfies y videollamadas.'),
      c('video_frontal', 'Video frontal', '4K hasta 60 fps', SelfieVideo, 'Calidad de video de la cámara frontal.'),
    ] },
    { id: 'bateria', label: 'Batería y carga', icon: Battery, campos: [
      c('salud_bateria', 'Salud de batería', '', Battery, 'Capacidad máxima frente a una batería nueva.'),
      { ...c('bateria_mah', 'Capacidad de batería', '4.325 mAh', BatteryCharge, 'Energía que guarda la batería nueva. Apple no la publica; la confirman fuentes independientes.'),
        hint: 'La trae el modelo y es la de fábrica: la salud de batería dice cuánto conserva este equipo. Apple no la publica; sale de fuentes independientes.' },
      c('autonomia', 'Autonomía', 'Hasta 17 h de video', Clock, 'Duración aproximada con una carga completa.'),
      c('carga', 'Carga rápida', '50 % en 30 min con 20 W', Plug, 'Cuánto carga en poco tiempo.'),
      c('carga_inalambrica', 'Carga inalámbrica', 'MagSafe hasta 15 W · Qi2 · Qi', Magnet, 'Cargadores sin cable compatibles.'),
      c('puerto', 'Puerto', 'Lightning (USB 2)', Cable, 'Conector para cargar y pasar datos.'),
    ] },
    { id: 'conectividad', label: 'Conectividad', icon: Signal, campos: [
      c('red', 'Red móvil', '5G · LTE Gigabit', Signal, 'Velocidad de datos móviles compatible.'),
      c('sim', 'SIM', 'Doble SIM (nano-SIM y eSIM)', SimCard, 'Tipos de línea que acepta.'),
      c('wifi', 'Wi‑Fi', 'Wi‑Fi 6', Wifi, 'Estándar de conexión inalámbrica.'),
      c('bluetooth', 'Bluetooth', '5.0', Bluetooth, 'Para audífonos, relojes y accesorios.'),
      c('nfc', 'NFC', 'NFC con modo lectura', Contactless, 'Para pagos y lectura de etiquetas.'),
      c('banda_ultraancha', 'Banda ultraancha', 'De segunda generación', Precision, 'Ubica con precisión AirTag y otros equipos Apple.'),
      c('thread', 'Thread', 'Sí', Mesh, 'Red para conectar accesorios de casa inteligente compatibles.'),
      c('gps', 'Ubicación', 'GPS, GLONASS, Galileo, QZSS y BeiDou', MapPin, 'Sistemas de satélites que usa para ubicarse.'),
      { ...c('biometria', 'Desbloqueo', 'Face ID', FaceId, 'Cómo se desbloquea de forma segura.'), iconoPara: (v) => (/Touch ID/i.test(v) ? Fingerprint : FaceId) },
      c('seguridad', 'Seguridad', 'Emergencia SOS · Detección de accidentes', ShieldCheck, 'Funciones para pedir ayuda en una emergencia.'),
    ] },
    { id: 'diseno', label: 'Diseño', icon: Palette, campos: [
      c('color', 'Color', 'Azul', Palette, 'Acabado exterior del equipo.'),
      c('material', 'Materiales', 'Aluminio con frente Ceramic Shield', Cube, 'De qué está hecho el cuerpo.'),
      c('resistencia', 'Resistencia al agua', 'IP68 · hasta 6 m durante 30 min', Droplet, 'Protección contra salpicaduras, agua y polvo.'),
      c('dimensiones', 'Dimensiones', '146,7 × 71,5 × 7,4 mm', Ruler, 'Alto, ancho y grosor.'),
      c('peso', 'Peso', '164 g', Scale, 'Peso del equipo sin funda.'),
      c('boton_accion', 'Botón Acción', 'Sí', ActionButton, 'Botón lateral configurable que reemplaza al de sonido/silencio.'),
      c('control_camara', 'Control de Cámara', 'Sí', CameraControl, 'Acceso más rápido a las herramientas de foto y video desde el costado del equipo.'),
    ] },
    { id: 'sistema', label: 'Sistema', icon: Globe, campos: [
      { ...c('sistema_operativo', 'Sistema operativo', 'iOS 18', Layers, 'Versión instalada al momento de la venta.'),
        hint: 'Es de cada equipo, no del modelo: míralo en Ajustes > General > Información. Si lo dejas vacío, no se muestra.' },
      c('lanzamiento_so', 'Salió con', 'iOS 14', Flag, 'Versión de fábrica; el equipo puede estar actualizado.'),
      c('ultimo_ios', 'Última versión de iOS', 'iOS 27', SoftwareUpdate, 'La versión más reciente que puede instalar; define hasta cuándo recibe funciones y parches.'),
      c('modelo', 'Número de modelo', 'A2403', TagIcon, 'Identificación del modelo de Apple.'),
      c('generacion', 'Año', '2020', Calendar, 'Año de lanzamiento.'),
    ] },
  ],
  computadora: [
    { id: 'pantalla', label: 'Pantalla', icon: Display, campos: [
      c('tamano_pantalla', 'Tamaño de pantalla', '13,6 pulgadas', Laptop, 'Medida en diagonal de la pantalla.'),
      c('pantalla', 'Tipo de pantalla', 'Liquid Retina (IPS)', Pixels, 'Tecnología de la pantalla: define brillo, contraste y colores.'),
      c('resolucion', 'Resolución', '2.560 × 1.664 px a 224 ppi', Resolution, 'Más píxeles por pulgada, imagen más nítida.'),
      c('tasa_refresco', 'Frecuencia', 'ProMotion, adaptativa hasta 120 Hz', Refresh, 'Qué tan fluido se ve el movimiento en pantalla.'),
      c('brillo', 'Brillo', '500 nits', Sun, 'Qué tan bien se ve con luz fuerte.'),
      c('funciones_pantalla', 'Colores y funciones', 'Gama cromática amplia (P3) · True Tone', Contrast, 'Colores que muestra y funciones que ajustan la imagen.'),
      c('pantallas_externas', 'Monitores externos', 'Hasta dos monitores de hasta 6K a 60 Hz', ExternalDisplay, 'Cuántos monitores se pueden conectar a la vez.'),
    ] },
    { id: 'rendimiento', label: 'Rendimiento', icon: Cpu, campos: [
      { ...c('chip', 'Chip', 'Apple M4', Cpu, 'El cerebro del equipo: define velocidad y eficiencia.'),
        hint: 'Sale del inventario al publicar, con el nombre oficial si el modelo lo reconoce.' },
      c('cpu_cores', 'CPU', '10 núcleos (4 de rendimiento y 6 de eficiencia)', Grid, 'Núcleos para tareas generales y multitarea.'),
      { ...c('gpu_cores', 'GPU', '10 núcleos · Trazado de rayos por hardware', Gpu, 'Potencia para gráficos, video y juegos.'), familias: ['mac'] },
      { ...c('gpu', 'Tarjeta gráfica', 'NVIDIA GeForce RTX 4050 de 6 GB GDDR6', GraphicsCard, 'La GPU dedicada: define cómo corren los juegos, el video y el 3D.'), familias: ['pc'] },
      { ...c('neural_engine', 'Neural Engine', '16 núcleos', NeuralEngine, 'Acelera las funciones de inteligencia artificial.'), familias: ['mac'] },
      { ...c('ram', 'Memoria RAM', '16 GB de memoria unificada', Memory, 'Permite tener más apps y pestañas abiertas con fluidez.'),
        hint: 'Sale del inventario al publicar.' },
      { ...c('almacenamiento', 'Almacenamiento', '512 GB', HardDrive, 'Espacio para archivos y apps.'), hint: 'Sale del inventario al publicar.' },
      { ...c('ampliacion', 'Ampliación', 'Segunda ranura M.2 libre para otro SSD', Upgrade, 'Qué se le puede agregar o cambiar después: memoria o un segundo disco.'), familias: ['pc'] },
      { ...c('ancho_banda', 'Ancho de banda de memoria', '120 GB/s', Bandwidth, 'Qué tan rápido el chip mueve datos con la memoria.'), familias: ['mac'] },
      { ...c('apple_intelligence', 'Apple Intelligence', 'Compatible', Intelligence, 'Funciones inteligentes de Apple para redactar y hacer tareas diarias; su disponibilidad depende del idioma y la región.'), familias: ['mac'] },
    ] },
    { id: 'bateria', label: 'Batería y carga', icon: Battery, campos: [
      c('salud_bateria', 'Salud de batería', '', Battery, 'Capacidad máxima frente a una batería nueva.'),
      c('ciclos_bateria', 'Ciclos de carga', '', BatteryCycle, 'Cargas completas acumuladas: menos, mejor.'),
      c('autonomia', 'Autonomía', 'Hasta 18 h de video', Clock, 'Duración aproximada con una carga completa.'),
      c('bateria_wh', 'Batería', '53,8 Wh', BatteryCharge, 'Energía que guarda la batería nueva.'),
      c('cargador', 'Cargador', 'Adaptador USB‑C de 35 W', Plug, 'Adaptador que trae el equipo nuevo.'),
      c('carga', 'Carga', 'Carga por MagSafe 3', Magnet, 'Cómo se carga y con qué carga rápido.'),
    ] },
    { id: 'conectividad', label: 'Conectividad', icon: Cable, campos: [
      c('puertos', 'Puertos', 'Dos Thunderbolt 4 · MagSafe 3', Ports, 'Conectores para cargar, monitores y accesorios.'),
      c('wifi', 'Wi‑Fi', 'Wi‑Fi 6E (802.11ax)', Wifi, 'Estándar de conexión inalámbrica.'),
      c('bluetooth', 'Bluetooth', '5.3', Bluetooth, 'Para audífonos, mouse y accesorios.'),
      c('ethernet', 'Ethernet', 'Gigabit Ethernet', Ethernet, 'Conexión a internet por cable.'),
      { ...c('thread', 'Thread', 'Sí', Mesh, 'Red para conectar accesorios de casa inteligente compatibles.'), familias: ['mac'] },
    ] },
    { id: 'camara_audio', label: 'Cámara y audio', icon: Camera, campos: [
      c('camara', 'Cámara', 'Cámara FaceTime HD de 1080p', Webcam, 'Para videollamadas.'),
      c('audio', 'Parlantes', 'Cuatro parlantes con Audio Espacial', Speaker, 'Sistema de sonido integrado.'),
      c('microfonos', 'Micrófonos', 'Tres micrófonos', Mic, 'Para llamadas y grabaciones con voz clara.'),
    ] },
    { id: 'entrada', label: 'Teclado y trackpad', icon: Keyboard, campos: [
      c('teclado', 'Teclado', 'Magic Keyboard retroiluminado con Touch ID', Keyboard, 'Tipo de teclado e iluminación.'),
      c('trackpad', 'Trackpad', 'Force Touch', Trackpad, 'Superficie para mover el cursor y hacer gestos.'),
      { ...c('biometria', 'Touch ID', 'Touch ID en el teclado', Fingerprint, 'Desbloqueo y pagos con tu huella.'), familias: ['mac'] },
    ] },
    { id: 'diseno', label: 'Diseño', icon: Palette, campos: [
      { ...c('color', 'Color', 'Plata', Palette, 'Acabado exterior del equipo.'), hint: 'Sale del inventario al publicar.' },
      c('material', 'Material', 'Aluminio 100 % reciclado', Cube, 'De qué está hecho el cuerpo.'),
      c('dimensiones', 'Dimensiones', '30,41 × 21,5 cm · 1,13 cm de grosor', Ruler, 'Ancho, profundidad y grosor.'),
      c('peso', 'Peso', '1,24 kg', Scale, 'Peso del equipo.'),
    ] },
    { id: 'sistema', label: 'Sistema', icon: Globe, campos: [
      { ...c('sistema_operativo', 'Sistema operativo', 'macOS Tahoe 26', Layers, 'Versión instalada al momento de la venta.'),
        hint: 'Es de cada equipo, no del modelo: en una Mac, menú Apple > Acerca de esta Mac; en Windows, Configuración > Sistema > Información. Si lo dejas vacío, no se muestra.' },
      c('lanzamiento_so', 'Salió con', 'macOS Sonoma 14', Flag, 'Versión de fábrica; el equipo puede estar actualizado.'),
      { ...c('ultimo_so', 'Última versión de macOS', 'macOS 27 Golden Gate', SoftwareUpdate, 'La versión más reciente que puede instalar; define hasta cuándo recibe funciones y parches.'), familias: ['mac'] },
      { ...c('seguridad', 'Seguridad', 'TPM 2.0 · Tapa de privacidad en la cámara', ShieldCheck, 'Protección del equipo y de tus datos.'), familias: ['pc'] },
      c('modelo', 'Modelo', 'Mac15,12', TagIcon, 'Identificador del fabricante (en una Mac: Acerca de esta Mac › Informe del sistema).'),
      c('generacion', 'Año', '2024', Calendar, 'Año de lanzamiento.'),
    ] },
  ],
  // iPad, Apple Watch, AirPods y accesorios de Apple (Apple Pencil, Magic Mouse). Cada familia de la base de productos Apple
  // (productos_apple.php) ve sus campos; los que no llevan `familias` son de todas. La capacidad, el color y la salud de la
  // batería salen de la unidad del inventario.
  producto_apple: [
    { id: 'pantalla', label: 'Pantalla', icon: Display, campos: [
      { ...c('tamano_pantalla', 'Tamaño de pantalla', '11 pulgadas', ScreenSize, 'Medida en diagonal de la pantalla.'), familias: ['ipad', 'otra_marca'] },
      { ...c('tamano_caja', 'Tamaño de la caja', '46 mm', WatchCase, 'Alto de la caja del reloj: define el tamaño de la pantalla y qué correas le quedan.'), familias: ['watch'] },
      { ...c('pantalla', 'Tipo de pantalla', 'Liquid Retina', Pixels, 'La tecnología de la pantalla.'), familias: ['ipad', 'watch', 'otra_marca'] },
      { ...c('resolucion', 'Resolución', '2.360 × 1.640 px a 264 ppi', Resolution, 'Más píxeles por pulgada, imagen más nítida.'), familias: ['ipad', 'watch', 'otra_marca'] },
      { ...c('brillo', 'Brillo', '500 nits', Sun, 'Qué tan bien se ve con mucha luz, incluso al aire libre.'), familias: ['ipad', 'watch'] },
      { ...c('funciones_pantalla', 'Funciones de pantalla', 'True Tone · Revestimiento antirreflejo', Contrast, 'Color que se adapta a la luz, capas contra reflejos y huellas, y pantalla siempre activa.'), familias: ['ipad', 'watch', 'otra_marca'] },
      { ...c('lapiz', 'Apple Pencil compatible', 'Apple Pencil (USB‑C)', ApplePencil, 'Con qué Apple Pencil funciona para escribir y dibujar.'), familias: ['ipad'] },
    ] },
    { id: 'rendimiento', label: 'Rendimiento', icon: Cpu, campos: [
      { ...c('chip', 'Chip', 'A16', Cpu, 'El cerebro del equipo: define la velocidad y cuánto rinde la batería.'), familias: ['ipad', 'watch', 'airpods', 'otra_marca'] },
      { ...c('cpu_cores', 'CPU', '6 núcleos', CpuCores, 'Los núcleos que mueven las apps y el sistema.'), familias: ['ipad', 'otra_marca'] },
      { ...c('gpu_cores', 'GPU', '4 núcleos', Gpu, 'Potencia para gráficos, video y juegos.'), familias: ['ipad'] },
      { ...c('neural_engine', 'Neural Engine', '16 núcleos', NeuralEngine, 'Acelera las funciones de inteligencia artificial.'), familias: ['ipad', 'watch'] },
      { ...c('ram', 'Memoria RAM', '8 GB', Memory, 'Permite tener más apps abiertas sin que se recarguen.'), familias: ['ipad', 'otra_marca'] },
      { ...c('capacidad', 'Almacenamiento', '128 GB', HardDrive, 'Espacio para apps, fotos, música y archivos.'), familias: ['ipad', 'watch'] },
      { ...c('ancho_banda', 'Ancho de banda de memoria', '120 GB/s', Bandwidth, 'Qué tan rápido el chip mueve datos con la memoria.'), familias: ['ipad'] },
      { ...c('apple_intelligence', 'Apple Intelligence', 'Compatible', Intelligence, 'Funciones inteligentes de Apple para escribir, resumir y hacer tareas diarias; su disponibilidad depende del idioma y la región.'), familias: ['ipad', 'watch'] },
    ] },
    { id: 'camaras', label: 'Cámaras', icon: Camera, campos: [
      { ...c('camara_principal', 'Cámara trasera', 'Gran angular de 12 MP', Camera, 'Para fotos, documentos y escanear.'), familias: ['ipad', 'otra_marca'] },
      { ...c('video', 'Grabación de video', '4K a 60 fps', Video, 'La mejor calidad de video que graba.'), familias: ['ipad', 'otra_marca'] },
      { ...c('camara_frontal', 'Cámara frontal', 'Center Stage de 12 MP', Selfie, 'Videollamadas y selfies; Center Stage te mantiene en el cuadro.'), familias: ['ipad', 'otra_marca'] },
    ] },
    { id: 'sonido', label: 'Sonido', icon: Speaker, campos: [
      { ...c('audio', 'Sonido', 'Parlantes estéreo', Speaker, 'Parlantes o controladores de audio.'), familias: ['ipad', 'watch', 'airpods', 'otra_marca'] },
      { ...c('cancelacion_ruido', 'Cancelación de ruido', 'Cancelación Activa de Ruido · Modo Ambiente', Noise, 'Baja el ruido de afuera o deja pasar lo que pasa a tu alrededor.'), familias: ['airpods'] },
      { ...c('audio_espacial', 'Audio Espacial', 'Con seguimiento dinámico de la cabeza', SpatialAudio, 'Sonido envolvente que se ubica a tu alrededor y sigue el movimiento de tu cabeza.'), familias: ['airpods'] },
      { ...c('microfonos', 'Micrófonos', 'Dos micrófonos', Mic, 'Para llamadas, grabar y hablar con Siri.'), familias: ['ipad', 'watch', 'airpods'] },
      { ...c('traduccion', 'Traducción en Vivo', 'Con un iPhone compatible', Translate, 'Traduce una conversación en tus audífonos, con los idiomas que Apple habilita.'), familias: ['airpods'] },
    ] },
    { id: 'funciones', label: 'Funciones', icon: Sparkles, campos: [
      { ...c('funciones', 'Funciones', 'Aislamiento de Voz', Sparkles, 'Lo que puedes hacer con él.'), familias: ['airpods', 'accesorio_apple', 'otra_marca'] },
      { ...c('controles', 'Controles', 'Digital Crown · Botón lateral', Controls, 'Cómo se maneja sin sacar el iPhone.'), familias: ['watch', 'airpods'] },
      { ...c('sensores', 'Sensores', 'Frecuencia cardiaca · Acelerómetro', Scan, 'Lo que mide y detecta.'), familias: ['watch', 'airpods'] },
      { ...c('salud', 'Salud', 'Frecuencia cardiaca · Oxígeno en sangre · Sueño', HeartPulse, 'Mediciones y apps de salud; algunas no están disponibles en todos los países.'), familias: ['watch'] },
      { ...c('salud_auditiva', 'Salud auditiva', 'Protección Auditiva', Ear, 'Funciones para cuidar y medir tu audición; dependen del país.'), familias: ['airpods'] },
      { ...c('seguridad', 'Seguridad', 'Emergencia SOS · Detección de Caídas', ShieldCheck, 'Pide ayuda en una emergencia, incluso si tú no puedes.'), familias: ['watch'] },
      { ...c('resistencia', 'Resistencia', 'IP54 al polvo, al sudor y al agua', Droplet, 'Protección contra el agua, el polvo y el sudor.'), familias: ['watch', 'airpods', 'otra_marca'] },
    ] },
    { id: 'bateria', label: 'Batería y carga', icon: Battery, campos: [
      c('salud_bateria', 'Salud de batería', '', Battery, 'Capacidad máxima frente a una batería nueva.'),
      c('autonomia', 'Autonomía', 'Hasta 10 h de video', Clock, 'Duración aproximada con una carga completa.'),
      { ...c('bateria_wh', 'Batería', '28,93 Wh', BatteryCharge, 'Capacidad de la batería.'), familias: ['ipad', 'otra_marca'] },
      c('carga', 'Carga', 'Por USB‑C', Plug, 'Cómo y qué tan rápido se carga.'),
      { ...c('estuche', 'Estuche', 'Estuche de carga MagSafe (USB‑C)', ChargingCase, 'Dónde se guardan y cómo se cargan.'), familias: ['airpods'] },
    ] },
    { id: 'conexiones', label: 'Conexiones', icon: Signal, campos: [
      { ...c('red', 'Red celular', 'LTE y UMTS', Signal, 'Datos móviles sin depender del Wi‑Fi, con un plan de un operador compatible.'), familias: ['ipad', 'watch', 'otra_marca'] },
      { ...c('sim', 'SIM', 'eSIM', SimCard, 'El tipo de SIM que usa.'), familias: ['ipad', 'otra_marca'] },
      { ...c('wifi', 'Wi‑Fi', 'Wi‑Fi 6E', Wifi, 'Estándar de conexión inalámbrica.'), familias: ['ipad', 'watch', 'otra_marca'] },
      c('bluetooth', 'Bluetooth', '5.3', Bluetooth, 'Para conectarlo con tus equipos.'),
      { ...c('banda_ultraancha', 'Banda ultraancha', 'Chip de segunda generación', UltraWideband, 'Para encontrarlo con precisión con la app Encontrar.'), familias: ['watch', 'airpods'] },
      { ...c('thread', 'Thread', 'Sí', Mesh, 'Red para conectar accesorios de casa inteligente compatibles.'), familias: ['ipad'] },
      { ...c('puerto', 'Conector', 'USB‑C', UsbC, 'El puerto para cargar y conectar.'), familias: ['ipad', 'airpods', 'accesorio_apple', 'otra_marca'] },
      { ...c('pantalla_externa', 'Pantalla externa', 'Un monitor de hasta 4K', ExternalDisplay, 'A qué monitor se puede conectar.'), familias: ['ipad'] },
      { ...c('gps', 'Ubicación', 'GPS · Brújula digital', MapPin, 'Cómo sabe dónde estás, para mapas y la app Encontrar.'), familias: ['ipad', 'watch', 'otra_marca'] },
      { ...c('compatibilidad', 'Compatible con', 'iPhone con iOS 18', Link, 'Equipos con los que funciona.'), familias: ['watch', 'airpods', 'accesorio_apple', 'otra_marca'] },
    ] },
    { id: 'diseno', label: 'Diseño', icon: Palette, campos: [
      c('color', 'Color', 'Azul', Palette, 'Acabado exterior.'),
      { ...c('biometria', 'Desbloqueo', 'Touch ID', Fingerprint, 'Desbloqueo y pagos con tu huella.'), familias: ['ipad', 'otra_marca'] },
      { ...c('material', 'Materiales', 'Aluminio', Layers, 'De qué está hecho.'), familias: ['ipad', 'watch', 'otra_marca'] },
      c('dimensiones', 'Medidas', '248,6 × 179,5 × 7 mm', Ruler, 'Alto, ancho y grosor.'),
      c('peso', 'Peso', '477 g', Scale, 'Peso del producto.'),
      { ...c('talla', 'Talla de muñeca', 'De 140 a 245 mm', WristSize, 'Para qué muñecas le quedan las correas.'), familias: ['watch'] },
    ] },
    { id: 'sistema', label: 'Sistema y modelo', icon: SoftwareUpdate, campos: [
      { ...c('lanzamiento_so', 'Salió con', 'iPadOS 18', Flag, 'La versión del sistema con la que salió a la venta.'), familias: ['ipad', 'watch'] },
      { ...c('ultimo_so', 'Última versión del sistema', 'iPadOS 27', SoftwareUpdate, 'La más reciente que puede instalar; define hasta cuándo recibe funciones y parches.'), familias: ['ipad', 'watch'] },
      { ...c('modelo', 'Número de modelo', 'A3354', TagIcon, 'Identificador del fabricante para esta versión.'), familias: ['ipad', 'watch', 'airpods', 'otra_marca'] },
      c('generacion', 'Año', '2025', Calendar, 'Año de lanzamiento.'),
      { ...c('fabricante', 'Fabricante', 'Samsung', Factory, 'La marca que lo fabrica.'), familias: ['otra_marca'] },
    ] },
  ],
  // Accesorios. Cada familia de la base (cargador, vidrio, protector, funda, cable o accesorio) ve sus campos; los que no
  // llevan `familias` son de todas. La ficha sale de la base de accesorios (accesorios.php) y «Compatible con», del
  // nombre del inventario.
  producto_general: [
    { id: 'producto', label: 'Producto', icon: TagIcon, campos: [
      c('tipo', 'Tipo', 'Cargador de pared USB‑C', TagIcon, 'Qué es.'),
      c('modelo_compatible', 'Compatible con', 'iPhone 15 Pro', Smartphone, 'Modelos en los que calza o funciona.'),
      c('compatibilidad', 'Funciona con', 'iPhone, iPad y AirPods', Link, 'Equipos con los que se puede usar.'),
      c('fabricante', 'Fabricante', 'Apple (original)', Factory, 'Quién lo fabrica.'),
    ] },
    { id: 'carga', label: 'Carga', icon: Zap, campos: [
      c('potencia', 'Potencia', '20 W', Zap, 'Cuánta energía entrega: con más vatios carga más rápido, si el equipo lo acepta.'),
      { ...c('potencia_maxima', 'Potencia máxima', 'Hasta 60 W por momentos', PowerBoost, 'Lo más que entrega por momentos, según el equipo y la temperatura.'), familias: ['cargador'] },
      { ...c('carga_rapida', 'Carga rápida', 'Hasta 50 % en unos 35 minutos', FastCharge, 'Cuánto carga en poco tiempo y con qué equipos.'), familias: ['cargador', 'cable'] },
      c('puerto', 'Conector', 'Un puerto USB‑C', UsbC, 'Tipo de conector.'),
      { ...c('salidas', 'Salidas', '5 V ⎓ 3 A · 9 V ⎓ 2,22 A', Voltage, 'Voltajes y corrientes que entrega, como dice su etiqueta.'), familias: ['cargador'] },
      { ...c('protocolos', 'Tecnología de carga', 'USB Power Delivery', PowerDelivery, 'El estándar con el que cargador y equipo se ponen de acuerdo para cargar rápido.'), familias: ['cargador'] },
      { ...c('entrada', 'Corriente', '100 a 240 V ~ 50/60 Hz', Plug, 'Con qué corriente funciona: de 100 a 240 V sirve con los 220 V de Bolivia.'), familias: ['cargador'] },
      { ...c('cable', 'Cable', 'Se vende por separado', Cable, 'Si trae cable o se compra aparte.'), familias: ['cargador'] },
      c('largo_cable', 'Largo del cable', '1 m', Ruler, 'Longitud del cable.'),
      { ...c('normas', 'Normas de seguridad', 'Certificado para las normas de cada país', Certificate, 'Qué normas de seguridad cumple.'), familias: ['cargador'] },
      { ...c('pruebas', 'Pruebas independientes', 'Eficiencia de 85 % a 90 %', Lab, 'Lo que midieron laboratorios que no son la marca.'), familias: ['cargador'] },
      { ...c('bateria', 'Batería', '20.000 mAh', Battery, 'Capacidad de la batería.'), familias: ['accesorio'] },
      { ...c('autonomia', 'Autonomía', 'Hasta 80 h de uso', Clock, 'Cuánto dura con una carga.'), familias: ['accesorio'] },
    ] },
    { id: 'proteccion', label: 'Protección y diseño', icon: ShieldCheck, campos: [
      c('material', 'Material', 'Silicona', Layers, 'De qué está hecho.'),
      { ...c('endurecido', 'Cómo se endurece', 'Por intercambio iónico', Compression, 'El proceso que le da su resistencia al vidrio.'), familias: ['vidrio'] },
      c('proteccion', 'Protección', 'Protege de rayones y golpes', ShieldCheck, 'Qué tanto protege al equipo.'),
      { ...c('dureza', 'Dureza', '9H', Diamond, 'Resistencia a los rayones en la escala de lápiz: 9H es la más alta.'), familias: ['vidrio', 'protector'] },
      { ...c('filtro', 'Filtro', 'Antiespía', ScreenFilter, 'Lo que hace además de proteger: privacidad, menos reflejos o menos luz azul.'), familias: ['vidrio'] },
      { ...c('recubrimiento', 'Recubrimiento', 'Oleofóbico', Oleophobic, 'Capa que repele la grasa y las huellas.'), familias: ['vidrio', 'protector'] },
      { ...c('instalacion', 'Instalación', 'Con bandeja que lo alinea solo', Install, 'Cómo se coloca.'), familias: ['vidrio', 'protector'] },
      { ...c('magsafe', 'MagSafe', 'Sí', Magnet, 'Se acopla con imanes a cargadores y accesorios.'), familias: ['funda', 'accesorio'] },
      c('acabado', 'Acabado', 'Mate', Brush, 'Textura y terminación.'),
      c('color', 'Color', 'Negro', Palette, 'Color del accesorio.'),
      c('coleccion', 'Colección', 'MYSKIN Urban', Collection, 'Línea o colección del diseño.'),
    ] },
    { id: 'funciones', label: 'Funciones', icon: Sparkles, campos: [
      { ...c('funciones', 'Funciones', 'Música y alarmas con la voz', Sparkles, 'Lo que puedes hacer con él.'), familias: ['accesorio'] },
      { ...c('asistente', 'Asistente de voz', 'Alexa', Voice, 'Con qué asistente se maneja por voz.'), familias: ['accesorio'] },
      { ...c('casa_inteligente', 'Casa inteligente', 'Hub con Zigbee, Thread y Matter', SmartHome, 'Para controlar luces, enchufes y otros equipos compatibles.'), familias: ['accesorio'] },
      { ...c('audio', 'Sonido', 'Woofer de 2,5" y tweeter de 0,8"', Speaker, 'Parlantes y sonido.'), familias: ['accesorio'] },
      { ...c('microfonos', 'Micrófonos', 'Con botón para apagarlos', Mic, 'Para hablar con el asistente o en llamadas.'), familias: ['accesorio'] },
      { ...c('sensores', 'Sensores', 'Acelerómetro y giroscopio', Scan, 'Lo que detecta: movimiento, presencia o sonido.'), familias: ['accesorio'] },
      { ...c('haptica', 'Respuesta háptica', 'Dos actuadores', Haptic, 'Vibraciones precisas que te hacen sentir lo que pasa en el juego.'), familias: ['accesorio'] },
      { ...c('gatillos', 'Gatillos adaptativos', 'Resistencia que cambia', Trigger, 'Gatillos que se ponen más duros o más suaves según el juego.'), familias: ['accesorio'] },
      { ...c('resolucion', 'Imagen', '4K Ultra HD · HDR10+', Resolution, 'Calidad de imagen que entrega a la TV.'), familias: ['accesorio'] },
      { ...c('control', 'Control', 'Control remoto por voz', Remote, 'Cómo se maneja.'), familias: ['accesorio'] },
      { ...c('procesador', 'Procesador', 'MediaTek de 4 núcleos', Cpu, 'Define qué tan rápido responde.'), familias: ['accesorio'] },
      { ...c('memoria', 'Memoria', '1 GB de RAM · 8 GB de almacenamiento', Memory, 'Memoria y espacio para apps.'), familias: ['accesorio'] },
      { ...c('teclado', 'Teclado', 'Teclas mecánicas', Keyboard, 'Tipo de teclas y distribución.'), familias: ['accesorio'] },
      { ...c('precision', 'Precisión', 'De 800 a 2.400 DPI', Precision, 'Qué tan fino se mueve el cursor.'), familias: ['accesorio'] },
      { ...c('iluminacion', 'Luces', 'Retroiluminación LED', Sun, 'Iluminación del equipo.'), familias: ['accesorio'] },
      { ...c('juego', 'Juego', 'Plataformas en 3D · 1 jugador', Gamepad, 'Género y cuántos juegan.'), familias: ['accesorio'] },
    ] },
    { id: 'conexion', label: 'Conexión y medidas', icon: Signal, campos: [
      { ...c('conectividad', 'Conexión', 'Bluetooth 5.1 · hasta 3 equipos', Signal, 'Cómo se conecta con tus equipos.'), familias: ['accesorio'] },
      { ...c('wifi', 'Wi‑Fi', 'Wi‑Fi 6E', Wifi, 'Estándar de conexión inalámbrica.'), familias: ['accesorio'] },
      { ...c('bluetooth', 'Bluetooth', '5.3', Bluetooth, 'Para conectar el celular y otros equipos.'), familias: ['accesorio'] },
      c('dimensiones', 'Medidas', '10,8 × 10,8 × 9,9 cm', Cube, 'Alto, ancho y fondo.'),
      c('peso', 'Peso', '505 g', Scale, 'Peso del producto.'),
    ] },
  ],
};

// Lo más importante de cada tipo, en el orden en que se destaca arriba de la ficha
const DESTACADOS = {
  celular: ['tamano_pantalla', 'chip', 'capacidad', 'sistema_camaras', 'salud_bateria', 'autonomia'],
  computadora: ['chip', 'gpu', 'ram', 'almacenamiento', 'tamano_pantalla', 'salud_bateria', 'autonomia'],   // la gpu, solo en las PC
  producto_apple: ['tamano_pantalla', 'tamano_caja', 'chip', 'capacidad', 'cancelacion_ruido', 'audio_espacial', 'salud_bateria', 'autonomia', 'compatibilidad'],
  // Accesorios: se muestran los seis primeros que tenga la ficha (un cargador, su potencia y su carga rápida; un vidrio,
  // su material y cómo se endurece; una Alexa, su sonido y su hub de casa inteligente…)
  producto_general: [
    'potencia', 'potencia_maxima', 'carga_rapida', 'puerto', 'protocolos', 'modelo_compatible', 'material', 'filtro', 'endurecido',
    'proteccion', 'dureza', 'magsafe', 'asistente', 'audio', 'casa_inteligente', 'resolucion', 'control', 'haptica', 'gatillos',
    'conectividad', 'teclado', 'precision', 'bateria', 'autonomia', 'juego', 'compatibilidad', 'fabricante', 'color',
  ],
};

// Atributos de publicaciones anteriores con otro nombre
const EXTRA = {
  bateria: c('bateria', 'Batería', '', Battery), almacenamiento: c('almacenamiento', 'Almacenamiento', '', HardDrive),
  camara: c('camara', 'Cámara', '', Camera), conectividad: c('conectividad', 'Conectividad', '', Signal),
  conectores: c('conectores', 'Conectores', '', Cable), ciclos_bateria: c('ciclos_bateria', 'Ciclos de carga', '', Refresh),
  numero_serie: { ...c('numero_serie', 'Número de serie', '', TagIcon, 'Identifica al equipo para garantía.'), mono: true },
};

export const gruposFicha = (tipo) => GRUPOS[tipo] ?? [];
/** Los campos de un grupo para una familia (Mac o PC; iPad, Apple Watch, AirPods…; cargador, vidrio…). Sin familia conocida, todos. */
export const camposDeFamilia = (grupo, familia = null) => grupo.campos.filter((c) => !familia || !c.familias || c.familias.includes(familia));

const todos = Object.values(GRUPOS).flat().flatMap((g) => g.campos);
/** El campo de esa clave: primero en los grupos del tipo (el «chip» de una Mac no es el de un iPhone) y si no, en cualquiera. */
const campoDe = (key, tipo = null) => (tipo && GRUPOS[tipo]?.flatMap((g) => g.campos).find((x) => x.key === key))
  ?? todos.find((x) => x.key === key) ?? EXTRA[key];
export const etiquetaDe = (key) => campoDe(key)?.label ?? String(key).replace(/_/g, ' ').replace(/^\w/, (l) => l.toUpperCase());

const util = (v) => v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '-';

/** Porcentaje de batería (número) a partir de lo guardado. */
export function porcentajeBateria(atributos = {}) {
  const n = Number(String(atributos.salud_bateria ?? atributos.bateria ?? '').match(/\d{1,3}/)?.[0]);
  return n >= 1 && n <= 100 ? n : null;
}

export function valorDe(key, atributos = {}) {
  if (key === 'salud_bateria') {
    const pct = porcentajeBateria(atributos);
    if (atributos.bateria_sellada) return pct ? `${pct} %` : 'Sellada';
    return pct ? `${pct} %` : null;
  }
  if (key === 'autonomia' && atributos.autonomia_estimada_horas) return `≈ ${atributos.autonomia_estimada_horas} h de video`;
  if (key === 'ciclos_bateria') return util(atributos.ciclos_bateria) ? Number(atributos.ciclos_bateria).toLocaleString('es-BO') : null;
  const v = atributos[key];
  if (v === true) return 'Sí';
  return util(v) ? String(v) : null;
}

/** Batería dibujada con su nivel. */
export function BateriaNivel({ porcentaje, className = 'h-6 w-11', claro = false }) {
  const pct = Math.max(0, Math.min(100, Number(porcentaje) || 0));
  const color = pct >= 85 ? '#22c55e' : pct >= 75 ? '#f59e0b' : '#ef4444';
  return (
    <svg viewBox="0 0 30 16" className={className} role="img" aria-label={`Batería al ${pct} %`}>
      <rect x="1" y="1.5" width="25" height="13" rx="3.5" fill="none" stroke={claro ? '#ffffff' : 'currentColor'} strokeWidth="1.4" opacity="0.6" />
      <rect x="27.25" y="5.5" width="2" height="5" rx="1" fill={claro ? '#ffffff' : 'currentColor'} opacity="0.6" />
      <rect x="3" y="3.5" width={21 * (pct / 100)} height="9" rx="2" fill={color} />
    </svg>
  );
}

/** Nota corta bajo el valor de la batería. */
function notaBateria(atributos) {
  const pct = porcentajeBateria(atributos);
  if (atributos.bateria_sellada) return 'Batería nueva, en caja sellada.';
  if (pct == null) return null;
  if (pct >= 90) return 'Excelente: rinde como nueva.';
  if (pct >= 80) return 'Muy buena para el uso diario.';
  return 'Revisada; ideal si cargas seguido.';
}

/** Descripción bajo el valor: la de la batería y la autonomía dependen del equipo. */
function notaDe(campo, atributos) {
  if (campo.key === 'salud_bateria') return notaBateria(atributos);
  if (campo.key === 'autonomia' && atributos.autonomia_estimada_horas) {
    const pct = porcentajeBateria(atributos);
    return `Estimada con su batería al ${pct} %. Nuevo: hasta ${Number(atributos.autonomia_video_horas)} h.`;
  }
  return campo.ayuda;
}

/* ─── Piezas visuales ─── */

/**
 * Valor corto para las tarjetas de lo destacado: «Hasta 26 h de reproducción de video (20 h en streaming)» pasa a
 * «Hasta 26 h de video» con el detalle aparte, y «Doble de 12 MP (principal y ultra gran angular)», a «Doble de 12 MP».
 */
/** El dato en corto, para un recuadro: sin la nota de «; …» y solo la primera parte de una lista («6 GB», «A16»). */
export function valorCorto(key, atributos = {}) {
  const valor = valorDe(key, atributos);
  if (!valor || key === 'salud_bateria') return valor;
  return resumenDestacado(key, partir(String(valor), '; ')[0] ?? String(valor)).valor;
}

function resumenDestacado(key, valor) {
  if (key === 'autonomia') {
    const m = valor.match(/hasta (\d+(?:,\d+)?) h de reproducción de video(?: \((.+)\))?/i);
    if (m) return { valor: `Hasta ${m[1]} h de video`, detalle: m[2] ? conMayuscula(m[2]) : null };
  }
  // Una lista («40 W · …», «Hasta 50 % en 20 minutos (iPhone 17) · …») muestra su primera parte; el resto va al detalle
  const [primera = valor, ...resto] = partesDe(valor);
  const i = primera.indexOf(' (');
  if (primera.length > 24 && i > 0 && primera.endsWith(')')) {
    return { valor: primera.slice(0, i), detalle: conMayuscula(primera.slice(i + 2, -1)) };
  }
  return { valor: primera, detalle: resto.length ? conMayuscula(resto.join(' · ')) : null };
}

const colorBateria = (pct) => (pct >= 85 ? '#22c55e' : pct >= 75 ? '#f59e0b' : '#ef4444');

// Tarjetas de lo destacado: superficie lila sólida de la marca (resalta sobre la página sin degradés ni manchas),
// ícono sobre azul marino y textos derivados del mismo tono.
const DESTACADA = {
  fondo: '#E3E6F8',
  etiqueta: '#454B8A',
  nota: '#4A4F75',
};

function Destacada({ campo, valor, atributos, copia = false }) {
  const Icon = campo.iconoPara?.(valor) ?? campo.icon ?? Sparkles;
  const pct = campo.key === 'salud_bateria' ? porcentajeBateria(atributos) : null;
  const corto = resumenDestacado(campo.key, valor);
  const nota = corto.detalle ?? notaDe(campo, atributos);

  return (
    <li aria-hidden={copia || undefined}
      className="flex min-h-[188px] w-[76%] shrink-0 flex-col rounded-2xl p-5 sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]"
      style={{ background: DESTACADA.fondo }}>
      <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: 'var(--ab-navy)' }}>
        {pct ? <BateriaNivel porcentaje={pct} claro className="h-5 w-9" /> : <Icon className="h-[22px] w-[22px]" strokeWidth={1.6} />}
      </span>
      <span className="mt-auto pt-5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: DESTACADA.etiqueta }}>{campo.label}</span>
      <span className="mt-1 text-[1.25rem] font-extrabold leading-tight tracking-[-0.02em]" style={{ color: 'var(--ab-navy)' }}>{corto.valor}</span>
      {pct != null && (
        <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(1,20,70,0.12)' }} aria-hidden="true">
          <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: colorBateria(pct) }} />
        </span>
      )}
      {nota && <span className="mt-2 line-clamp-2 text-xs leading-snug" style={{ color: DESTACADA.nota }}>{nota}</span>}
    </li>
  );
}

const INTERVALO = 1500;   // cada cuánto pasa a la siguiente tarjeta
const DESLIZAR = 600;     // duración del deslizamiento

/**
 * Lo destacado en un carrusel que rota solo y sin fin: cada 1,5 s se desliza una tarjeta a la izquierda y la lista
 * vuelve a empezar sin saltos (se dibuja tres veces y, al llegar a una copia, se reubica sin animación). No se
 * detiene al pasar el mouse: solo fuera de la pantalla, con la pestaña oculta o con el botón de pausa. El punto
 * activo se llena mientras dura cada tarjeta. Con «reducir movimiento», cambia sin deslizarse.
 */
function CarruselDestacados({ destacados, atributos }) {
  const total = destacados.length;
  const vista = useRef(null);
  const toque = useRef(null);
  const [paso, setPaso] = useState(0);
  const [indice, setIndice] = useState(total);   // arranca en la copia del medio
  const indiceRef = useRef(total);
  const [pasos, setPasos] = useState(0);         // cuenta los avances: reubicar no reinicia el tiempo
  const [animar, setAnimar] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [visible, setVisible] = useState(true);
  const [pestanaVisible, setPestanaVisible] = useState(true);
  const [reducido, setReducido] = useState(false);

  // Ancho de un paso: una tarjeta más el espacio entre tarjetas
  useEffect(() => {
    const el = vista.current;
    if (!el) return undefined;
    const medir = () => {
      const tarjeta = el.querySelector('li');
      if (!tarjeta) return;
      setPaso(tarjeta.getBoundingClientRect().width + (parseFloat(getComputedStyle(tarjeta.parentElement).columnGap) || 16));
    };
    medir();
    const observer = new ResizeObserver(medir);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fuera de la pantalla o con la pestaña oculta no se mueve; y respeta «reducir movimiento»
  useEffect(() => {
    const el = vista.current;
    const observer = el ? new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 }) : null;
    if (el) observer.observe(el);
    const pestana = () => setPestanaVisible(!document.hidden);
    document.addEventListener('visibilitychange', pestana);
    const consulta = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const alCambiar = () => setReducido(Boolean(consulta?.matches));
    alCambiar();
    consulta?.addEventListener?.('change', alCambiar);
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', pestana);
      consulta?.removeEventListener?.('change', alCambiar);
    };
  }, []);

  // La transición se activa recién cuando ya se midió el paso (así no se ve un salto al cargar)
  useEffect(() => {
    if (!paso) return undefined;
    const r = requestAnimationFrame(() => setAnimar(true));
    return () => cancelAnimationFrame(r);
  }, [paso]);

  const corriendo = total > 1 && paso > 0 && !pausado && visible && pestanaVisible;
  const mover = (delta) => { setAnimar(true); setIndice((i) => i + delta); setPasos((n) => n + 1); };
  const irA = (i) => { setAnimar(true); setIndice(total + i); setPasos((n) => n + 1); };

  // Avanza solo cada 1,5 s; un avance a mano reinicia el tiempo, la reubicación entre copias no
  useEffect(() => {
    if (!corriendo) return undefined;
    const t = setTimeout(() => mover(1), INTERVALO);
    return () => clearTimeout(t);
  }, [corriendo, pasos]);

  // Al llegar a una copia, se reubica en la del medio sin animación. Se llama al terminar el deslizamiento y, por si
  // ese evento no llega (pestaña que se ocultó, «reducir movimiento»), también con un temporizador de respaldo.
  useEffect(() => { indiceRef.current = indice; }, [indice]);
  const reubicar = () => {
    const i = indiceRef.current;
    if (i >= total && i < total * 2) return;
    const nuevo = i >= total * 2 ? i - total : i + total;
    indiceRef.current = nuevo;
    setAnimar(false);
    setIndice(nuevo);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimar(true)));
  };
  useEffect(() => {
    if (total < 2) return undefined;
    const t = setTimeout(reubicar, reducido ? 0 : DESLIZAR + 80);
    return () => clearTimeout(t);
  }, [indice, reducido]);

  const alTocar = (e) => { toque.current = e.touches[0].clientX; };
  const alSoltar = (e) => {
    if (toque.current == null) return;
    const dx = e.changedTouches[0].clientX - toque.current;
    if (Math.abs(dx) > 35) mover(dx < 0 ? 1 : -1);
    toque.current = null;
  };

  const activo = ((indice % total) + total) % total;
  const lista = total > 1 ? [...destacados, ...destacados, ...destacados] : destacados;
  const desplazamiento = total > 1 ? indice * paso : 0;
  const boton = 'grid h-9 w-9 place-items-center rounded-full border bg-white transition-colors hover:border-[color:var(--ab-navy)]';

  return (
    <div aria-roledescription="carrusel" aria-label="Lo más importante">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>Lo más importante</p>
        {total > 1 && (
          <div className="flex items-center gap-2">
            <button type="button" className={boton} style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              onClick={() => setPausado((p) => !p)} aria-label={pausado ? 'Reanudar el carrusel' : 'Pausar el carrusel'}>
              {pausado ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
            <button type="button" className={`${boton} hidden sm:grid`} style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              onClick={() => mover(-1)} aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" className={`${boton} hidden sm:grid`} style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              onClick={() => mover(1)} aria-label="Siguiente"><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </div>

      <div ref={vista} className="-mx-4 overflow-hidden px-4 sm:mx-0 sm:px-0" onTouchStart={alTocar} onTouchEnd={alSoltar}>
        <ul className="flex gap-4" aria-live="off" onTransitionEnd={(e) => e.target === e.currentTarget && reubicar()}
          style={{
            transform: `translate3d(${-desplazamiento}px, 0, 0)`,
            transition: animar && !reducido ? `transform ${DESLIZAR}ms cubic-bezier(0.16, 1, 0.3, 1)` : 'none',
          }}>
          {lista.map(({ campo, valor }, i) => (
            <Destacada key={`${campo.key}-${i}`} campo={campo} valor={valor} atributos={atributos}
              copia={total > 1 && (i < total || i >= total * 2)} />
          ))}
        </ul>
      </div>

      {total > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {destacados.map(({ campo }, i) => (
            <button key={campo.key} type="button" onClick={() => irA(i)} aria-label={`Ver ${campo.label}`} aria-current={i === activo}
              className="relative h-1.5 overflow-hidden rounded-full transition-[width] duration-300"
              style={{ width: i === activo ? 28 : 6, background: i === activo ? 'rgba(1,20,70,0.14)' : 'var(--text-muted)' }}>
              {i === activo && (
                <span key={pasos} aria-hidden="true" className="absolute inset-0 origin-left rounded-full"
                  style={{ background: 'var(--ab-navy)', animation: corriendo ? `ab-avance-carrusel ${INTERVALO}ms linear forwards` : 'none' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** «No compatible» o «No tiene»: se lee como ausencia (igual que en la comparativa), no como un dato más. */
const esNegativo = (texto) => /^no (compatible|tiene)$/i.test(String(texto ?? '').trim());

/** Un valor de la ficha: texto, lista con viñetas (a dos columnas si es larga), dato con detalle o batería; avisos («; …») como nota. */
function ValorFicha({ campo, valor, atributos }) {
  const pct = campo.key === 'salud_bateria' ? porcentajeBateria(atributos) : null;
  const [principal, ...avisos] = partir(String(valor), '; ');
  const partes = partesDe(principal).map(conMayuscula);
  const estimada = campo.key === 'salud_bateria' || (campo.key === 'autonomia' && atributos.autonomia_estimada_horas);
  const notas = [estimada ? notaDe(campo, atributos) : null, ...avisos.map(conMayuscula)].filter(Boolean);

  let cuerpo;
  if (pct != null) {
    cuerpo = (
      <p className="inline-flex items-center gap-2.5 text-[15px] font-semibold">
        <BateriaNivel porcentaje={pct} className="h-5 w-9" /> {valor}
      </p>
    );
  } else if (partes.length === 1 && esNegativo(partes[0])) {
    cuerpo = (
      <p className="inline-flex items-center gap-1.5 text-[15px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        <Minus className="h-4 w-4" /> {partes[0]}
      </p>
    );
  } else if (partes.length <= 1) {
    cuerpo = (
      <p className={`break-words text-[15px] font-semibold leading-snug ${campo.mono ? 'font-mono tracking-wide' : ''}`}>
        {campo.key === 'ciclos_bateria' ? `${partes[0]} ciclos` : partes[0]}
      </p>
    );
  } else if (formatoDe(campo.key) === 'principal') {
    cuerpo = (
      <>
        <p className="break-words text-[15px] font-semibold leading-snug">{partes[0]}</p>
        {partes.slice(1).map((p) => <p key={p} className="mt-0.5 text-[13px] leading-snug" style={{ color: 'var(--text-secondary)' }}>{p}</p>)}
      </>
    );
  } else {
    cuerpo = (
      <ul className={partes.length > 6 ? 'gap-x-8 sm:columns-2' : ''}>
        {partes.map((p) => (
          <li key={p} className="mb-1.5 flex break-inside-avoid gap-2 text-sm leading-snug last:mb-0">
            <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: 'var(--ab-periwinkle)' }} />
            <span className="min-w-0 break-words">{p}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="min-w-0" style={{ color: 'var(--text-primary)' }}>
      {cuerpo}
      {notas.map((n) => <p key={n} className="mt-1.5 text-xs leading-snug" style={{ color: 'var(--text-secondary)' }}>{n}</p>)}
    </div>
  );
}

/** Una fila de la ficha: a la izquierda qué es (ícono, nombre y qué significa), a la derecha el dato. */
function FilaFicha({ campo, valor, atributos }) {
  const Icon = campo.iconoPara?.(valor) ?? campo.icon ?? Sparkles;
  return (
    <div className="grid gap-x-8 gap-y-2 border-t py-4 first:border-t-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" style={{ borderColor: 'var(--border-light)' }}>
      <dt className="flex min-w-0 items-start gap-3">
        <Icon className="mt-px h-5 w-5 shrink-0" strokeWidth={1.6} style={{ color: 'var(--ab-periwinkle)' }} />
        <span className="min-w-0">
          <span className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{campo.label}</span>
          {campo.ayuda && <span className="mt-0.5 block text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>{campo.ayuda}</span>}
        </span>
      </dt>
      <dd className="min-w-0 pl-8 sm:pl-0"><ValorFicha campo={campo} valor={valor} atributos={atributos} /></dd>
    </div>
  );
}

/** Ficha pública: lo destacado en un carrusel y el detalle por grupos, como una tabla (qué es · el dato). */
export function FichaTecnica({ tipo, atributos = {}, numeroSerie = null }) {
  const grupos = gruposFicha(tipo);

  const destacados = (DESTACADOS[tipo] ?? [])
    .map((key) => {
      // Publicaciones que solo tienen el tipo de pantalla
      const fuente = key === 'tamano_pantalla' && !util(atributos.tamano_pantalla) ? 'pantalla' : key;
      const campo = campoDe(fuente, tipo) ?? { key: fuente, label: etiquetaDe(fuente) };
      return { campo, valor: valorDe(fuente, atributos) };
    })
    .filter((d) => d.valor)
    .slice(0, 6);

  const conocidos = new Set(grupos.flatMap((g) => g.campos.map((x) => x.key)));
  const secciones = grupos
    .map((g) => ({ ...g, filas: g.campos.map((campo) => ({ campo, valor: valorDe(campo.key, atributos) })).filter((f) => f.valor) }))
    .filter((g) => g.filas.length);

  const otros = Object.keys(atributos)
    .filter((k) => !conocidos.has(k) && !['bateria_sellada', 'bateria', 'salud_bateria', 'autonomia_video_horas', 'autonomia_estimada_horas'].includes(k))
    .map((k) => ({ campo: campoDe(k, tipo) ?? { key: k, label: etiquetaDe(k) }, valor: valorDe(k, atributos) }))
    .filter((f) => f.valor);
  if (!conocidos.has('salud_bateria') && porcentajeBateria(atributos)) {
    otros.unshift({ campo: campoDe('salud_bateria', tipo), valor: valorDe('salud_bateria', atributos) });
  }
  if (numeroSerie) otros.push({ campo: EXTRA.numero_serie, valor: numeroSerie });
  if (otros.length) secciones.push({ id: 'otros', label: 'Más información', icon: Sparkles, filas: otros });

  if (!destacados.length && !secciones.length) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin especificaciones disponibles.</p>;
  }

  return (
    <div className="space-y-12">
      {destacados.length > 0 && <CarruselDestacados destacados={destacados} atributos={atributos} />}

      {secciones.length > 0 && (
        <div className="space-y-8">
          {secciones.map((g) => {
            const Icon = g.icon;
            return (
              <section key={g.id} aria-labelledby={`ficha-${g.id}`} className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
                <h3 id={`ficha-${g.id}`} className="flex items-center gap-3 self-start text-lg font-extrabold tracking-tight lg:sticky lg:pt-4"
                  style={{ color: 'var(--text-primary)', top: 'calc(var(--alto-header, 0px) + 64px)' }}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: 'var(--ab-navy)' }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {g.label}
                </h3>
                <dl className="rounded-3xl border bg-white px-5 sm:px-6" style={{ borderColor: 'var(--border-light)' }}>
                  {g.filas.map(({ campo, valor }) => <FilaFicha key={campo.key} campo={campo} valor={valor} atributos={atributos} />)}
                </dl>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
