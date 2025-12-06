import React, { useState, useRef, useEffect } from 'react';
import { InstitutionSettings, ReportSection, BlockType, ContentBlock, SECTION_TITLES, SectionKey } from '../types';
import { generateImageForReport } from '../services/geminiService';
import { FileDown, Image as ImageIcon, Trash2, PenLine, Upload, Type, Bold, Italic, AlignLeft, AlignCenter, AlignJustify } from 'lucide-react';

interface ReportEditorProps {
  sections: Record<SectionKey, ReportSection>;
  institutionSettings: InstitutionSettings;
  setInstitutionSettings: (s: InstitutionSettings) => void;
  updateSection: (key: SectionKey, section: ReportSection) => void;
}

const FONTS = [
  { name: 'Times New Roman', class: 'font-serif' },
  { name: 'Arial', class: 'font-sans' },
  { name: 'Verdana', class: 'font-verdana' },
  { name: 'Courier New', class: 'font-mono' },
];

const ReportEditor: React.FC<ReportEditorProps> = ({
  sections,
  institutionSettings,
  setInstitutionSettings,
  updateSection,
}) => {
  const [activeSection, setActiveSection] = useState<SectionKey>('portada');
  const [isImgGenerating, setIsImgGenerating] = useState(false);
  const [currentFont, setCurrentFont] = useState('font-serif');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track insertion point: index to insert after
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  // ContentEditable refs to handle cursor position if needed
  const editorRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  const handleBlockChange = (sectionKey: SectionKey, blockId: string, newContent: string) => {
    const section = sections[sectionKey];
    const updatedBlocks = section.blocks.map(b => 
      b.id === blockId ? { ...b, content: newContent } : b
    );
    updateSection(sectionKey, { ...section, blocks: updatedBlocks });
  };

  const addBlock = (sectionKey: SectionKey, type: BlockType, content: string = '', index: number = -1) => {
    const section = sections[sectionKey];
    const newBlock: ContentBlock = {
      id: Date.now().toString() + Math.random(),
      type,
      content
    };
    
    let newBlocks = [...section.blocks];
    if (index === -1) {
        newBlocks.push(newBlock);
    } else {
        newBlocks.splice(index + 1, 0, newBlock);
    }
    
    updateSection(sectionKey, { ...section, blocks: newBlocks });
    setInsertIndex(null); 
  };

  const removeBlock = (sectionKey: SectionKey, blockId: string) => {
    if (confirm('¿Estás seguro de eliminar este bloque?')) {
        const section = sections[sectionKey];
        updateSection(sectionKey, { ...section, blocks: section.blocks.filter(b => b.id !== blockId) });
    }
  };

  const handleGenerateImage = async (sectionKey: SectionKey, index: number = -1) => {
    const imagePrompt = window.prompt("Describe la imagen, gráfico o plano que deseas generar con IA:");
    if (!imagePrompt) return;

    setIsImgGenerating(true);
    const base64 = await generateImageForReport(imagePrompt);
    setIsImgGenerating(false);

    if (base64) {
      addBlock(sectionKey, BlockType.IMAGE, base64, index);
    } else {
      alert("No se pudo generar la imagen. Intenta de nuevo.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const idx = insertIndex !== null ? insertIndex : -1;
        addBlock(activeSection, BlockType.IMAGE, reader.result as string, idx);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Rich Text Commands
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
  };

  const handleExportWord = () => {
    const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Informe</title></head><body>";
    const postHtml = "</body></html>";
    
    let contentHtml = `<div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000;">`;
    
    // Header
    contentHtml += `
        <table style="width: 100%; border-bottom: 2px solid #800000; margin-bottom: 20px;">
            <tr>
                <td style="width: 100px; text-align: left;"><img src="${institutionSettings.logoLeft || ''}" width="80" height="80" /></td>
                <td style="text-align: center;">
                    <p style="font-size: 14pt; font-weight: bold; margin: 0;">${institutionSettings.institutionName}</p>
                    <p style="font-size: 12pt; margin: 0;">${institutionSettings.departmentName}</p>
                </td>
                <td style="width: 100px; text-align: right;"><img src="${institutionSettings.logoRight || ''}" width="80" height="80" /></td>
            </tr>
        </table>
    `;

    (Object.keys(sections) as SectionKey[]).forEach(key => {
      const section = sections[key];
      contentHtml += `<br clear="all" style="page-break-before:always" />`;
      if (key !== 'portada') {
        contentHtml += `<h2 style="text-transform: uppercase; text-align: center; font-size: 14pt; font-weight: bold; margin-top: 20px;">${section.title}</h2>`;
      }
      section.blocks.forEach(block => {
        if (block.type === BlockType.TEXT) {
          contentHtml += `<div style="text-align: justify; margin-bottom: 12pt;">${block.content}</div>`;
        } else {
          contentHtml += `<div style="text-align: center; margin: 20px 0;"><img src="${block.content}" style="max-width: 100%; height: auto;" /></div>`;
        }
      });
    });
    contentHtml += `</div>`;

    const html = preHtml + contentHtml + postHtml;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `Informe_${institutionSettings.institutionName.replace(/ /g, '_')}.doc`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-200">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex-shrink-0 overflow-y-auto no-print shadow-xl z-20">
        <div className="p-5 border-b border-gray-700 bg-gray-800">
          <h1 className="text-xl font-bold text-gray-100 font-serif">ResiGen</h1>
          <p className="text-xs text-gray-400 mt-1">Generador de Informes</p>
        </div>
        <nav className="p-3 space-y-1">
          {(Object.keys(sections) as SectionKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-sm border-l-4 ${
                activeSection === key 
                  ? 'bg-gray-800 border-indigo-500 text-white shadow-md' 
                  : 'border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              {SECTION_TITLES[key]}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Bar with Formatting Tools */}
        <header className="bg-white border-b border-gray-300 p-2 flex justify-between items-center shadow-sm no-print z-30">
          <div className="flex items-center gap-2 px-4 flex-wrap">
             <div className="flex items-center space-x-2 mr-4">
               <Type className="w-4 h-4 text-gray-500" />
               <select 
                  className="border border-gray-300 rounded p-1 text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 h-8 font-sans"
                  value={currentFont}
                  onChange={(e) => setCurrentFont(e.target.value)}
                  title="Cambiar Tipo de Letra del Documento"
                >
                  {FONTS.map(f => <option key={f.class} value={f.class}>{f.name}</option>)}
                </select>
             </div>

             <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200 items-center">
                <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-white rounded hover:shadow-sm text-gray-700" title="Negrita"><Bold className="w-4 h-4" /></button>
                <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-white rounded hover:shadow-sm text-gray-700" title="Cursiva"><Italic className="w-4 h-4" /></button>
                
                <div className="w-px bg-gray-300 mx-2 h-6"></div>
                
                <button onClick={() => execCmd('justifyLeft')} className="p-1.5 hover:bg-white rounded hover:shadow-sm text-gray-700" title="Alinear Izquierda"><AlignLeft className="w-4 h-4" /></button>
                <button onClick={() => execCmd('justifyCenter')} className="p-1.5 hover:bg-white rounded hover:shadow-sm text-gray-700" title="Centrar"><AlignCenter className="w-4 h-4" /></button>
                <button onClick={() => execCmd('justifyFull')} className="p-1.5 hover:bg-white rounded hover:shadow-sm text-gray-700" title="Justificar"><AlignJustify className="w-4 h-4" /></button>
             </div>
          </div>
          <div className="flex gap-3 px-4">
            <button onClick={handleExportWord} className="flex items-center px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 shadow-sm text-sm font-medium transition-colors">
              <FileDown className="w-4 h-4 mr-2" /> Descargar Word
            </button>
          </div>
        </header>

        {/* Page Canvas */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-200 scroll-smooth" id="report-canvas-wrapper">
          <div id="report-canvas" className={`max-w-[21.59cm] min-h-[27.94cm] mx-auto bg-white shadow-2xl p-[2.5cm] relative print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 print:mx-0 ${currentFont}`}>
            
            {/* DOCUMENT HEADER (Single Unit) */}
            <div className="flex items-center justify-between mb-8 border-b-2 border-red-900 pb-2">
                {/* Logo Left */}
                <div className="w-[80px] h-[80px] relative group border border-transparent hover:border-gray-300 rounded flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer">
                    {institutionSettings.logoLeft ? (
                        <img src={institutionSettings.logoLeft} className="w-full h-full object-contain" alt="Logo Izq" />
                    ) : (
                        <span className="text-xs text-gray-400 text-center px-1">Logo Izq</span>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" title="Cambiar Logo Izquierdo" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if(file) {
                             const reader = new FileReader();
                             reader.onload = () => setInstitutionSettings({...institutionSettings, logoLeft: reader.result as string});
                             reader.readAsDataURL(file);
                         }
                    }}/>
                </div>

                {/* Center Text (Editable) */}
                <div className="flex-1 text-center px-4">
                    <div 
                        contentEditable
                        suppressContentEditableWarning
                        className="font-bold text-lg uppercase outline-none focus:bg-yellow-50 rounded px-2"
                        onBlur={(e) => setInstitutionSettings({...institutionSettings, institutionName: e.currentTarget.innerText})}
                    >
                        {institutionSettings.institutionName}
                    </div>
                    <div 
                        contentEditable
                        suppressContentEditableWarning
                        className="text-md mt-1 outline-none focus:bg-yellow-50 rounded px-2"
                        onBlur={(e) => setInstitutionSettings({...institutionSettings, departmentName: e.currentTarget.innerText})}
                    >
                        {institutionSettings.departmentName}
                    </div>
                </div>

                {/* Logo Right */}
                <div className="w-[80px] h-[80px] relative group border border-transparent hover:border-gray-300 rounded flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer">
                    {institutionSettings.logoRight ? (
                        <img src={institutionSettings.logoRight} className="w-full h-full object-contain" alt="Logo Der" />
                    ) : (
                        <span className="text-xs text-gray-400 text-center px-1">Logo Der</span>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" title="Cambiar Logo Derecho" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if(file) {
                             const reader = new FileReader();
                             reader.onload = () => setInstitutionSettings({...institutionSettings, logoRight: reader.result as string});
                             reader.readAsDataURL(file);
                         }
                    }}/>
                </div>
            </div>

            {/* SECTION CONTENT */}
            <div className="text-gray-900 leading-relaxed text-[12pt]">
                {activeSection !== 'portada' && (
                    <h2 className="text-center font-bold uppercase mb-6 text-xl">{sections[activeSection].title}</h2>
                )}
                
                {sections[activeSection].blocks.map((block, index) => (
                    <div key={block.id} className="group relative mb-6 pb-2">
                        
                        {/* Render Block Content */}
                        {block.type === BlockType.TEXT ? (
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                className="outline-none border border-transparent hover:border-gray-200 focus:border-indigo-300 p-1 rounded min-h-[1.5em] text-justify whitespace-pre-wrap transition-all empty:before:content-['Clic_para_escribir...'] empty:before:text-gray-300"
                                style={{ textAlign: 'justify' }}
                                dangerouslySetInnerHTML={{ __html: block.content }}
                                onInput={(e) => handleBlockChange(activeSection, block.id, e.currentTarget.innerHTML)}
                                ref={el => editorRefs.current[block.id] = el}
                            />
                        ) : (
                            <div className="flex justify-center my-4 relative">
                                <img src={block.content} className="max-w-full max-h-[10cm] shadow-sm rounded-sm" alt="Contenido Visual" />
                            </div>
                        )}

                        {/* Floating Actions (Delete) */}
                        <div className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                            <button onClick={() => removeBlock(activeSection, block.id)} className="p-1.5 bg-red-100 text-red-600 rounded shadow hover:bg-red-200" title="Eliminar Bloque"><Trash2 className="w-4 h-4"/></button>
                        </div>

                        {/* Explicit Insert Toolbar After Block */}
                        <div className="absolute -bottom-6 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-all z-20 no-print pointer-events-none group-hover:pointer-events-auto">
                             <div className="bg-white border border-gray-300 rounded-full shadow-lg flex items-center p-1 scale-90 hover:scale-100 transition-transform">
                                <span className="text-[10px] text-gray-500 font-bold px-2 uppercase select-none">Insertar:</span>
                                <button onClick={() => addBlock(activeSection, BlockType.TEXT, '', index)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-700 transition-colors" title="Insertar Texto"><Type className="w-4 h-4"/></button>
                                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                <button onClick={() => handleGenerateImage(activeSection, index)} className="p-1.5 hover:bg-indigo-50 rounded-full text-indigo-600 transition-colors" title="Generar Imagen IA"><ImageIcon className="w-4 h-4"/></button>
                                <button onClick={() => { setInsertIndex(index); fileInputRef.current?.click(); }} className="p-1.5 hover:bg-green-50 rounded-full text-green-600 transition-colors" title="Subir Imagen"><Upload className="w-4 h-4"/></button>
                             </div>
                        </div>
                    </div>
                ))}

                {/* Empty State / Bottom Add */}
                {sections[activeSection].blocks.length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 rounded p-8 text-center text-gray-400 italic no-print select-none">
                        Sección vacía. Comienza a escribir o genera contenido.
                    </div>
                )}
                
                <div className="mt-12 pt-6 border-t border-gray-100 flex justify-center gap-4 no-print opacity-70 hover:opacity-100 transition-opacity">
                    <button onClick={() => addBlock(activeSection, BlockType.TEXT, '')} className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 px-3 py-2 rounded hover:bg-gray-50">
                        <PenLine className="w-4 h-4 mr-2" /> Agregar Texto Final
                    </button>
                    <button 
                      onClick={() => handleGenerateImage(activeSection, -1)} 
                      disabled={isImgGenerating} 
                      className={`flex items-center text-sm font-medium px-3 py-2 rounded hover:bg-gray-50 ${isImgGenerating ? 'text-gray-400 cursor-wait' : 'text-gray-600 hover:text-indigo-600'}`}
                    >
                        {isImgGenerating ? (
                          <>Generando...</>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4 mr-2" /> Agregar Gráfico Final
                          </>
                        )}
                    </button>
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportEditor;