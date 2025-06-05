import { Authenticated, Unauthenticated, useAction, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner";
import React, { useState, useEffect, useRef } from "react";
import { Doc, Id } from "../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import MicIcon from "./MicIcon";
import CameraIcon from "./CameraIcon";

// Language options (value should likely remain in English for backend/API consistency)
const languageOptions = [
  { value: "English", label: "Englisch" },
  { value: "Spanish", label: "Spanisch" },
  { value: "French", label: "Französisch" },
  { value: "German", label: "Deutsch" },
  { value: "Japanese", label: "Japanisch" },
  { value: "Chinese (Simplified)", label: "Chinesisch (Vereinfacht)" },
  { value: "Russian", label: "Russisch" },
  { value: "Arabic", label: "Arabisch" },
  { value: "Portuguese", label: "Portugiesisch" },
  { value: "Italian", label: "Italienisch" },
  { value: "Korean", label: "Koreanisch" },
  { value: "Hindi", label: "Hindi" },
  { value: "Dutch", label: "Niederländisch" },
  { value: "Swedish", label: "Schwedisch" },
  { value: "Turkish", label: "Türkisch" },
];

// Glow colors mapped from Tailwind config
const processGlowColors = {
  default: "var(--glow-default)", 
  recording: "var(--glow-recording)",
  translating: "var(--glow-translating)",
  camera: "var(--glow-camera)",
  success: "var(--glow-success)",
};

type ProcessType = keyof typeof processGlowColors;

function UsageDisplay() {
  const usageData = useQuery(api.usage.getCurrentMonthUsage);

  if (usageData === undefined) {
    return <div className="text-xs text-slate-400">Nutzung wird geladen...</div>;
  }

  if (usageData === null) {
    return null; 
  }
  
  const formattedChars = usageData.translatedCharacters.toLocaleString('de-DE');
  const limit = (100000).toLocaleString('de-DE'); 

  return (
    <div className="text-xs text-slate-300 bg-slate-700/50 px-3 py-1.5 rounded-lg shadow">
      Monatslimit: <strong>{formattedChars}</strong> / {limit} Zeichen
    </div>
  );
}

export default function App() {
  const [activeAppProcessType, setActiveAppProcessType] = useState<ProcessType>('default');
  
  const currentAppGlowColor = processGlowColors[activeAppProcessType] || processGlowColors.default;

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 bg-gradient-to-br from-gray-900 to-black text-slate-200 selection:bg-blue-500/30">
      <motion.header
        animate={{
          boxShadow: activeAppProcessType !== 'default'
            ? [`0 0 15px 2px ${currentAppGlowColor}90`, `0 0 25px 5px ${currentAppGlowColor}50`, `0 0 15px 2px ${currentAppGlowColor}90`]
            : `0 0 10px 0px ${processGlowColors.default}30`, // Softer default glow
        }}
        transition={{ 
          duration: activeAppProcessType !== 'default' ? 1.5 : 0.5,
          repeat: activeAppProcessType !== 'default' ? Infinity : 0,
          ease: "easeInOut"
        }}
        className="rounded-2xl border border-white-t p-4 sm:p-5 mb-6 sm:mb-8 backdrop-blur-md bg-slate-800/40 shadow-xl"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-blue">
            Polyglotte Translator
          </h1>
          <div className="flex items-center gap-3 sm:gap-4">
            <Authenticated>
              <UsageDisplay />
              <SignOutButton /> {/* Uses .auth-button style from index.css */}
            </Authenticated>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 flex flex-col items-stretch">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 sm:gap-8">
          <TranslatorSection setAppProcessType={setActiveAppProcessType} />
          <Authenticated>
            <GlossaryManager />
          </Authenticated>
          <Unauthenticated>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4 p-6 sm:p-8 bg-slate-800/50 border border-white-t backdrop-blur-md shadow-2xl rounded-2xl text-center"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-blue mb-1">
                Willkommen zurück!
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                Melden Sie sich an, um Ihre Übersetzungen und Glossareinträge zu verwalten.
              </p>
              <SignInForm /> {/* Inputs use .auth-input-field, button uses .auth-button */}
            </motion.div>
          </Unauthenticated>
        </div>
      </main>
      <Toaster richColors theme="dark" position="top-right" closeButton />
      
      {/* Bottom pulsating border effect */}
      {activeAppProcessType !== 'default' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          exit={{ opacity: 0 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="fixed bottom-0 left-0 right-0 h-1 sm:h-[3px] z-20 pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${currentAppGlowColor}, transparent)` }}
        />
      )}
    </div>
  );
}

function TranslatorSection({ setAppProcessType }: { setAppProcessType: (type: ProcessType) => void }) {
  const [sourceLanguage, setSourceLanguage] = useState("English");
  const [targetLanguage, setTargetLanguage] = useState("German");
  const [textToTranslate, setTextToTranslate] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [currentInternalProcessType, setCurrentInternalProcessType] = useState<ProcessType>('default');
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const performTranslation = useAction(api.translate.translateText);

  useEffect(() => {
    setAppProcessType(currentInternalProcessType);
  }, [currentInternalProcessType, setAppProcessType]);

  const resetProcessAfterDelay = (typeToClear: ProcessType, delay: number = 2000) => {
    setTimeout(() => {
      // Only reset if the process hasn't changed in the meantime
      setCurrentInternalProcessType(prev => prev === typeToClear ? 'default' : prev);
    }, delay);
  };
  
  const handleTranslate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!textToTranslate.trim() || isApiLoading) return;

    setIsApiLoading(true);
    setCurrentInternalProcessType('translating');
    try {
      const result = await performTranslation({
        text: textToTranslate,
        sourceLanguage,
        targetLanguage,
      });
      if (result) {
        setTranslatedText(result);
        toast.success("Übersetzung erfolgreich!");
        setCurrentInternalProcessType('success');
        resetProcessAfterDelay('success', 1500); // Shorter delay for success indication
      } else {
        setTranslatedText("");
        toast.error("Übersetzung fehlgeschlagen oder Text war leer.");
        setCurrentInternalProcessType('default');
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Ein Fehler ist bei der Übersetzung aufgetreten.";
      toast.error(errorMessage);
      setTranslatedText("");
      setCurrentInternalProcessType('default');
    } finally {
      setIsApiLoading(false);
    }
  };

  useEffect(() => {
    if (sourceLanguage === targetLanguage) {
      const newTarget = languageOptions.find(lang => lang.value !== sourceLanguage && lang.value === "German") || languageOptions.find(lang => lang.value !== sourceLanguage);
      if (newTarget) setTargetLanguage(newTarget.value);
    }
  }, [sourceLanguage, targetLanguage]);

  const handleSwapLanguages = () => {
    if (isApiLoading || currentInternalProcessType !== 'default') return;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setTextToTranslate(translatedText);
    setTranslatedText(textToTranslate);
    toast.info("Sprachen getauscht!");
  };

  const handleMicClick = () => {
    if (isApiLoading || (currentInternalProcessType !== 'default' && currentInternalProcessType !== 'recording')) return;
    const currentlyRecording = currentInternalProcessType === 'recording';
    if (currentlyRecording) {
      setCurrentInternalProcessType('default');
      toast.info("Mikrofonaufnahme beendet (Simulation).");
    } else {
      setCurrentInternalProcessType('recording');
      toast.info("Mikrofon an (Simulation). Erneut klicken zum Beenden.");
      // Example: Simulate speech-to-text after 3s if still recording
      // setTimeout(() => {
      //   setCurrentInternalProcessType(prev => {
      //     if (prev === 'recording') {
      //       setTextToTranslate("Simulierter aufgenommener Text...");
      //       toast.success("Text von Spracheingabe übernommen (Simulation).");
      //       return 'default';
      //     }
      //     return prev;
      //   });
      // }, 3000);
    }
  };
  
  const handleCameraClick = () => {
    if (isApiLoading || (currentInternalProcessType !== 'default' && currentInternalProcessType !== 'camera')) return;
    setCurrentInternalProcessType('camera');
    toast.info("Kameramodus aktiviert (Simulation).");
    resetProcessAfterDelay('camera', 3000); // Auto-reset camera simulation
  };

  const currentContainerGlowColor = processGlowColors[currentInternalProcessType] || processGlowColors.default;

  return (
    <motion.div
      animate={{
        borderColor: currentInternalProcessType !== 'default' ? currentContainerGlowColor : "var(--color-border-primary)",
        boxShadow: currentInternalProcessType !== 'default'
          ? [`0 0 20px 3px ${currentContainerGlowColor}B3`, `0 0 30px 6px ${currentContainerGlowColor}70`, `0 0 20px 3px ${currentContainerGlowColor}B3`]
          : `0 0 15px 0px ${processGlowColors.default}20`, // Softer default shadow
      }}
      transition={{ 
        duration: currentInternalProcessType !== 'default' ? 1.5 : 0.5,
        repeat: currentInternalProcessType !== 'default' && currentInternalProcessType !== 'success' ? Infinity : 0, // Success glow doesn't repeat
        ease: "easeInOut" 
      }}
      className="flex flex-col gap-5 sm:gap-6 p-5 sm:p-6 border-2 rounded-3xl bg-slate-800/60 backdrop-blur-lg shadow-2xl"
    >
      {/* Input Text Area */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={textToTranslate}
          onChange={(e) => setTextToTranslate(e.target.value)}
          placeholder="Text hier eingeben oder Funktionen nutzen..."
          rows={5}
          className="w-full p-4 bg-slate-700/50 text-slate-100 placeholder-slate-400 resize-none focus:outline-none text-base sm:text-lg rounded-xl border border-slate-600 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/70 transition-all"
          disabled={isApiLoading || (currentInternalProcessType !== 'default' && currentInternalProcessType !== 'recording')}
        />
      </div>

      {/* Language Selection & Swap */}
      <motion.div
        className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4"
        animate={{ scale: currentInternalProcessType === 'translating' ? [1, 1.01, 1] : 1 }}
        transition={{ repeat: currentInternalProcessType === 'translating' ? Infinity : 0, duration: 1.2, ease: "linear" }}
      >
        <div className="flex-1 w-full">
          <label htmlFor="translatorSourceLang" className="block text-xs font-medium text-slate-400 mb-1">Von:</label>
          <select
            id="translatorSourceLang"
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
            className="w-full p-3 bg-slate-700/70 border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent outline-none transition-all shadow-sm hover:border-slate-500 text-slate-100 text-sm sm:text-base"
            disabled={isApiLoading || (currentInternalProcessType !== 'default' && currentInternalProcessType !== 'success')}
          >
            {languageOptions.map((lang) => (
              <option key={`src-${lang.value}`} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        
        <motion.button
          type="button"
          onClick={handleSwapLanguages}
          title="Sprachen tauschen"
          className="p-2.5 rounded-lg hover:bg-slate-700/90 transition-colors text-brand-cyan disabled:opacity-50 disabled:cursor-not-allowed mt-4 sm:mt-0 sm:self-end"
          whileHover={{ scale: (isApiLoading || (currentInternalProcessType !== 'default' && currentInternalProcessType !== 'success')) ? 1 : 1.15 }}
          whileTap={{ scale: (isApiLoading || (currentInternalProcessType !== 'default' && currentInternalProcessType !== 'success')) ? 1 : 0.9 }}
          disabled={isApiLoading || (currentInternalProcessType !== 'default' && currentInternalProcessType !== 'success')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h18m-7.5-14L21 6.5m0 0L16.5 11M21 6.5H3" />
          </svg>
        </motion.button>
        
        <div className="flex-1 w-full">
          <label htmlFor="translatorTargetLang" className="block text-xs font-medium text-slate-400 mb-1">Nach:</label>
          <select
            id="translatorTargetLang"
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="w-full p-3 bg-slate-700/70 border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent outline-none transition-all shadow-sm hover:border-slate-500 text-slate-100 text-sm sm:text-base"
            disabled={isApiLoading || (currentInternalProcessType !== 'default' && currentInternalProcessType !== 'success')}
          >
            {languageOptions.map((lang) => (
              <option key={`target-${lang.value}`} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Action Buttons: Mic, Camera, Translate */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-2 sm:mt-4">
        <div className="flex gap-3 sm:gap-4">
          <ActionButton
            icon={MicIcon}
            label="Sprechen"
            onClick={handleMicClick}
            isActive={currentInternalProcessType === 'recording'}
            glowColor={processGlowColors.recording}
            disabled={isApiLoading || (currentInternalProcessType !== 'default' && currentInternalProcessType !== 'recording')}
          />
          <ActionButton
            icon={CameraIcon}
            label="Kamera"
            onClick={handleCameraClick}
            isActive={currentInternalProcessType === 'camera'}
            glowColor={processGlowColors.camera}
            disabled={isApiLoading || (currentInternalProcessType !== 'default' && currentInternalProcessType !== 'camera')}
          />
        </div>
        <motion.button
          type="button"
          onClick={handleTranslate}
          className="w-full sm:w-auto mt-3 sm:mt-0 px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue text-white font-semibold hover:opacity-90 transition-opacity shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          disabled={isApiLoading || !textToTranslate.trim() || (currentInternalProcessType !== 'default' && currentInternalProcessType !== 'success')}
          whileHover={{ scale: (isApiLoading || !textToTranslate.trim() || (currentInternalProcessType !== 'default' && currentInternalProcessType !== 'success')) ? 1 : 1.05 }}
          whileTap={{ scale: (isApiLoading || !textToTranslate.trim() || (currentInternalProcessType !== 'default' && currentInternalProcessType !== 'success')) ? 1 : 0.95 }}
        >
          {isApiLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Übersetze...
            </>
          ) : (
            "Text Übersetzen"
          )}
        </motion.button>
      </div>

      {/* Output Text Area */}
      <AnimatePresence mode="wait">
        {(translatedText || (isApiLoading && !translatedText)) && (
          <motion.div
            key="output"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2 sm:mt-4"
          >
            <label htmlFor="translatedTextOutput" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">Übersetzung ({languageOptions.find(l=>l.value === targetLanguage)?.label})</label>
            <div
              id="translatedTextOutput"
              className="w-full p-4 bg-slate-700/40 border border-slate-600/70 rounded-xl shadow-inner min-h-[120px] overflow-y-auto whitespace-pre-wrap text-slate-50 text-base sm:text-lg"
            >
              {isApiLoading && !translatedText ? <span className="text-slate-400 italic">Übersetze...</span> : translatedText || <span className="text-slate-500 italic">Übersetzung erscheint hier.</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  isActive: boolean;
  glowColor: string;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon: Icon, label, onClick, isActive, glowColor, disabled }) => {
  return (
    <motion.button
      onClick={onClick}
      animate={{
        borderColor: isActive ? glowColor : "var(--color-border-primary)",
        boxShadow: isActive ? [`0 0 15px 2px ${glowColor}B3`, `0 0 25px 5px ${glowColor}70`, `0 0 15px 2px ${glowColor}B3`] : "none", // Pulsating shadow
      }}
      transition={{ duration: isActive ? 1.5 : 0.3, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 bg-slate-800/70 backdrop-blur-sm w-24 h-24 sm:w-28 sm:h-28 disabled:opacity-50 disabled:cursor-not-allowed disabled:!transform-none disabled:!shadow-none transition-all"
      disabled={disabled}
      title={label}
    >
      <Icon 
        className={`w-6 h-6 sm:w-7 sm:h-7 mb-1 sm:mb-1.5 transition-colors ${isActive ? 'text-white' : 'text-slate-300'}`} 
        stroke={isActive ? glowColor : 'currentColor'} 
        fill={isActive ? glowColor : (Icon === MicIcon ? 'currentColor' : 'none')} // MicIcon can have fill, CameraIcon usually not
      />
      <span className={`text-xs sm:text-sm transition-colors ${isActive ? 'text-white' : 'text-slate-300'}`}>{label}</span>
    </motion.button>
  );
};

function GlossaryManager() {
  const [glossarySourceLanguage, setGlossarySourceLanguage] = useState("English");
  const [glossaryTargetLanguage, setGlossaryTargetLanguage] = useState("German");
  const [newTerm, setNewTerm] = useState("");
  const [newCustomTranslation, setNewCustomTranslation] = useState("");
  const [isSubmittingTerm, setIsSubmittingTerm] = useState(false);
  const [editingTermId, setEditingTermId] = useState<Id<"userGlossaries"> | null>(null);

  const glossaryTerms = useQuery(api.glossary.getGlossaryTerms, {
    sourceLanguage: glossarySourceLanguage,
    targetLanguage: glossaryTargetLanguage,
  }) || [];

  const addGlossaryTermMutation = useMutation(api.glossary.addGlossaryTerm);
  const updateGlossaryTermMutation = useMutation(api.glossary.updateGlossaryTerm);
  const deleteGlossaryTermMutation = useMutation(api.glossary.deleteGlossaryTerm);

  const handleSubmitTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newCustomTranslation.trim()) {
      toast.error("Begriff und benutzerdefinierte Übersetzung sind erforderlich.");
      return;
    }
    setIsSubmittingTerm(true);
    try {
      if (editingTermId) {
        await updateGlossaryTermMutation({
          glossaryTermId: editingTermId,
          term: newTerm,
          customTranslation: newCustomTranslation,
        });
        toast.success("Begriff erfolgreich aktualisiert!");
      } else {
        const result = await addGlossaryTermMutation({
          term: newTerm,
          customTranslation: newCustomTranslation,
          sourceLanguage: glossarySourceLanguage,
          targetLanguage: glossaryTargetLanguage,
        });
        if (result) {
          toast.success("Begriff zum Glossar hinzugefügt!");
        } else {
          toast.info("Begriff existiert möglicherweise bereits oder konnte nicht hinzugefügt werden.");
        }
      }
      setNewTerm("");
      setNewCustomTranslation("");
      setEditingTermId(null);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Fehler beim Senden des Begriffs.");
    } finally {
      setIsSubmittingTerm(false);
    }
  };

  const handleEditTerm = (term: Doc<"userGlossaries">) => {
    setEditingTermId(term._id);
    setNewTerm(term.term);
    setNewCustomTranslation(term.customTranslation);
    if (term.sourceLanguage !== glossarySourceLanguage || term.targetLanguage !== glossaryTargetLanguage) {
        toast.info(`Bearbeite Begriff für ${languageOptions.find(l=>l.value === term.sourceLanguage)?.label || term.sourceLanguage} zu ${languageOptions.find(l=>l.value === term.targetLanguage)?.label || term.targetLanguage}. Formularsprachen aktualisiert.`);
        setGlossarySourceLanguage(term.sourceLanguage);
        setGlossaryTargetLanguage(term.targetLanguage);
    }
  };

  const handleCancelEdit = () => {
    setEditingTermId(null);
    setNewTerm("");
    setNewCustomTranslation("");
  };

  const handleDeleteTerm = async (id: Id<"userGlossaries">) => {
    if (editingTermId === id) {
        handleCancelEdit();
    }
    try {
      await deleteGlossaryTermMutation({ glossaryTermId: id });
      toast.success("Begriff aus Glossar gelöscht.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen des Begriffs.");
    }
  };
  
  useEffect(() => {
    if (glossarySourceLanguage === glossaryTargetLanguage) {
      const otherOption = languageOptions.find(lang => lang.value !== glossarySourceLanguage && lang.value === "German") || languageOptions.find(lang => lang.value !== glossarySourceLanguage);
      if (otherOption) {
        setGlossaryTargetLanguage(otherOption.value);
      }
    }
    if (!editingTermId) handleCancelEdit(); // Reset form if not editing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glossarySourceLanguage, glossaryTargetLanguage]);


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex flex-col gap-5 sm:gap-6 p-5 sm:p-6 bg-slate-800/50 border border-white-t backdrop-blur-md shadow-2xl rounded-2xl"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-blue mb-1 text-center">
        Glossar Verwalten
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div>
          <label htmlFor="glossarySourceLang" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">Quellsprache</label>
          <select
            id="glossarySourceLang"
            value={glossarySourceLanguage}
            onChange={(e) => setGlossarySourceLanguage(e.target.value)}
            className="w-full p-3 bg-slate-700/70 border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent outline-none transition-all shadow-sm hover:border-slate-500 text-slate-100 text-sm"
            disabled={!!editingTermId || isSubmittingTerm}
          >
            {languageOptions.map((lang) => (
              <option key={`gloss-src-${lang.value}`} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="glossaryTargetLang" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">Zielsprache</label>
          <select
            id="glossaryTargetLang"
            value={glossaryTargetLanguage}
            onChange={(e) => setGlossaryTargetLanguage(e.target.value)}
            className="w-full p-3 bg-slate-700/70 border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent outline-none transition-all shadow-sm hover:border-slate-500 text-slate-100 text-sm"
            disabled={!!editingTermId || isSubmittingTerm}
          >
            {languageOptions.filter(lang => lang.value !== glossarySourceLanguage).map((lang) => (
              <option key={`gloss-target-${lang.value}`} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmitTerm} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="newTerm" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">Begriff ({languageOptions.find(l=>l.value === glossarySourceLanguage)?.label})</label>
          <input
            id="newTerm"
            type="text"
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            placeholder="Begriff eingeben"
            className="w-full p-3 bg-slate-700/50 text-slate-100 placeholder-slate-400 rounded-lg border border-slate-600 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all text-sm"
            disabled={isSubmittingTerm}
          />
        </div>
        <div>
          <label htmlFor="newCustomTranslation" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">Eigene Übersetzung ({languageOptions.find(l=>l.value === glossaryTargetLanguage)?.label})</label>
          <input
            id="newCustomTranslation"
            type="text"
            value={newCustomTranslation}
            onChange={(e) => setNewCustomTranslation(e.target.value)}
            placeholder="Übersetzung eingeben"
            className="w-full p-3 bg-slate-700/50 text-slate-100 placeholder-slate-400 rounded-lg border border-slate-600 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all text-sm"
            disabled={isSubmittingTerm}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-end md:col-span-1 mt-2 md:mt-0">
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-lg text-white font-semibold transition-colors shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              style={{backgroundColor: editingTermId ? processGlowColors.success : processGlowColors.default}} // Using glow colors for buttons
              disabled={isSubmittingTerm || !newTerm.trim() || !newCustomTranslation.trim()}
            >
              {isSubmittingTerm ? (editingTermId ? "Aktualisiere..." : "Füge hinzu...") : (editingTermId ? "Begriff Aktualisieren" : "Begriff Hinzufügen")}
            </button>
            {editingTermId && (
                 <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full sm:w-auto px-4 py-3 rounded-lg bg-slate-600 text-white font-semibold hover:bg-slate-500 transition-colors shadow-md text-sm"
                    disabled={isSubmittingTerm}
                >
                    Abbrechen
                </button>
            )}
        </div>
      </form>

      <div className="mt-3">
        <h3 className="text-lg sm:text-xl font-semibold text-slate-100 mb-3">
          Ihre Begriffe: {languageOptions.find(l=>l.value === glossarySourceLanguage)?.label || glossarySourceLanguage} → {languageOptions.find(l=>l.value === glossaryTargetLanguage)?.label || glossaryTargetLanguage}
        </h3>
        {glossaryTerms.length === 0 ? (
          <p className="text-slate-400 text-sm italic">Noch keine Begriffe für dieses Sprachpaar hinzugefügt.</p>
        ) : (
          <ul className="space-y-2.5 max-h-80 overflow-y-auto pr-2 -mr-2"> {/* Negative margin for scrollbar */}
            {glossaryTerms.map((item) => (
              <li key={item._id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg shadow-sm hover:bg-slate-700/80 transition-colors">
                <div>
                  <p className="font-medium text-slate-100 text-sm sm:text-base">{item.term}</p>
                  <p className="text-xs sm:text-sm text-brand-cyan">{item.customTranslation}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleEditTerm(item)}
                        className="px-2.5 py-1 text-xs rounded-md bg-yellow-500/80 text-white hover:bg-yellow-500 transition-colors disabled:opacity-50"
                        disabled={isSubmittingTerm || (!!editingTermId && editingTermId !== item._id)}
                    >
                        Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDeleteTerm(item._id)}
                      className="px-2.5 py-1 text-xs rounded-md bg-red-600/80 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                      disabled={isSubmittingTerm}
                    >
                      Löschen
                    </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
