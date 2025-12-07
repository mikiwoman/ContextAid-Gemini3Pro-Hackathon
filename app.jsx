import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResourceCheck } from './components/ResourceCheck';
import { Button } from './components/Button';
import { AudioPlayer } from './components/AudioPlayer';
import { AppState, InjuryAnalysis, Severity, StepInstruction, Language } from './types';
import { analyzeInjuryMedia, generateStepGuide, generateSpeech } from './services/geminiService';

const EMERGENCY_NUMBERS: Record<Language, string> = {
  ro: '112',
  en: '911',
  fr: '112',
  de: '112',
  it: '112',
  es: '112'
};

const UI_TEXT = {
  ro: {
    title: "Asistent",
    titleSuffix: "PrimAjutor",
    reset: "Resetare",
    uploadTitle: "Prim Ajutor Rapid",
    uploadDesc: "Încarcă o poză cu leziunea. Inteligența Artificială va decide dacă este Urgență sau Minoră.",
    uploadButton: "Încarcă o leziune pentru analiză",
    analyzing: "Gemini analizează leziunea...",
    error: "Nu am putut analiza imaginea. Te rog încearcă din nou.",
    startTreatment: "Începe Tratamentul",
    resourceCheckTitle: "Verificare Resurse",
    resourceCheckSubtitle: "Selectează ce ai la îndemână acum.",
    call112: "SUNĂ 112 ACUM",
    callWarning: "Nu închide apelul până nu ți se spune.",
    newAnalysis: "Analizează o nouă imagine",
    nextStep: "Următorul Pas ->",
    finish: "Finalizează Tratamentul",
    safety: "Siguranță",
    minor: "Leziune Minoră",
    homeCare: "Tratament Acasă",
    medium: "Atenție Sporită",
    medCare: "Tratament + Medic",
    context: "Contextual:",
    contextDesc: "Instrucțiune adaptată pentru resursele:",
    major: "Urgență Majoră",
    action: "Acțiune Necesară",
    userMessageLabel: "Mesaj Context / Limbă (Opțional):",
    userMessagePlaceholder: "Ex: 'M-am tăiat la deget' sau 'English'",
    listenButton: "Ascultă"
  },
  en: {
    title: "FirstAid",
    titleSuffix: "Assistant",
    reset: "Reset",
    uploadTitle: "Quick First Aid",
    uploadDesc: "Upload a photo of the injury. AI will determine if it's an Emergency or Minor.",
    uploadButton: "Upload injury for analysis",
    analyzing: "Gemini is analyzing...",
    error: "Could not analyze the image. Please try again.",
    startTreatment: "Start Treatment",
    resourceCheckTitle: "Check Resources",
    resourceCheckSubtitle: "Select what you have at hand.",
    call112: "CALL 911 NOW",
    callWarning: "Do not hang up until told to do so.",
    newAnalysis: "Analyze new image",
    nextStep: "Next Step ->",
    finish: "Finish Treatment",
    safety: "Safety",
    minor: "Minor Injury",
    homeCare: "Home Care",
    medium: "Increased Attention",
    medCare: "Treatment + Doctor",
    context: "Contextual:",
    contextDesc: "Instruction adapted for resources:",
    major: "Major Emergency",
    action: "Action Required",
    userMessageLabel: "Context Message / Language (Optional):",
    userMessagePlaceholder: "Ex: 'Cut my finger' or 'French'",
    listenButton: "Listen"
  },
  fr: {
    title: "Assistant",
    titleSuffix: "Secours",
    reset: "Réinitialiser",
    uploadTitle: "Premiers Secours",
    uploadDesc: "Téléchargez une photo de la blessure. L'IA décidera s'il s'agit d'une urgence ou d'un cas mineur.",
    uploadButton: "Charger une blessure pour analyse",
    analyzing: "Gemini analyse...",
    error: "Impossible d'analyser l'image. Veuillez réessayer.",
    startTreatment: "Commencer Traitement",
    resourceCheckTitle: "Vérifier Ressources",
    resourceCheckSubtitle: "Sélectionnez ce que vous avez sous la main.",
    call112: "APPELEZ LE 112",
    callWarning: "Ne raccrochez pas avant d'y être invité.",
    newAnalysis: "Analyser une nouvelle image",
    nextStep: "Étape Suivante ->",
    finish: "Terminer le traitement",
    safety: "Sécurité",
    minor: "Blessure Mineure",
    homeCare: "Soins à Domicile",
    medium: "Attention Accrue",
    medCare: "Traitement + Médecin",
    context: "Contextuel :",
    contextDesc: "Instruction adaptée aux ressources :",
    major: "Urgence Majeure",
    action: "Action Requise",
    userMessageLabel: "Message Contextuel / Langue (Optionnel):",
    userMessagePlaceholder: "Ex: 'Je me suis coupé' ou 'English'",
    listenButton: "Écouter"
  },
  de: {
    title: "ErsteHilfe",
    titleSuffix: "Assistent",
    reset: "Zurücksetzen",
    uploadTitle: "Schnelle Erste Hilfe",
    uploadDesc: "Laden Sie ein Foto der Verletzung hoch. Die KI entscheidet, ob es ein Notfall ist.",
    uploadButton: "Verletzung zur Analyse hochladen",
    analyzing: "Gemini analysiert...",
    error: "Bild konnte nicht analysiert werden. Bitte versuchen Sie es erneut.",
    startTreatment: "Behandlung starten",
    resourceCheckTitle: "Ressourcen prüfen",
    resourceCheckSubtitle: "Wählen Sie aus, was Sie zur Hand haben.",
    call112: "RUFEN SIE 112 AN",
    callWarning: "Legen Sie nicht auf, bevor Sie dazu aufgefordert werden.",
    newAnalysis: "Neues Bild analysieren",
    nextStep: "Nächster Schritt ->",
    finish: "Behandlung beenden",
    safety: "Sicherheit",
    minor: "Leichte Verletzung",
    homeCare: "Hausbehandlung",
    medium: "Erhöhte Aufmerksamkeit",
    medCare: "Behandlung + Arzt",
    context: "Kontextbezogen:",
    contextDesc: "Anweisung angepasst an Ressourcen:",
    major: "Großer Notfall",
    action: "Handlung Erforderlich",
    userMessageLabel: "Kontextnachricht / Sprache (Optional):",
    userMessagePlaceholder: "Bsp: 'Schnitt am Finger' oder 'English'",
    listenButton: "Anhören"
  },
  it: {
    title: "Assistente",
    titleSuffix: "PrimoSoccorso",
    reset: "Reimposta",
    uploadTitle: "Primo Soccorso Rapido",
    uploadDesc: "Carica una foto della lesione. L'IA deciderà se è un'emergenza o minore.",
    uploadButton: "Carica lesione per analisi",
    analyzing: "Gemini sta analizzando...",
    error: "Impossibile analizzare l'immagine. Riprova.",
    startTreatment: "Inizia Trattamento",
    resourceCheckTitle: "Verifica Risorse",
    resourceCheckSubtitle: "Seleziona ciò che hai a portata di mano.",
    call112: "CHIAMA IL 112 ORA",
    callWarning: "Non riagganciare finché non ti viene detto.",
    newAnalysis: "Analizza nuova immagine",
    nextStep: "Prossimo Passo ->",
    finish: "Termina Trattamento",
    safety: "Sicurezza",
    minor: "Lesione Minore",
    homeCare: "Cura a Casa",
    medium: "Attenzione Accresciuta",
    medCare: "Trattamento + Medico",
    context: "Contestuale:",
    contextDesc: "Istruzione adattata alle risorse:",
    major: "Emergenza Maggiore",
    action: "Azione Richiesta",
    userMessageLabel: "Messaggio Contesto / Lingua (Opzionale):",
    userMessagePlaceholder: "Es: 'Taglio al dito' o 'English'",
    listenButton: "Ascolta"
  },
  es: {
    title: "Asistente",
    titleSuffix: "PrimerosAuxilios",
    reset: "Reiniciar",
    uploadTitle: "Primeros Auxilios Rápidos",
    uploadDesc: "Sube una foto de la lesión. La IA decidirá si es una Emergencia o Leve.",
    uploadButton: "Subir lesión para análisis",
    analyzing: "Gemini está analizando...",
    error: "No se pudo analizar la imagen. Por favor, inténtalo de nuevo.",
    startTreatment: "Iniciar Tratamiento",
    resourceCheckTitle: "Verificar Recursos",
    resourceCheckSubtitle: "Selecciona lo que tienes a mano.",
    call112: "LLAMA AL 112 AHORA",
    callWarning: "No cuelgues hasta que te lo indiquen.",
    newAnalysis: "Analizar nueva imagen",
    nextStep: "Siguiente Paso ->",
    finish: "Finalizar Tratamiento",
    safety: "Seguridad",
    minor: "Lesión Leve",
    homeCare: "Cuidado en Casa",
    medium: "Atención Aumentada",
    medCare: "Tratamiento + Médico",
    context: "Contextual:",
    contextDesc: "Instrucción adaptada a recursos:",
    major: "Emergencia Mayor",
    action: "Acción Requerida",
    userMessageLabel: "Mensaje Contexto / Idioma (Opcional):",
    userMessagePlaceholder: "Ej: 'Corte en dedo' o 'English'",
    listenButton: "Escuchar"
  }
};

