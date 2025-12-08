import React, { useRef } from 'react';
import { ProjectDetails } from '../types';
import { Sparkles, FileText, UploadCloud, X } from 'lucide-react';

interface InputFormProps {
  details: ProjectDetails;
  onChange: (details: ProjectDetails) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ details, onChange, onGenerate, isGenerating }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ ...details, [name]: value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAttachments = [...details.attachments];
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          // Extract base64 data (remove data:application/pdf;base64, prefix)
          const base64Data = result.split(',')[1];
          
          newAttachments.push({
            name: file.name,
            mimeType: file.type,
            data: base64Data
          });
          
          // Update state after reading last file (simplified for sync behavior)
          onChange({ ...details, attachments: [...newAttachments] });
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...details.attachments];
    newAttachments.splice(index, 1);
    onChange({ ...details, attachments: newAttachments });
  };

  const inputClass = "mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 text-base";
  const labelClass = "block text-sm font-semibold text-gray-800 mb-1";

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-2xl rounded-xl my-8 border border-gray-100">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-indigo-900">Generador de Informe de Residencia</h2>
        <p className="text-gray-600 mt-3 text-lg">Completa la información requerida para que la Inteligencia Artificial redacte tu informe preliminar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Data */}
        <div className="space-y-5 bg-gray-50 p-5 rounded-lg border border-gray-200">
          <h3 className="font-bold text-xl text-indigo-800 border-b border-indigo-200 pb-2 mb-4">Información del Estudiante</h3>
          <div>
            <label className={labelClass}>Nombre Completo</label>
            <input name="studentName" value={details.studentName} onChange={handleChange} className={inputClass} placeholder="Ej. Juan Pérez López" />
          </div>
          <div>
            <label className={labelClass}>No. de Control</label>
            <input name="studentId" value={details.studentId} onChange={handleChange} className={inputClass} placeholder="Ej. 19123456" />
          </div>
          <div>
            <label className={labelClass}>Carrera</label>
            <input name="career" value={details.career} onChange={handleChange} className={inputClass} placeholder="Ej. Ingeniería en Sistemas Computacionales" />
          </div>
        </div>

        {/* Project Data */}
        <div className="space-y-5 bg-gray-50 p-5 rounded-lg border border-gray-200">
          <h3 className="font-bold text-xl text-indigo-800 border-b border-indigo-200 pb-2 mb-4">Datos del Proyecto</h3>
          <div>
            <label className={labelClass}>Título del Proyecto</label>
            <input name="projectTitle" value={details.projectTitle} onChange={handleChange} className={inputClass} placeholder="Título oficial del proyecto" />
          </div>
          <div>
            <label className={labelClass}>Empresa / Organización</label>
            <input name="companyName" value={details.companyName} onChange={handleChange} className={inputClass} placeholder="Nombre de la empresa" />
          </div>
        </div>

        {/* Advisors & Dates */}
        <div className="space-y-5 bg-gray-50 p-5 rounded-lg border border-gray-200">
          <h3 className="font-bold text-xl text-indigo-800 border-b border-indigo-200 pb-2 mb-4">Asesores y Fechas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Asesor Interno (Escuela)</label>
              <input name="advisorInternal" value={details.advisorInternal} onChange={handleChange} className={inputClass} placeholder="Nombre y grado" />
            </div>
            <div>
              <label className={labelClass}>Asesor Externo (Empresa)</label>
              <input name="advisorExternal" value={details.advisorExternal} onChange={handleChange} className={inputClass} placeholder="Nombre y puesto" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fecha Inicio</label>
              <input type="date" name="startDate" value={details.startDate} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Fecha Fin</label>
              <input type="date" name="endDate" value={details.endDate} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* REFERENCE DOCUMENTS (New Section) */}
        <div className="md:col-span-2 space-y-5 bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="font-bold text-xl text-blue-900 border-b border-blue-200 pb-2 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Documentos de Ayuda
          </h3>
          <p className="text-sm text-blue-700 mb-4 bg-white p-3 rounded border border-blue-100">
            Sube reportes anteriores, bitácoras o notas (PDF, Imágenes) para que la IA tenga más contexto sobre tu trabajo.
          </p>
          
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 flex flex-col items-center justify-center bg-blue-50/50 hover:bg-blue-100 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
             <UploadCloud className="w-10 h-10 text-blue-400 mb-2" />
             <p className="text-blue-600 font-medium">Clic para subir documentos</p>
             <p className="text-xs text-blue-400 mt-1">Soporta PDF, Imágenes (PNG, JPG)</p>
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                accept="application/pdf,image/png,image/jpeg,image/jpg" 
                onChange={handleFileUpload} 
             />
          </div>

          {details.attachments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
               {details.attachments.map((file, idx) => (
                 <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 shadow-sm">
                    <div className="flex items-center overflow-hidden">
                       <FileText className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                       <span className="text-sm text-gray-700 truncate">{file.name}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeAttachment(idx); }} className="text-red-400 hover:text-red-600 p-1">
                       <X className="w-4 h-4" />
                    </button>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Context - Important for AI */}
        <div className="md:col-span-2 space-y-5 bg-indigo-50 p-6 rounded-lg border border-indigo-100">
          <h3 className="font-bold text-xl text-indigo-900 border-b border-indigo-200 pb-2 mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
            Contexto para la IA
          </h3>
          <p className="text-sm text-indigo-700 mb-4 bg-white p-3 rounded border border-indigo-100">
            Proporciona detalles claros. La IA usará esta información para redactar los capítulos de tu informe.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Problemática a Resolver</label>
              <textarea name="problemStatement" rows={4} value={details.problemStatement} onChange={handleChange} className={inputClass} placeholder="¿Qué problema encontraste? ¿Qué necesidad cubriste?" />
            </div>
            <div>
              <label className={labelClass}>Objetivos Principales</label>
              <textarea name="objectives" rows={4} value={details.objectives} onChange={handleChange} className={inputClass} placeholder="Objetivo General y Específicos..." />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Actividades Realizadas (Detallado)</label>
              <textarea name="activities" rows={5} value={details.activities} onChange={handleChange} className={inputClass} placeholder="Lista las actividades técnicas, administrativas o de investigación que realizaste paso a paso." />
            </div>
            <div>
              <label className={labelClass}>Caracterización del Área</label>
              <textarea name="areaCharacterization" rows={3} value={details.areaCharacterization} onChange={handleChange} className={inputClass} placeholder="Descripción del departamento donde estuviste (funciones, equipo, etc.)" />
            </div>
            <div>
              <label className={labelClass}>Resultados Obtenidos</label>
              <textarea name="resultsExpected" rows={3} value={details.resultsExpected} onChange={handleChange} className={inputClass} placeholder="¿Qué se logró? (Software funcionando, manuales, optimización de procesos, etc.)" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`flex items-center justify-center w-full md:w-auto px-8 py-4 rounded-xl text-white font-bold text-xl shadow-xl transition-all transform ${
            isGenerating 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-1'
          }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Redactando Informe...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6 mr-3" />
              Generar Informe Completo
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputForm;