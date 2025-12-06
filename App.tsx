import React, { useState } from 'react';
import InputForm from './components/InputForm';
import ReportEditor from './components/ReportEditor';
import { ProjectDetails, ReportSection, SectionKey, BlockType, InstitutionSettings, SECTION_TITLES } from './types';
import { generateSectionContent, generateImageForReport } from './services/geminiService';

const INITIAL_DETAILS: ProjectDetails = {
  studentName: '',
  studentId: '',
  career: '',
  projectTitle: '',
  companyName: '',
  advisorInternal: '',
  advisorExternal: '',
  startDate: '',
  endDate: '',
  problemStatement: '',
  objectives: '',
  activities: '',
  resultsExpected: '',
  areaCharacterization: ''
};

const INITIAL_SECTIONS: Record<SectionKey, ReportSection> = Object.keys(SECTION_TITLES).reduce((acc, key) => {
  const k = key as SectionKey;
  acc[k] = {
    id: k,
    title: SECTION_TITLES[k],
    blocks: [],
    isLocked: false,
  };
  return acc;
}, {} as Record<SectionKey, ReportSection>);

// Initialize Portada with formatted HTML blocks for the Rich Text Editor
INITIAL_SECTIONS.portada.blocks = [
  { id: '1', type: BlockType.TEXT, content: '<h1 style="text-align: center; font-size: 16pt;">REPORTE FINAL DE RESIDENCIA PROFESIONAL</h1>' },
  { id: '2', type: BlockType.TEXT, content: '<br><br><h2 style="text-align: center;">[ TÍTULO DEL PROYECTO ]</h2><br><br>' },
  { id: '3', type: BlockType.TEXT, content: '<p style="text-align: center;">PRESENTA:</p><p style="text-align: center; font-weight: bold;">[NOMBRE DEL ALUMNO]</p>' },
];

function App() {
  const [details, setDetails] = useState<ProjectDetails>(INITIAL_DETAILS);
  const [sections, setSections] = useState<Record<SectionKey, ReportSection>>(INITIAL_SECTIONS);
  const [institutionSettings, setInstitutionSettings] = useState<InstitutionSettings>({
    logoLeft: null,
    logoRight: null,
    institutionName: 'INSTITUTO TECNOLÓGICO DE POCHUTLA',
    departmentName: 'Departamento de Sistemas y Computación'
  });
  const [view, setView] = useState<'form' | 'editor'>('form');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateFullReport = async () => {
    setIsGenerating(true);
    const newSections = { ...sections };

    // 1. Generate PORTADA content (HTML formatted)
    newSections.portada.blocks = [
        { id: 'p1', type: BlockType.TEXT, content: `<h1 style="text-align: center; font-weight: bold; font-size: 16pt;">REPORTE FINAL DE RESIDENCIA PROFESIONAL</h1>` },
        { id: 'p2', type: BlockType.TEXT, content: `<br><br><p style="text-align: center;">Que para obtener el título de:</p><h3 style="text-align: center; font-weight: bold;">${details.career.toUpperCase()}</h3>` },
        { id: 'p3', type: BlockType.TEXT, content: `<br><h2 style="text-align: center; font-weight: bold; font-size: 14pt;">"${details.projectTitle.toUpperCase()}"</h2><br>` },
        { id: 'p4', type: BlockType.TEXT, content: `<p style="text-align: center;">Presenta:</p><p style="text-align: center; font-weight: bold;">${details.studentName}</p><p style="text-align: center;">No. Control: ${details.studentId}</p>` },
        { id: 'p5', type: BlockType.TEXT, content: `<br><br><p style="text-align: center;">Asesor Interno:<br><b>${details.advisorInternal}</b></p><br><p style="text-align: center;">Asesor Externo:<br><b>${details.advisorExternal}</b></p>` },
        { id: 'p6', type: BlockType.TEXT, content: `<br><br><p style="text-align: center;">${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` },
    ];

    // 2. Generate Text Content for other sections
    const keysToGenerate: SectionKey[] = [
      'introduccion', 'justificacion', 'objetivos', 'caracterizacion',
      'problemas', 'alcances', 'fundamento', 'procedimiento', 
      'resultados', 'conclusiones', 'referencias'
    ];

    const generatePromises = keysToGenerate.map(async (key) => {
        const content = await generateSectionContent(key, details);
        
        // Split by double newline to create paragraphs/blocks, keeps it clean
        // We use innerHTML logic now, so <br> is good, but splitting into blocks gives better control
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        
        newSections[key].blocks = paragraphs.map((p, idx) => ({
            id: Date.now().toString() + key + idx,
            type: BlockType.TEXT,
            content: p.trim() // Content is now HTML-safe string (with <b> tags etc)
        }));

        // AUTOMATIC GRAPHIC GENERATION for specific sections
        if (key === 'resultados' || key === 'procedimiento') {
            const imagePrompt = `Un diagrama técnico o gráfico profesional relacionado con: ${details.projectTitle} - ${key}`;
            const imageBase64 = await generateImageForReport(imagePrompt);
            if (imageBase64) {
                // Add image block in the middle
                const middleIdx = Math.floor(newSections[key].blocks.length / 2);
                newSections[key].blocks.splice(middleIdx, 0, {
                    id: 'auto-img-' + key,
                    type: BlockType.IMAGE,
                    content: imageBase64
                });
            }
        }
    });

    await Promise.all(generatePromises);

    // 3. Generate Index Placeholder
    newSections.indice.blocks = [
        { id: 'idx1', type: BlockType.TEXT, content: `<p style="text-align: left;"><b>ÍNDICE</b></p><br>` + Object.values(SECTION_TITLES).map((t, i) => `<div style="display:flex; justify-content:space-between; border-bottom: 1px dotted #ccc;"><span>${i+1}. ${t}</span><span>${i+1}</span></div>`).join('<br>') }
    ];

    setSections(newSections);
    setIsGenerating(false);
    setView('editor');
  };

  const updateSection = (key: SectionKey, section: ReportSection) => {
    setSections(prev => ({ ...prev, [key]: section }));
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-gray-100">
      {view === 'form' ? (
        <InputForm 
          details={details} 
          onChange={setDetails} 
          onGenerate={handleGenerateFullReport} 
          isGenerating={isGenerating}
        />
      ) : (
        <ReportEditor 
          sections={sections}
          institutionSettings={institutionSettings}
          setInstitutionSettings={setInstitutionSettings}
          updateSection={updateSection}
        />
      )}
    </div>
  );
}

export default App;