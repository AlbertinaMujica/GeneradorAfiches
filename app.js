const WIDTH = 1080;
const HEIGHT = 1920;

// Mapa de colores según la plantilla seleccionada
const TEMPLATE_COLORS = {
  'Plantilla1.png': '#720404',   // Bordó
  'Plantilla2.png': '#720404',   // Bordó
  'Plantilla3.png': '#720404',   // Bordó
  'Plantilla1v2.png': '#FFFFFF', // Blanco
  'Plantilla2v2.png': '#FFFFFF', // Blanco
  'Plantilla3v2.png': '#5E17EC'  // Violeta
};

const TEXT_CONFIG = {
  x: 540,
  y: 540,
  maxWidth: 880,
  maxHeight: 700,
  color: '#720404', // Color inicial por defecto
  fontFamily: "'League Spartan', sans-serif"
};

// Guardar la plantilla activa actual
let currentTemplatePath = 'assets/Plantilla1.png';

// Elementos DOM
const templateCards = document.querySelectorAll('.template-card');
const inputTitle = document.querySelector('#inputTitle');
const canvas = document.querySelector('#posterCanvas');
const downloadBtn = document.querySelector('#downloadBtn');
const statusMessage = document.querySelector('#statusMessage');

// Carga asíncrona de la imagen
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

// División de texto en renglones (Límite estricto de 6 líneas)
function wrapText(context, text, maxWidth) {
  const paragraphs = text.trim().split(/\n+/);
  const lines = [];

  for (const paragraph of paragraphs) {
    if (lines.length >= 6) break;

    const words = paragraph.trim().split(/\s+/);
    let line = '';

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      
      if (context.measureText(candidate).width <= maxWidth || !line) {
        line = candidate;
      } else {
        lines.push(line);
        if (lines.length === 6) break;
        line = word;
      }
    }

    if (line && lines.length < 6) {
      lines.push(line);
    }
  }

  return lines.slice(0, 8);
}

// Ajuste dinámico de tipografía por búsqueda binaria
function fittedText(context, text, maxWidth, maxHeight, fontFamily) {
  let low = 30;
  let high = 80;
  let result = { size: low, lines: [text], lineHeight: low * 0.95 };

  while (low <= high) {
    const size = Math.floor((low + high) / 2);
    context.font = `900 ${size}px ${fontFamily}`;
    const lines = wrapText(context, text, maxWidth);
    const lineHeight = size * 0.95;
    const widest = Math.max(...lines.map((line) => context.measureText(line).width), 0);

    if (lines.length * lineHeight <= maxHeight && widest <= maxWidth) {
      result = { size, lines, lineHeight };
      low = size + 1;
    } else {
      high = size - 1;
    }
  }
  return result;
}

// Función principal para renderizar el Canvas
async function renderPoster() {
  const context = canvas.getContext('2d');
  
  // Extraer únicamente el nombre del archivo desde la ruta completa
  const filename = currentTemplatePath.split('/').pop();

  // Asignar el color dinámicamente según la plantilla
  TEXT_CONFIG.color = TEMPLATE_COLORS[filename] || '#720404';

  try {
    const bgImage = await loadImage(currentTemplatePath);

    // 1. Dibujar plantilla
    context.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

    // 2. Renderizar Texto con el color configurado
    const titleText = inputTitle.value.trim() || 'Tu texto aquí';
    const fitted = fittedText(context, titleText, TEXT_CONFIG.maxWidth, TEXT_CONFIG.maxHeight, TEXT_CONFIG.fontFamily);

    context.font = `900 ${fitted.size}px ${TEXT_CONFIG.fontFamily}`;
    context.fillStyle = TEXT_CONFIG.color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const totalBlockHeight = fitted.lines.length * fitted.lineHeight;
    let startY = TEXT_CONFIG.y - (totalBlockHeight / 2) + (fitted.lineHeight / 2);

    fitted.lines.forEach((line, index) => {
      context.fillText(line, TEXT_CONFIG.x, startY + (index * fitted.lineHeight));
    });

  } catch (err) {
    console.error('Error al renderizar:', err);
  }
}

// Escuchar click en las miniaturas de plantillas
templateCards.forEach((card) => {
  card.addEventListener('click', () => {
    templateCards.forEach((c) => c.classList.remove('active'));
    card.classList.add('active');
    currentTemplatePath = card.dataset.src;
    renderPoster();
  });
});

// Listener para el input de texto
inputTitle.addEventListener('input', renderPoster);

// Descarga
downloadBtn.addEventListener('click', () => {
  canvas.toBlob((blob) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'afiche.png';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    statusMessage.textContent = '¡Imagen descargada!';
  }, 'image/png');
});

// Esperar a que las fuentes remotas carguen antes del render inicial
document.fonts.ready.then(() => {
  renderPoster();
});