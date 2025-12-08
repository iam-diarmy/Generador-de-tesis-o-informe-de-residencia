import { GoogleGenAI } from "@google/genai";
import { ProjectDetails, SectionKey, SECTION_TITLES } from "../types";

// Helper to get API key
const getApiKey = () => process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: getApiKey() });

const SYSTEM_INSTRUCTION = `
Eres un experto académico encargado de redactar informes técnicos de Residencia Profesional para institutos tecnológicos en México.
Tu tono debe ser formal, técnico, objetivo y en tercera persona.
Sigue estrictamente las normas APA.
NO uses sintaxis Markdown (como **negritas** o ### titulos) en exceso, prefiere texto plano estructurado.
Si necesitas enfatizar algo importante, usa etiquetas HTML <b>texto</b>.
Si necesitas un subtítulo, usa <h3>texto</h3>.
Tu salida será insertada directamente en un editor HTML, así que usa etiquetas <br> para saltos de línea si es un solo bloque, o simplemente separa párrafos.
`;

// Utility to clean markdown just in case the model ignores instructions
const cleanMarkdown = (text: string): string => {
  let cleaned = text;
  // Bold **text** -> <b>text</b>
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  // Bold __text__ -> <b>text</b>
  cleaned = cleaned.replace(/__(.*?)__/g, '<b>$1</b>');
  // Headers ### text -> <h3>text</h3>
  cleaned = cleaned.replace(/^### (.*$)/gm, '<h3 style="font-size: 14pt; font-weight: bold; margin-top: 10px;">$1</h3>');
  cleaned = cleaned.replace(/^## (.*$)/gm, '<h3 style="font-size: 14pt; font-weight: bold; margin-top: 10px;">$1</h3>');
  // Lists
  cleaned = cleaned.replace(/^\* (.*$)/gm, '• $1<br>');
  cleaned = cleaned.replace(/^- (.*$)/gm, '• $1<br>');
  
  return cleaned;
};

export const generateSectionContent = async (
  section: SectionKey,
  details: ProjectDetails
): Promise<string> => {
  const context = `
    Detalles del Proyecto:
    Título: ${details.projectTitle}
    Estudiante: ${details.studentName}
    Carrera: ${details.career}
    Empresa: ${details.companyName}
    Problema: ${details.problemStatement}
    Objetivos: ${details.objectives}
    Actividades: ${details.activities}
    Resultados: ${details.resultsExpected}
    Área: ${details.areaCharacterization}
  `;

  let promptText = "";

  switch (section) {
    case 'introduccion':
      promptText = `Redacta la Introducción del informe. Explica brevemente el problema, cómo se abordó y la estructura. NO uses encabezados de nivel 1. Utiliza los documentos adjuntos si contienen información relevante.`;
      break;
    case 'justificacion':
      promptText = `Redacta la Justificación. ¿Por qué es importante el proyecto? ¿A quién beneficia?`;
      break;
    case 'objetivos':
      promptText = `Redacta los Objetivos (General y Específicos). Usa viñetas para los específicos.`;
      break;
    case 'caracterizacion':
      promptText = `Redacta la Caracterización del área en que se participó (Departamento, funciones).`;
      break;
    case 'problemas':
      promptText = `Redacta los Problemas a resolver, priorizándolos. Usa los documentos adjuntos si describen el problema.`;
      break;
    case 'alcances':
      promptText = `Redacta los Alcances y Limitaciones del proyecto.`;
      break;
    case 'fundamento':
      promptText = `Desarrolla el Fundamento Teórico brevemente sobre: ${details.activities}. Utiliza los documentos adjuntos como referencia teórica si aplica.`;
      break;
    case 'procedimiento':
      promptText = `Redacta el Procedimiento y descripción de las actividades realizadas. Sé descriptivo. Basate fuertemente en los documentos adjuntos si son bitácoras o reportes.`;
      break;
    case 'resultados':
      promptText = `Redacta la sección de Resultados obtenidos. Usa los documentos adjuntos si contienen evidencias.`;
      break;
    case 'conclusiones':
      promptText = `Redacta Conclusiones y Recomendaciones.`;
      break;
    case 'referencias':
      promptText = `Genera 3 referencias en formato APA (ficticias si es necesario).`;
      break;
    default:
      return "Sección no generable automáticamente.";
  }

  // Build the multimodal payload
  const parts: any[] = [
    { text: `${context}\n\nInstrucción: ${promptText}\nNota: Si hay documentos adjuntos, úsalos para enriquecer el contenido, pero mantén el formato solicitado.` }
  ];

  // Add attachments if they exist
  if (details.attachments && details.attachments.length > 0) {
    details.attachments.forEach(att => {
        parts.push({
            inlineData: {
                mimeType: att.mimeType,
                data: att.data
            }
        });
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    
    const rawText = response.text || "Error al generar contenido.";
    return cleanMarkdown(rawText);
  } catch (error) {
    console.error("Gemini Text Gen Error:", error);
    return "Hubo un error al conectar con el servicio de IA o los archivos adjuntos son demasiado grandes.";
  }
};

export const generateImageForReport = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
              aspectRatio: '4:3',
          }
        },
    });

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};