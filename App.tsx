
import React, { useState, useMemo } from 'react';

// --- TYPE DEFINITIONS ---
interface TelescopeInputs {
  focaleTelescope: string;
  diametreTelescope: string;
  focaleOculaire: string;
  afovOculaire: string;
}

interface CalculationResults {
  grossissement: number | null;
  pupilleDeSortie: number | null;
  grossissementMax: number | null;
  tfov: number | null;
}

type QuickSettingKey = 'planetaire' | 'lunaire' | 'cielProfond';

// --- SVG ICONS ---
const TelescopeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10l-2.5 2.5M10 10l-2.5-2.5M10 10l2.5 2.5M10 10l2.5-2.5" />
    </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

// --- UI COMPONENTS ---
interface InputFieldProps {
    label: string;
    id: keyof TelescopeInputs;
    value: string;
    unit: string;
    placeholder: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({ label, id, value, unit, placeholder, onChange }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <div className="relative">
            <input
                type="number"
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-slate-400">{unit}</span>
        </div>
    </div>
);

interface ResultCardProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    extraInfo?: string;
    infoColor?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ label, value, icon, extraInfo, infoColor }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg flex items-center space-x-4 shadow-lg">
        <div className="flex-shrink-0 text-cyan-400">{icon}</div>
        <div>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
            {extraInfo && <p className={`text-xs ${infoColor}`}>{extraInfo}</p>}
        </div>
    </div>
);


// --- MAIN APP COMPONENT ---
export default function App() {
    const [inputs, setInputs] = useState<TelescopeInputs>({
        focaleTelescope: '1200',
        diametreTelescope: '114',
        focaleOculaire: '10',
        afovOculaire: '52',
    });
    
    const [activeSetting, setActiveSetting] = useState<QuickSettingKey | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
    };

    const { results, alerts } = useMemo(() => {
        const focaleTelescope = parseFloat(inputs.focaleTelescope);
        const diametreTelescope = parseFloat(inputs.diametreTelescope);
        const focaleOculaire = parseFloat(inputs.focaleOculaire);
        const afovOculaire = parseFloat(inputs.afovOculaire);

        const newResults: CalculationResults = {
            grossissement: null,
            pupilleDeSortie: null,
            grossissementMax: null,
            tfov: null,
        };
        const newAlerts: string[] = [];

        if (isNaN(focaleTelescope) || isNaN(diametreTelescope) || isNaN(focaleOculaire) || focaleTelescope <= 0 || diametreTelescope <= 0 || focaleOculaire <= 0) {
            return { results: newResults, alerts: newAlerts };
        }

        const grossissement = focaleTelescope / focaleOculaire;
        newResults.grossissement = grossissement;

        const pupilleDeSortie = diametreTelescope / grossissement;
        newResults.pupilleDeSortie = pupilleDeSortie;

        const grossissementMax = 2 * diametreTelescope;
        newResults.grossissementMax = grossissementMax;

        if (!isNaN(afovOculaire) && afovOculaire > 0) {
            newResults.tfov = afovOculaire / grossissement;
        }

        // Generate alerts
        if (pupilleDeSortie > 7) {
            newAlerts.push("La pupille de sortie (> 7 mm) est plus grande que la pupille de l’œil : vous perdez de la lumière.");
        }
        if (grossissement > grossissementMax) {
            newAlerts.push("Vous utilisez un grossissement supérieur à l'utilisable : risque de flou.");
        }

        return { results: newResults, alerts: newAlerts };
    }, [inputs]);
    
    const QUICK_SETTINGS: Record<QuickSettingKey, { label: string; recommendation: string }> = {
        planetaire: { label: 'Planétaire', recommendation: 'Pupille de sortie recommandée : 0,7 - 2 mm' },
        lunaire: { label: 'Lune / Sol', recommendation: 'Pupille de sortie recommandée : 1 - 3 mm' },
        cielProfond: { label: 'Ciel Profond', recommendation: 'Pupille de sortie recommandée : 1,5 - 4 mm (jusqu\'à 7 mm)' },
    };

    return (
        <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8">
            <main className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Calculateur de Grossissement Oculaire</h1>
                    <p className="mt-2 text-slate-400">Calculez rapidement les performances de votre télescope.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* --- Input Section --- */}
                    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl space-y-4">
                        <h2 className="text-xl font-semibold text-cyan-400 border-b border-slate-700 pb-2">Paramètres</h2>
                        <InputField label="Focale du télescope" id="focaleTelescope" value={inputs.focaleTelescope} onChange={handleInputChange} unit="mm" placeholder="ex: 1200" />
                        <InputField label="Diamètre de l'ouverture" id="diametreTelescope" value={inputs.diametreTelescope} onChange={handleInputChange} unit="mm" placeholder="ex: 114" />
                        <InputField label="Focale de l'oculaire" id="focaleOculaire" value={inputs.focaleOculaire} onChange={handleInputChange} unit="mm" placeholder="ex: 10" />
                        <InputField label="AFOV de l'oculaire (optionnel)" id="afovOculaire" value={inputs.afovOculaire} onChange={handleInputChange} unit="°" placeholder="ex: 52" />
                    </div>

                    {/* --- Results Section --- */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-cyan-400">Résultats</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ResultCard
                                label="Grossissement"
                                value={results.grossissement ? `${results.grossissement.toFixed(0)}×` : '---'}
                                icon={<TelescopeIcon className="w-8 h-8"/>}
                            />
                            <ResultCard
                                label="Pupille de sortie"
                                value={results.pupilleDeSortie ? `${results.pupilleDeSortie.toFixed(2)} mm` : '---'}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                            />
                            <ResultCard
                                label="Grossissement Max. Utile"
                                value={results.grossissementMax ? `${results.grossissementMax.toFixed(0)}×` : '---'}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                                extraInfo={results.grossissement && results.grossissementMax ? (results.grossissement <= results.grossissementMax ? 'Dans la limite' : 'Limite dépassée') : ''}
                                infoColor={results.grossissement && results.grossissementMax && results.grossissement > results.grossissementMax ? 'text-amber-400' : 'text-green-400'}
                            />
                            <ResultCard
                                label="Champ de vision réel (TFOV)"
                                value={results.tfov ? `${results.tfov.toFixed(2)}°` : '---'}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg>}
                            />
                        </div>

                        {alerts.length > 0 && (
                            <div className="space-y-2 mt-4">
                                {alerts.map((alert, index) => (
                                    <div key={index} className="bg-amber-500/10 border-l-4 border-amber-500 text-amber-300 p-4 rounded-r-lg flex items-center" role="alert">
                                        <WarningIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                                        <p className="text-sm">{alert}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Quick Settings Section --- */}
                <div className="mt-12">
                    <h2 className="text-xl font-semibold text-cyan-400 text-center mb-4">Réglages Rapides</h2>
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                        {Object.entries(QUICK_SETTINGS).map(([key, setting]) => (
                            <button
                                key={key}
                                onClick={() => setActiveSetting(key as QuickSettingKey)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${activeSetting === key ? 'bg-cyan-500 text-slate-900 shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                {setting.label}
                            </button>
                        ))}
                    </div>
                    {activeSetting && (
                        <div className="mt-4 text-center bg-slate-800/50 p-4 rounded-lg max-w-md mx-auto">
                            <p className="text-cyan-300">{QUICK_SETTINGS[activeSetting].recommendation}</p>
                        </div>
                    )}
                </div>

            </main>
             <footer className="text-center mt-12 text-slate-500 text-sm">
                <p>Créé pour les passionnés d'astronomie.</p>
            </footer>
        </div>
    );
}