// Utility to remove [VOICE_COMMAND] tag for UI and clean TTS
const cleanText = (text: string | undefined) => {
  if (!text) return "";
  return text.replace(/\[VOICE_COMMAND\]/gi, '').trim();
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [language, setLanguage] = useState<Language>('ro');
  const [userMessage, setUserMessage] = useState('');
  const [analysis, setAnalysis] = useState<InjuryAnalysis | null>(null);
  const [confirmedResources, setConfirmedResources] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<StepInstruction | null>(null);
  const [stepHistory, setStepHistory] = useState<string[]>([]);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = UI_TEXT[language];

  // Auto-detect language from user text
  useEffect(() => {
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes('english') || lowerMsg.includes('en')) setLanguage('en');
    else if (lowerMsg.includes('french') || lowerMsg.includes('français') || lowerMsg.includes('francais')) setLanguage('fr');
    else if (lowerMsg.includes('german') || lowerMsg.includes('deutsch')) setLanguage('de');
    else if (lowerMsg.includes('italian') || lowerMsg.includes('italiano')) setLanguage('it');
    else if (lowerMsg.includes('spanish') || lowerMsg.includes('español') || lowerMsg.includes('espanol')) setLanguage('es');
    else if (lowerMsg.includes('romanian') || lowerMsg.includes('română') || lowerMsg.includes('romana')) setLanguage('ro');
  }, [userMessage]);

  // Soft Reset for State
  const resetApp = () => {
    setAnalysis(null);
    setCurrentStep(null);
    setStepHistory([]);
    setConfirmedResources([]);
    setAudioData(null);
    setErrorMsg(null);
    setUserMessage('');
    setState(AppState.IDLE);
  };

  // Handle File Upload & Analysis
  const handleFileSelect = async (file: File) => {
    setAnalysis(null);
    setCurrentStep(null);
    setStepHistory([]);
    setConfirmedResources([]);
    setAudioData(null);
    setErrorMsg(null);
    
    setState(AppState.ANALYZING);
    
    try {
      const result = await analyzeInjuryMedia(file, language, userMessage);
      setAnalysis(result);
      setState(AppState.TRIAGE_RESULT);
    } catch (err) {
      console.error(err);
      setErrorMsg(t.error);
      setState(AppState.IDLE);
    }
  };

  // Start Guidance Flow
  const handleStartTriage = () => {
    setState(AppState.RESOURCE_CHECK);
  };

  // Handle Resource Confirmation
  const handleResourcesConfirmed = async (resources: string[]) => {
    setConfirmedResources(resources);
    setState(AppState.GUIDE_STEP);
    await loadNextStep(resources, 0, []);
  };

  // Load Next Instruction Step
  const loadNextStep = async (resources: string[], index: number, history: string[]) => {
    if (!analysis) return;
    setLoadingStep(true);
    setAudioData(null); 
    
    try {
      const step = await generateStepGuide(analysis, resources, index, history, language);
      setCurrentStep(step);
      setStepHistory([...history, step.text]);
      
      // Generate Audio in background (strip tags first)
      try {
        const textToSpeak = cleanText(step.text);
        const speech = await generateSpeech(textToSpeak);
        setAudioData(speech);
      } catch (e) {
        console.warn("TTS failed", e);
      }

    } catch (err) {
      setErrorMsg("Error generating steps.");
    } finally {
      setLoadingStep(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep && !currentStep.isLastStep && analysis) {
      loadNextStep(confirmedResources, currentStep.stepNumber, stepHistory);
    } else {
        resetApp();
    }
  };

  // --- Renders ---

  const renderHeader = () => (
    <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="bg-red-600 rounded-lg p-1.5 shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        </div>
        <h1 className="font-extrabold text-lg text-gray-900 tracking-tight hidden sm:block">{t.title}<span className="text-red-600">{t.titleSuffix}</span></h1>
      </div>
      
      <div className="flex items-center gap-2">
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5"
          disabled={state !== AppState.IDLE && state !== AppState.TRIAGE_RESULT}
        >
          <option value="ro">RO 🇷🇴</option>
          <option value="en">EN 🇬🇧</option>
          <option value="fr">FR 🇫🇷</option>
          <option value="de">DE 🇩🇪</option>
          <option value="it">IT 🇮🇹</option>
          <option value="es">ES 🇪🇸</option>
        </select>
        
        {state !== AppState.IDLE && (
            <button onClick={resetApp} className="text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-1 bg-gray-50 rounded-lg border border-gray-200">
              {t.reset}
            </button>
        )}
      </div>
    </header>
  );

  const renderTriageResult = () => {
    if (!analysis) return null;
    
    const isCritical = analysis.severity === Severity.CRITICAL || analysis.severity === Severity.HIGH;
    const isMedium = analysis.severity === Severity.MEDIUM;
    const emergencyNumber = EMERGENCY_NUMBERS[language];
    
    // UI PENTRU URGENȚĂ MAJORĂ (112/911)
    if (isCritical) {
      return (
        <div className="flex flex-col h-full bg-red-600 text-white min-h-[calc(100vh-80px)]">
           <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl animate-pulse">
                 <span className="text-6xl">🚑</span>
              </div>
              
              <h2 className="text-4xl font-black mb-2 uppercase tracking-wide">{t.major}</h2>
              <div className="h-1 w-20 bg-white/50 rounded mb-6"></div>

              <p className="text-xl font-bold mb-8 leading-relaxed max-w-md">
                {cleanText(analysis.description)}
              </p>

              <div className="bg-red-800/50 p-6 rounded-2xl border border-red-400 mb-8 max-w-md w-full">
                <h3 className="text-red-200 uppercase text-xs font-bold mb-2 tracking-widest">{t.action}</h3>
                <p className="text-2xl font-bold">{cleanText(analysis.safetyWarning)}</p>
              </div>

              <a 
                href={`tel:${emergencyNumber}`}
                className="w-full max-w-md bg-white text-red-600 font-black text-3xl py-6 rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-3 mb-4"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                {t.call112}
              </a>
              <p className="text-red-200 text-sm mb-6">{t.callWarning}</p>
              
              <button 
                onClick={resetApp}
                className="text-red-100 hover:text-white underline text-sm opacity-80"
              >
                {t.newAnalysis}
              </button>
           </div>
        </div>
      );
    }

    // UI PENTRU LEZIUNE MINORĂ SAU MEDIE
    return (
      <div className="w-full max-w-md mx-auto p-4 space-y-6 pt-8">
        <div className={`bg-white rounded-3xl p-6 shadow-xl border-t-8 ${isMedium ? 'border-orange-500' : 'border-green-500'}`}>
            <div className="flex items-center gap-2 mb-4">
               {isMedium ? (
                 <>
                  <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {t.medium}
                  </div>
                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {t.medCare}
                  </div>
                 </>
               ) : (
                 <>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {t.minor}
                  </div>
                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {t.homeCare}
                  </div>
                 </>
               )}
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">{analysis.injuryType}</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8 border-l-4 border-gray-200 pl-4">
              {cleanText(analysis.description)}
            </p>
            
            <div className={`rounded-xl p-4 mb-8 flex items-start gap-3 ${isMedium ? 'bg-orange-50' : 'bg-green-50'}`}>
               <span className="text-2xl">🛡️</span>
               <div>
                 <h4 className={`font-bold text-sm uppercase mb-1 ${isMedium ? 'text-orange-900' : 'text-green-900'}`}>{t.safety}</h4>
                 <p className={`text-sm ${isMedium ? 'text-orange-900' : 'text-green-800'}`}>{cleanText(analysis.safetyWarning)}</p>
               </div>
            </div>

            <Button onClick={handleStartTriage} fullWidth variant="primary" className={`text-lg py-4 ${isMedium ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-200' : ''}`}>
                {t.startTreatment}
            </Button>
        </div>
      </div>
    );
  };

  const renderStepGuide = () => {
    if (loadingStep) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-6"></div>
                <p className="text-gray-500 font-medium animate-pulse">{t.analyzing}</p>
            </div>
        );
    }
    
    if (!currentStep) return null;

    return (
      <div className="flex flex-col h-[calc(100vh-80px)] max-w-md mx-auto relative bg-white md:rounded-3xl md:shadow-xl md:my-4 md:h-[800px] overflow-hidden">
        <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-start mb-8">
                 <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Step</span>
                    <span className="text-6xl font-black text-blue-600 leading-none">
                        {currentStep.stepNumber}
                    </span>
                 </div>
                 <div className="mt-2">
                    <AudioPlayer base64Audio={audioData} autoPlay={true} label={t.listenButton} />
                 </div>
            </div>
            
            <p className="text-3xl font-bold text-gray-800 leading-tight mb-8">
                {cleanText(currentStep.text)}
            </p>

            <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
                 <span className="text-3xl">💡</span>
                 <p className="text-base text-blue-900 pt-1 leading-snug">
                     <span className="font-bold block mb-1">{t.context}</span>
                     {t.contextDesc} {confirmedResources.join(', ')}.
                 </p>
            </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
             <Button onClick={handleNextStep} fullWidth className="text-lg py-4 shadow-lg shadow-blue-200">
                 {currentStep.isLastStep ? t.finish : t.nextStep}
             </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {renderHeader()}

      <main className="flex-1 w-full">
        {errorMsg && (
            <div className="bg-red-100 border border-red-200 text-red-700 p-4 text-center font-medium text-sm mb-4 mx-4 rounded-xl mt-4 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {errorMsg}
            </div>
        )}

        {state === AppState.IDLE && (
            <div className="mt-8 flex flex-col items-center">
                <div className="px-6 mb-8 text-center max-w-md">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-4">{t.uploadTitle}</h2>
                    <p className="text-gray-500 text-lg leading-relaxed">
                        {t.uploadDesc}
                    </p>
                </div>
                <FileUpload 
                  onFileSelect={handleFileSelect} 
                  isLoading={false} 
                  label={t.uploadButton}
                />
                
                <div className="w-full max-w-md px-4 mt-6">
                    <label htmlFor="userMessage" className="block text-sm font-medium text-gray-700 mb-2">
                        {t.userMessageLabel}
                    </label>
                    <textarea
                        id="userMessage"
                        rows={2}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-xl p-3"
                        placeholder={t.userMessagePlaceholder}
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                    />
                </div>
            </div>
        )}

        {state === AppState.ANALYZING && (
             <FileUpload 
                onFileSelect={() => {}} 
                isLoading={true} 
                label={t.uploadButton}
             />
        )}

        {state === AppState.TRIAGE_RESULT && renderTriageResult()}

        {state === AppState.RESOURCE_CHECK && analysis && (
            <div className="p-4 mt-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
                <ResourceCheck 
                    recommended={analysis.recommendedResources} 
                    onConfirm={handleResourcesConfirmed} 
                    title={t.resourceCheckTitle}
                    subtitle={t.resourceCheckSubtitle}
                    buttonText={t.startTreatment}
                />
            </div>
        )}

        {state === AppState.GUIDE_STEP && renderStepGuide()}
      </main>
    </div>
  );
};

export default App;
