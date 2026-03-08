/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality } from "@google/genai";

let currentAudioContext: AudioContext | null = null;
let currentAudioSource: AudioBufferSourceNode | null = null;

export const stopCurrentAudio = () => {
  if (currentAudioSource) {
    try {
      currentAudioSource.stop();
    } catch (e) {}
    currentAudioSource = null;
  }
};

const playBase64PCM = async (base64Data: string) => {
  stopCurrentAudio();
  try {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    if (!currentAudioContext) {
      currentAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioCtx = currentAudioContext;
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    const sampleRate = 24000;
    const numChannels = 1;
    const numSamples = bytes.length / 2;
    
    const audioBuffer = audioCtx.createBuffer(numChannels, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    const dataView = new DataView(bytes.buffer);
    for (let i = 0; i < numSamples; i++) {
      const sample = dataView.getInt16(i * 2, true);
      channelData[i] = sample < 0 ? sample / 32768 : sample / 32767;
    }
    
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();
    currentAudioSource = source;
  } catch (e) {
    console.error("Audio playback error", e);
  }
};

const generateAndPlayAudio = async (text: string) => {
  stopCurrentAudio();
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      await playBase64PCM(base64Audio);
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
};
import { 
  BookOpen, 
  GraduationCap, 
  ArrowRight,
  LayoutDashboard,
  MonitorPlay,
  Gamepad2,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  User,
  LogOut
} from 'lucide-react';

type UserType = 'teacher' | 'student' | null;

export default function App() {
  const [userType, setUserType] = useState<UserType>(null);

  return (
    <div className="min-h-screen w-full overflow-hidden bg-white">
      <AnimatePresence mode="wait">
        {!userType ? (
          <div key="welcome-container" className="min-h-screen w-full flex items-center justify-center p-6 sm:p-12">
            <WelcomeScreen onSelect={setUserType} />
          </div>
        ) : userType === 'teacher' ? (
          <TeacherDashboard key="teacher" onBack={() => setUserType(null)} />
        ) : (
          <div key="student-container" className="min-h-screen w-full flex items-center justify-center p-6 sm:p-12">
            <StudentDashboard onBack={() => setUserType(null)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WelcomeScreen({ onSelect }: { onSelect: (type: UserType) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
    >
      {/* Left Side: Messaging */}
      <div className="flex flex-col space-y-6">
        <div className="inline-flex items-center space-x-2 bg-tech-brain/10 text-tech-brain px-3 py-1 rounded-full w-fit text-sm font-medium mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tech-brain opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-tech-brain"></span>
          </span>
          <span>System Ready</span>
        </div>
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-navy leading-tight">
          Welcome to <br />
          <span className="text-primary-pulse">String Education</span>
        </h1>
        <p className="text-xl text-text-secondary max-w-lg leading-relaxed">
          The friendly operating system for modern learning. Connect, collaborate, and grow in an environment designed for human potential.
        </p>
      </div>

      {/* Right Side: User Selection */}
      <div className="flex flex-col space-y-4 w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Select your role to begin
        </h3>
        
        <RoleCard 
          title="I am a Teacher"
          description="Manage classes, create content, and guide your students."
          icon={<BookOpen className="w-6 h-6" />}
          onClick={() => onSelect('teacher')}
        />
        
        <RoleCard 
          title="I am a Student"
          description="Access your courses, complete assignments, and track progress."
          icon={<GraduationCap className="w-6 h-6" />}
          onClick={() => onSelect('student')}
        />
      </div>
    </motion.div>
  );
}

function RoleCard({ 
  title, 
  description, 
  icon, 
  onClick 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full flex items-center p-6 bg-white border border-border-default rounded-lg text-left transition-all duration-fast ease-entry hover:border-border-hover hover:shadow-md hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-tech-brain focus:ring-offset-2"
    >
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-navy group-hover:bg-tech-brain/10 group-hover:text-tech-brain transition-colors duration-fast">
        {icon}
      </div>
      <div className="ml-5 flex-1">
        <h4 className="text-lg font-semibold text-navy group-hover:text-tech-brain transition-colors duration-fast">
          {title}
        </h4>
        <p className="text-sm text-text-secondary mt-1">
          {description}
        </p>
      </div>
      <div className="ml-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-fast text-tech-brain">
        <ArrowRight className="w-5 h-5" />
      </div>
    </button>
  );
}

function TeacherDashboard({ onBack }: { onBack: () => void; key?: string }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-screen flex"
      dir="rtl"
    >
      {/* Sidebar (Right side due to RTL) */}
      <div className="w-64 h-full bg-background-alt border-l border-border-default flex flex-col">
        {/* Header Section */}
        <div className="p-4">
          <div className="bg-background-main rounded-md p-3 flex items-center gap-3 shadow-sm border border-border-default">
            <div className="w-10 h-10 rounded-full bg-tech-brain flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-navy font-bold text-sm">صَف Lana</div>
              <div className="text-text-secondary text-xs">الحساب</div>
            </div>
          </div>
        </div>

        {/* Navigation Menu Items */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <NavItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="لوحة التحكم" 
            isActive={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<MonitorPlay className="w-5 h-5" />} 
            label="تعليم مباشر" 
            isActive={activeTab === 'live'} 
            onClick={() => setActiveTab('live')} 
          />
          <NavItem 
            icon={<Gamepad2 className="w-5 h-5" />} 
            label="ألعاب تعليمية" 
            isActive={activeTab === 'games'} 
            onClick={() => setActiveTab('games')} 
          />
          <NavItem 
            icon={<FileText className="w-5 h-5" />} 
            label="اختبارات" 
            isActive={activeTab === 'tests'} 
            onClick={() => setActiveTab('tests')} 
          />
          <NavItem 
            icon={<BarChart3 className="w-5 h-5" />} 
            label="التقارير" 
            isActive={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
          />

          <div className="pt-4 pb-2">
            <div className="h-px w-full bg-border-default mb-2"></div>
            <NavItem 
              icon={<Settings className="w-5 h-5" />} 
              label="إدارة الصف" 
              isActive={activeTab === 'management'} 
              onClick={() => setActiveTab('management')} 
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border-default space-y-1">
          <NavItem 
            icon={<HelpCircle className="w-5 h-5" />} 
            label="مساعدة" 
            isActive={activeTab === 'help'} 
            onClick={() => setActiveTab('help')} 
          />
          <NavItem 
            icon={<User className="w-5 h-5" />} 
            label="حساب" 
            isActive={activeTab === 'account'} 
            onClick={() => setActiveTab('account')} 
          />
          
          <div className="mt-4 flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-full bg-border-default flex items-center justify-center text-navy font-bold text-xs">
              LT
            </div>
            <div className="flex-1 text-sm font-medium text-navy">Lana Talal</div>
            <button onClick={onBack} className="text-text-secondary hover:text-primary-pulse transition-colors" title="تسجيل الخروج">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white overflow-y-auto p-8">
        {activeTab === 'management' ? (
          <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-border-default rounded-xl p-8">
            <Settings className="w-12 h-12 text-border-hover mb-4" />
            <h2 className="text-2xl font-bold text-navy mb-2">إدارة الصف</h2>
            <p className="text-text-secondary">هذه الصفحة قيد التطوير (Placeholder)</p>
          </div>
        ) : activeTab === 'dashboard' ? (
          <div>
            <h2 className="text-3xl font-bold text-navy mb-6">لوحة التحكم</h2>
            <div className="bg-background-alt border border-border-default rounded-lg p-8 shadow-sm">
              <p className="text-text-secondary">محتوى لوحة التحكم هنا.</p>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-3xl font-bold text-navy mb-6">
              {activeTab === 'live' && 'تعليم مباشر'}
              {activeTab === 'games' && 'ألعاب تعليمية'}
              {activeTab === 'tests' && 'اختبارات'}
              {activeTab === 'reports' && 'التقارير'}
              {activeTab === 'help' && 'مساعدة'}
              {activeTab === 'account' && 'حساب'}
            </h2>
            <div className="bg-background-alt border border-border-default rounded-lg p-8 shadow-sm">
              <p className="text-text-secondary">محتوى الصفحة هنا.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function NavItem({ 
  icon, 
  label, 
  isActive, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-fast ease-entry relative focus:outline-none ${
        isActive 
          ? 'bg-focus-light text-navy ring-2 ring-tech-brain' 
          : 'text-text-secondary hover:bg-slate-100 hover:text-navy'
      }`}
    >
      {isActive && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-tech-brain rounded-l-full"></div>
      )}
      <div className={isActive ? 'text-tech-brain' : ''}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function StudentDashboard({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'name' | 'avatar' | 'grade' | 'transition' | 'track_selection' | 'map'>('name');
  const [studentName, setStudentName] = useState('');
  const [avatar, setAvatar] = useState({ gender: '', hair: 1, clothes: 1, color: '#08b8fb' });
  const [grade, setGrade] = useState('');
  const [track, setTrack] = useState('');

  return (
    <div className="w-full h-full flex items-center justify-center" dir="rtl">
      <AnimatePresence mode="wait">
        {step === 'name' && (
          <NameEntry 
            key="name" 
            name={studentName} 
            setName={setStudentName} 
            onNext={() => setStep('avatar')} 
            onBack={onBack}
          />
        )}
        {step === 'avatar' && (
          <CharacterBuilder 
            key="avatar" 
            avatar={avatar} 
            setAvatar={setAvatar} 
            onNext={() => setStep('grade')} 
            onBack={() => setStep('name')}
          />
        )}
        {step === 'grade' && (
          <GradeSelection 
            key="grade" 
            selectedGrade={grade} 
            setGrade={setGrade} 
            onNext={() => {
              setStep('transition');
              setTimeout(() => {
                if (grade === 'k') {
                  setStep('track_selection');
                } else {
                  setStep('map');
                }
              }, 1500);
            }} 
            onBack={() => setStep('avatar')}
          />
        )}
        {step === 'transition' && (
          <TransitionScreen key="transition" />
        )}
        {step === 'track_selection' && (
          <TrackSelection 
            key="track_selection"
            onSelect={(selectedTrack: string) => {
              setTrack(selectedTrack);
              setStep('map');
            }}
            onBack={() => setStep('grade')}
          />
        )}
        {step === 'map' && (
          <GameMap 
            key="map" 
            studentName={studentName} 
            avatar={avatar} 
            grade={grade} 
            track={track}
            onBack={() => grade === 'k' ? setStep('track_selection') : setStep('grade')} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TrackSelection({ onSelect, onBack }: any) {
  const playAudioPrompt = () => {
    // In a real app, this would play an actual audio file.
    console.log('Playing audio: ماذا تريد أن تتعلم اليوم؟');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-5xl bg-white p-10 rounded-2xl shadow-sm border border-border-default"
    >
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold text-navy mb-2">ماذا تريد أن تتعلم اليوم؟</h2>
          <p className="text-text-secondary">اختر مسارك للبدء</p>
        </div>
        <button onClick={onBack} className="text-text-secondary hover:text-navy transition-colors">
          ← رجوع
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Colors Track */}
        <motion.button
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={playAudioPrompt}
          onClick={() => { playAudioPrompt(); onSelect('colors'); }}
          className="group relative p-8 rounded-[1rem] border-2 border-border-default text-center transition-all duration-fast hover:bg-focus-light hover:border-tech-brain/50 bg-white flex flex-col items-center"
        >
          <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary-pulse/10 rounded-full group-hover:scale-110 transition-transform duration-normal"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12 text-primary-pulse relative z-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-tech-brain"></div>
            <div className="absolute bottom-4 left-2 w-3 h-3 rounded-full bg-primary-pulse"></div>
          </div>
          <h3 className="text-2xl font-bold text-navy group-hover:text-tech-brain transition-colors">عالم الألوان</h3>
        </motion.button>

        {/* Letters Track */}
        <motion.button
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={playAudioPrompt}
          onClick={() => { playAudioPrompt(); onSelect('letters'); }}
          className="group relative p-8 rounded-[1rem] border-2 border-border-default text-center transition-all duration-fast hover:bg-focus-light hover:border-tech-brain/50 bg-white flex flex-col items-center"
        >
          <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-tech-brain/10 rounded-full group-hover:scale-110 transition-transform duration-normal"></div>
            <div className="text-5xl font-bold text-tech-brain relative z-10 flex items-center">
              أ
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 ml-1 text-primary-pulse absolute -right-4 -top-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 10v4a2 2 0 002 2h2.586l3.707 3.707A1 1 0 0015 19V5a1 1 0 00-1.707-.707L9.586 8H7a2 2 0 00-2 2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-navy group-hover:text-tech-brain transition-colors">أصوات الحروف</h3>
        </motion.button>

        {/* Numbers Track */}
        <motion.button
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={playAudioPrompt}
          onClick={() => { playAudioPrompt(); onSelect('numbers'); }}
          className="group relative p-8 rounded-[1rem] border-2 border-border-default text-center transition-all duration-fast hover:bg-focus-light hover:border-tech-brain/50 bg-white flex flex-col items-center"
        >
          <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-status-success/10 rounded-full group-hover:scale-110 transition-transform duration-normal"></div>
            <div className="flex gap-1 relative z-10">
              <span className="text-3xl font-bold text-primary-pulse -mt-2">1</span>
              <span className="text-4xl font-bold text-tech-brain">2</span>
              <span className="text-3xl font-bold text-status-success mt-2">3</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-navy group-hover:text-tech-brain transition-colors">مغامرة الأرقام</h3>
        </motion.button>
      </div>
    </motion.div>
  );
}

function NameEntry({ name, setName, onNext, onBack }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md bg-white p-10 rounded-2xl shadow-sm border border-border-default text-center relative"
    >
      <button onClick={onBack} className="absolute top-6 right-6 text-text-secondary hover:text-navy transition-colors">
        ← رجوع
      </button>
      <div className="w-20 h-20 bg-tech-brain/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <User className="w-10 h-10 text-tech-brain" />
      </div>
      <h2 className="text-3xl font-bold text-navy mb-2">أهلاً بك يا بطل!</h2>
      <p className="text-text-secondary mb-8">ما هو اسمك؟</p>
      
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="اكتب اسمك هنا..."
        className="w-full text-center text-2xl font-bold text-navy bg-background-alt border-2 border-border-default rounded-xl py-4 px-6 mb-8 focus:outline-none focus:border-tech-brain focus:ring-4 focus:ring-tech-brain/20 transition-all duration-fast placeholder:text-text-secondary/50"
        autoFocus
      />
      
      <button
        onClick={onNext}
        disabled={!name.trim()}
        className="w-full bg-primary-pulse text-white font-bold text-xl py-4 rounded-xl shadow-[0_0_20px_rgba(237,59,145,0.4)] hover:shadow-[0_0_25px_rgba(237,59,145,0.6)] hover:-translate-y-1 transition-all duration-fast disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        ابدأ الرحلة
      </button>
    </motion.div>
  );
}

function CharacterBuilder({ avatar, setAvatar, onNext, onBack }: any) {
  const colors = ['#ed3b91', '#08b8fb', '#22c55e', '#f59e0b', '#8b5cf6'];
  
  const femaleHair = [
    { id: 1, color: '#4a3018', type: 'short' },
    { id: 2, color: '#fcd34d', type: 'short' },
    { id: 3, color: '#4a3018', type: 'long' },
    { id: 4, color: '#fcd34d', type: 'long' },
  ];
  
  const maleHair = [
    { id: 1, color: '#4a3018', type: 'spiky' },
    { id: 2, color: '#fcd34d', type: 'spiky' },
  ];

  const femaleClothes = [
    { id: 1, type: 'dress', color: '#f472b6' },
    { id: 2, type: 'shirt-pants', color: '#60a5fa' },
    { id: 3, type: 'jumpsuit', color: '#a78bfa' },
    { id: 4, type: 'active', color: '#34d399' },
  ];

  const maleClothes = [
    { id: 1, type: 'shirt-jeans', color: '#f87171' },
    { id: 2, type: 'hoodie-shorts', color: '#9ca3af' },
    { id: 3, type: 'active', color: '#60a5fa' },
  ];

  const currentHair = avatar.gender === 'female' ? femaleHair : maleHair;
  const currentClothes = avatar.gender === 'female' ? femaleClothes : maleClothes;

  const renderHairIcon = (hair: any) => {
    return (
      <div className="w-10 h-10 relative flex items-center justify-center">
        {hair.type === 'short' && <div className="w-8 h-8 rounded-t-full rounded-b-md" style={{ backgroundColor: hair.color }}></div>}
        {hair.type === 'long' && <div className="w-8 h-10 rounded-t-full rounded-b-xl" style={{ backgroundColor: hair.color }}></div>}
        {hair.type === 'spiky' && (
           <svg viewBox="0 0 24 24" fill={hair.color} className="w-8 h-8">
             <path d="M12 2L9 8L3 7L7 12L4 18L10 15L15 19L14 13L20 10L14 8Z" />
           </svg>
        )}
      </div>
    );
  };

  const renderClothesIcon = (clothes: any) => {
    return (
      <div className="w-10 h-10 relative flex items-center justify-center">
        {clothes.type === 'dress' && <div className="w-8 h-10 rounded-t-md rounded-b-xl" style={{ backgroundColor: clothes.color }}></div>}
        {clothes.type === 'shirt-pants' && (
          <div className="flex flex-col gap-1 items-center">
            <div className="w-8 h-5 rounded-md" style={{ backgroundColor: clothes.color }}></div>
            <div className="w-6 h-5 rounded-sm bg-slate-700"></div>
          </div>
        )}
        {clothes.type === 'jumpsuit' && <div className="w-7 h-10 rounded-md" style={{ backgroundColor: clothes.color }}></div>}
        {clothes.type === 'active' && (
          <div className="flex flex-col gap-1 items-center">
            <div className="w-7 h-5 rounded-md" style={{ backgroundColor: clothes.color }}></div>
            <div className="w-7 h-4 rounded-sm bg-slate-800"></div>
          </div>
        )}
        {clothes.type === 'shirt-jeans' && (
          <div className="flex flex-col gap-1 items-center">
            <div className="w-8 h-5 rounded-md" style={{ backgroundColor: clothes.color }}></div>
            <div className="w-6 h-6 rounded-sm bg-blue-800"></div>
          </div>
        )}
        {clothes.type === 'hoodie-shorts' && (
          <div className="flex flex-col gap-1 items-center">
            <div className="w-9 h-6 rounded-t-xl rounded-b-md" style={{ backgroundColor: clothes.color }}></div>
            <div className="w-7 h-4 rounded-sm bg-slate-600"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-4xl bg-white p-8 rounded-2xl shadow-sm border border-border-default"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-navy">اختر شخصيتك!</h2>
        <button onClick={onBack} className="text-navy font-medium hover:text-primary-pulse transition-colors">
          رجوع
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Right Side (in RTL): Preview Area */}
        <div className="flex flex-col items-center justify-center bg-background-main rounded-2xl p-8 border border-border-default relative overflow-hidden h-[400px]">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #08b8fb 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
          
          <div className="absolute top-4 right-4 bg-navy px-3 py-1 rounded-full shadow-sm text-xs font-bold text-white z-20">
            شخصيتك
          </div>

          {avatar.gender ? (
            <motion.div 
              key={`${avatar.gender}-${avatar.hair}-${avatar.clothes}-${avatar.color}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, type: 'spring', bounce: 0.5 }}
              className="relative z-10 flex flex-col items-center"
            >
              {/* Avatar Preview Assembly */}
              <div className="relative flex flex-col items-center scale-150 mt-12">
                {/* Hair */}
                <div className="absolute -top-6 z-20">
                  {renderHairIcon(currentHair.find(h => h.id === avatar.hair) || currentHair[0])}
                </div>
                {/* Head */}
                <div className="w-16 h-16 bg-amber-100 rounded-full border-4 z-10 flex flex-col items-center justify-center relative" style={{ borderColor: avatar.color }}>
                  {/* Face */}
                  <div className="flex gap-2 mb-1 mt-2">
                    <div className="w-1.5 h-1.5 bg-navy rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-navy rounded-full"></div>
                  </div>
                  <div className="w-3 h-1 bg-navy rounded-full mt-1"></div>
                </div>
                {/* Body */}
                <div className="mt-1 z-0">
                  {renderClothesIcon(currentClothes.find(c => c.id === avatar.clothes) || currentClothes[0])}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="relative z-10 w-32 h-32 rounded-full border-4 border-dashed border-border-hover flex items-center justify-center text-text-secondary">
              <User className="w-12 h-12 opacity-50" />
            </div>
          )}
        </div>

        {/* Left Side (in RTL): Controls */}
        <div className="space-y-8">
          {/* Gender Selection */}
          <div>
            <div className="flex gap-4">
              <button
                onClick={() => setAvatar({ ...avatar, gender: 'female', hair: 1, clothes: 1 })}
                className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-fast ${avatar.gender === 'female' ? 'border-tech-brain bg-tech-brain/5 ring-2 ring-tech-brain ring-offset-2' : 'border-border-default hover:border-border-hover bg-white'}`}
              >
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-pink-500" />
                </div>
              </button>
              <button
                onClick={() => setAvatar({ ...avatar, gender: 'male', hair: 1, clothes: 1 })}
                className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-fast ${avatar.gender === 'male' ? 'border-tech-brain bg-tech-brain/5 ring-2 ring-tech-brain ring-offset-2' : 'border-border-default hover:border-border-hover bg-white'}`}
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-500" />
                </div>
              </button>
            </div>
          </div>

          {/* Detailed Customization (Only if gender is selected) */}
          {avatar.gender && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Color */}
              <div className="flex gap-3">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setAvatar({ ...avatar, color })}
                    className={`w-10 h-10 rounded-full transition-all duration-fast ${avatar.color === color ? 'ring-2 ring-offset-2 ring-tech-brain scale-110 shadow-[0_0_15px_rgba(237,59,145,0.15)]' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              
              {/* Hair */}
              <div className="flex gap-3">
                {currentHair.map(hair => (
                  <button
                    key={hair.id}
                    onClick={() => setAvatar({ ...avatar, hair: hair.id })}
                    className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all duration-fast bg-white ${avatar.hair === hair.id ? 'border-tech-brain' : 'border-border-default hover:border-border-hover'}`}
                  >
                    {renderHairIcon(hair)}
                  </button>
                ))}
              </div>

              {/* Clothes */}
              <div className="flex gap-3">
                {currentClothes.map(clothes => (
                  <button
                    key={clothes.id}
                    onClick={() => setAvatar({ ...avatar, clothes: clothes.id })}
                    className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all duration-fast bg-white ${avatar.clothes === clothes.id ? 'border-tech-brain' : 'border-border-default hover:border-border-hover'}`}
                  >
                    {renderClothesIcon(clothes)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <button
            onClick={onNext}
            disabled={!avatar.gender}
            className="w-full bg-primary-pulse text-white font-bold text-lg py-4 rounded-[1rem] shadow-[0_0_15px_rgba(237,59,145,0.4)] hover:shadow-[0_0_20px_rgba(237,59,145,0.6)] hover:-translate-y-1 transition-all duration-fast mt-4 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            التالي
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function GradeSelection({ selectedGrade, setGrade, onNext, onBack }: any) {
  const grades = [
    { id: 'k', name: 'الروضة', icon: '🎨' },
    { id: '1', name: 'الصف الأول', icon: '🌟' },
    { id: '2', name: 'الصف الثاني', icon: '🚀' },
    { id: '3', name: 'الصف الثالث', icon: '🔭' },
    { id: '4', name: 'الصف الرابع', icon: '🔬' },
    { id: '5', name: 'الصف الخامس', icon: '🏆' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-5xl bg-white p-10 rounded-2xl shadow-sm border border-border-default"
    >
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold text-navy mb-2">اختر مسارك</h2>
          <p className="text-text-secondary">في أي صف أنت؟</p>
        </div>
        <button onClick={onBack} className="text-text-secondary hover:text-navy transition-colors">
          ← رجوع
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
        {grades.map((g) => (
          <motion.button
            key={g.id}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGrade(g.id)}
            className={`relative p-6 rounded-2xl border-2 text-center transition-colors duration-fast ${
              selectedGrade === g.id 
                ? 'border-tech-brain bg-focus-light' 
                : 'border-border-default hover:bg-focus-light hover:border-tech-brain/50'
            }`}
          >
            {selectedGrade === g.id && (
              <span className="absolute -top-3 -right-3 flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-pulse opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-primary-pulse border-2 border-white"></span>
              </span>
            )}
            <div className="text-4xl mb-4">{g.icon}</div>
            <h3 className={`text-xl font-bold ${selectedGrade === g.id ? 'text-navy' : 'text-text-secondary'}`}>
              {g.name}
            </h3>
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          disabled={!selectedGrade}
          className="bg-primary-pulse text-white font-bold text-xl py-4 px-16 rounded-xl shadow-[0_0_20px_rgba(237,59,145,0.4)] hover:shadow-[0_0_25px_rgba(237,59,145,0.6)] hover:-translate-y-1 transition-all duration-fast disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          انطلق!
        </button>
      </div>
    </motion.div>
  );
}

function TransitionScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
        className="flex flex-col items-center"
      >
        <div className="w-32 h-32 rounded-full bg-status-success/20 flex items-center justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-status-success flex items-center justify-center text-white shadow-[0_0_30px_rgba(34,197,94,0.5)]">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-navy">جاري تجهيز عالمك...</h2>
      </motion.div>
    </motion.div>
  );
}

function ColorsMap({ studentName, avatar, renderAvatar, onBack }: any) {
  const stations = [
    { id: 0, label: 'أحمر', color: '#ef4444', x: 10, y: 50 },
    { id: 1, label: 'أزرق', color: '#3b82f6', x: 20, y: 30 },
    { id: 2, label: 'أخضر', color: '#22c55e', x: 30, y: 50 },
    { id: 3, label: 'أصفر', color: '#eab308', x: 40, y: 30 },
    { id: 4, label: 'بنفسجي', color: '#a855f7', x: 50, y: 50 },
    { id: 5, label: 'برتقالي', color: '#f97316', x: 60, y: 30 },
    { id: 6, label: 'وردي', color: '#ed3b91', x: 70, y: 50 },
    { id: 7, label: 'بني', color: '#8B4513', x: 80, y: 30 },
    { id: 8, label: 'أسود', color: '#1e293b', x: 90, y: 50 },
    { id: 9, label: 'أبيض', color: '#ffffff', x: 80, y: 70 },
  ];

  const [currentStation, setCurrentStation] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const [correctFirstTry, setCorrectFirstTry] = useState(0);
  const [mistakes, setMistakes] = useState<Record<string, number>>({});

  const handleStationClick = (index: number) => {
    if (index === currentStation) {
      setQuizActive(true);
    }
  };

  const handleQuizComplete = (mistakesInQuiz: number) => {
    setQuizActive(false);
    if (mistakesInQuiz === 0) {
      setCorrectFirstTry(prev => prev + 1);
    } else {
      setMistakes(prev => ({
        ...prev,
        [stations[currentStation].label]: (prev[stations[currentStation].label] || 0) + mistakesInQuiz
      }));
    }

    if (currentStation < stations.length - 1) {
      setCurrentStation(prev => prev + 1);
    } else {
      setTimeout(() => setShowResults(true), 1000);
    }
  };

  const handlePlayAgain = () => {
    setCurrentStation(0);
    setCorrectFirstTry(0);
    setMistakes({});
    setShowResults(false);
  };

  if (showResults) {
    return (
      <ResultsScreen 
        correctFirstTry={correctFirstTry} 
        total={stations.length} 
        mistakes={mistakes} 
        onPlayAgain={handlePlayAgain}
        onBack={onBack}
        renderAvatar={renderAvatar}
        stations={stations}
        isMuted={isMuted}
      />
    );
  }

  return (
    <motion.div
      initial={{ scale: 1.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`w-full h-screen relative overflow-hidden flex flex-col transition-all duration-1000 bg-slate-50`}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-40">
        <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-sm border border-border-default">
          <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-white overflow-hidden" style={{ borderColor: avatar.color }}>
            <div className="scale-[0.4] -mt-4">
              {renderAvatar()}
            </div>
          </div>
          <div>
            <div className="font-bold text-navy">{studentName}</div>
            <div className="text-xs text-text-secondary font-medium">خريطة الألوان</div>
          </div>
          {/* Badges */}
          <div className="ml-4 flex gap-1 border-l border-border-default pl-4">
            {Array.from({ length: currentStation }).map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-primary-pulse flex items-center justify-center text-white text-xs shadow-sm">★</div>
            ))}
          </div>
        </div>
        <button onClick={onBack} className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-border-default text-navy font-medium hover:bg-white transition-colors">
          خروج
        </button>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative w-full max-w-5xl mx-auto">
        {/* Path Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {stations.map((station, i) => {
            if (i === stations.length - 1) return null;
            const next = stations[i + 1];
            const isCompleted = currentStation > i;
            return (
              <line
                key={`line-${i}`}
                x1={`${station.x}%`}
                y1={`${station.y}%`}
                x2={`${next.x}%`}
                y2={`${next.y}%`}
                stroke={isCompleted ? '#08b8fb' : '#cbd5e1'}
                strokeWidth="8"
                strokeDasharray="12 12"
                className="transition-colors duration-1000"
              />
            );
          })}
        </svg>

        {/* Stations */}
        {stations.map((station, i) => {
          const isCompleted = currentStation > i;
          const isActive = currentStation === i;
          
          return (
            <div
              key={station.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${station.x}%`, top: `${station.y}%` }}
            >
              <button
                onClick={() => handleStationClick(i)}
                disabled={!isActive && !isCompleted}
                className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted ? 'border-4 border-white shadow-lg' :
                  isActive ? 'bg-slate-100 border-4 border-tech-brain shadow-[0_0_20px_rgba(8,184,251,0.6)] animate-pulse' :
                  'bg-slate-200 border-4 border-white opacity-70'
                }`}
                style={{ backgroundColor: isCompleted ? station.color : undefined }}
              >
              </button>

              {/* Avatar positioned on active/completed station */}
              {isActive && !quizActive && (
                <motion.div
                  layoutId="avatar-map"
                  className="absolute -top-20 md:-top-24 left-1/2 transform -translate-x-1/2 z-30 drop-shadow-xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  {renderAvatar(0.7)}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quiz Overlay */}
      <AnimatePresence>
        {quizActive && (
          <ColorQuiz 
            targetStation={stations[currentStation]} 
            onComplete={handleQuizComplete} 
            isMuted={isMuted}
            setIsMuted={setIsMuted}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ColorQuiz({ targetStation, onComplete, isMuted, setIsMuted }: any) {
  const allColors = [
    { label: 'أحمر', color: '#ef4444' },
    { label: 'أزرق', color: '#3b82f6' },
    { label: 'أخضر', color: '#22c55e' },
    { label: 'أصفر', color: '#eab308' },
    { label: 'بنفسجي', color: '#a855f7' },
    { label: 'برتقالي', color: '#f97316' },
    { label: 'وردي', color: '#ed3b91' },
    { label: 'بني', color: '#8B4513' },
    { label: 'أسود', color: '#1e293b' },
    { label: 'أبيض', color: '#ffffff' },
  ];

  const [options, setOptions] = useState<any[]>([]);
  const [wrongSelections, setWrongSelections] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mistakesCount, setMistakesCount] = useState(0);

  const playPrompt = async () => {
    if (isMuted) return;
    await generateAndPlayAudio(`أين هو اللون ${targetStation.label}؟`);
  };

  useEffect(() => {
    // Generate options
    const others = allColors.filter(c => c.label !== targetStation.label);
    const shuffledOthers = [...others].sort(() => 0.5 - Math.random()).slice(0, 3);
    const finalOptions = [targetStation, ...shuffledOthers].sort(() => 0.5 - Math.random());
    setOptions(finalOptions);
    
    // Play audio
    playPrompt();
  }, [targetStation]);

  const handleSpeakerClick = () => {
    if (isMuted) {
      setIsMuted(false);
      generateAndPlayAudio(`أين هو اللون ${targetStation.label}؟`);
    } else {
      setIsMuted(true);
    }
  };

  const handleSelect = (option: any) => {
    if (isSuccess) return;

    if (option.label === targetStation.label) {
      setIsSuccess(true);
      if (!isMuted) {
        generateAndPlayAudio("صحيح!");
      }
      setTimeout(() => {
        onComplete(mistakesCount);
      }, 1500);
    } else {
      if (!wrongSelections.includes(option.label)) {
        if (!isMuted) {
          generateAndPlayAudio("حاول مرة أخرى");
        }
        setWrongSelections(prev => [...prev, option.label]);
        setMistakesCount(prev => prev + 1);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm"
    >
      <div className="w-full h-full flex flex-col items-center">
        <div className="mt-8 mb-auto">
          <button
            onClick={handleSpeakerClick}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-sm border transition-colors ${
              isMuted 
                ? 'bg-slate-100 text-text-secondary border-border-default' 
                : 'bg-tech-brain/10 text-tech-brain border-tech-brain/20'
            }`}
          >
            {isMuted ? (
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 10v4a2 2 0 002 2h2.586l3.707 3.707A1 1 0 0015 19V5a1 1 0 00-1.707-.707L9.586 8H7a2 2 0 00-2 2z" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-6 w-full max-w-lg mb-auto">
          {options.map((opt, i) => {
            const isWrong = wrongSelections.includes(opt.label);
            const isCorrect = isSuccess && opt.label === targetStation.label;
            
            return (
              <motion.button
                key={i}
                animate={isWrong ? { x: [-5, 5, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
                whileHover={!isWrong && !isSuccess ? { scale: 1.05 } : {}}
                whileTap={!isWrong && !isSuccess ? { scale: 0.95 } : {}}
                onClick={() => handleSelect(opt)}
                className={`w-full aspect-square rounded-[0.75rem] border border-border-default shadow-sm transition-all duration-300 relative overflow-hidden ${
                  isCorrect ? 'border-status-success border-4 scale-105 shadow-[0_0_30px_rgba(34,197,94,0.4)]' :
                  'hover:shadow-md'
                }`}
                style={{ backgroundColor: opt.color }}
              >
                {isCorrect && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-white/20"
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-10 h-10 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function ResultsScreen({ correctFirstTry, total, mistakes, onPlayAgain, onBack, renderAvatar, stations, isMuted }: any) {
  useEffect(() => {
    if (!isMuted) {
      generateAndPlayAudio("أحسنت يا بطل! لقد جمعت كل الألوان!");
    }
  }, [isMuted]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-screen flex items-center justify-center bg-background-alt p-6"
      dir="rtl"
    >
      <div className="w-full max-w-4xl bg-white rounded-[1rem] shadow-sm border border-border-default p-10 text-center flex flex-col items-center">
        
        {/* Color Rainbow & Avatar */}
        <div className="relative w-full flex justify-center items-end h-64 mb-12">
          <div className="absolute inset-0 flex justify-center items-end overflow-hidden">
            {/* Rainbow Arcs */}
            {stations.map((station: any, i: number) => {
              const radius = 300 - (i * 20);
              return (
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.8, scale: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1, type: "spring" }}
                  className="absolute bottom-0 rounded-t-full border-t-8 border-l-8 border-r-8"
                  style={{
                    width: `${radius}px`,
                    height: `${radius / 2}px`,
                    borderColor: station.color,
                    transformOrigin: "bottom center",
                  }}
                />
              );
            })}
          </div>
          <div className="relative z-10 mb-4">
            {renderAvatar(1.5)}
          </div>
        </div>

        <div className="flex gap-4 justify-center mt-8">
          <button
            onClick={onBack}
            className="bg-primary-pulse text-white font-bold text-lg py-4 px-10 rounded-[0.75rem] shadow-[0_0_15px_rgba(237,59,145,0.4)] hover:shadow-[0_0_20px_rgba(237,59,145,0.6)] hover:-translate-y-1 transition-all duration-fast"
          >
            العودة للمسارات
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Grade1Map({ studentName, avatar, renderAvatar, onBack }: any) {
  const [track, setTrack] = useState<string | null>(null);

  if (!track) {
    return <Grade1Portals renderAvatar={renderAvatar} onSelect={setTrack} onBack={onBack} />;
  }

  return <Grade1Journey track={track} renderAvatar={renderAvatar} onBack={() => setTrack(null)} />;
}

function Grade1Portals({ renderAvatar, onSelect, onBack }: any) {
  const [isMuted, setIsMuted] = useState(false);
  const [hoveredPortal, setHoveredPortal] = useState<string | null>(null);

  useEffect(() => {
    if (!isMuted) {
      generateAndPlayAudio("ماذا تريد أن تتعلم اليوم؟ الأرقام أم الحروف؟");
    }
  }, [isMuted]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="w-full h-screen bg-background-alt flex flex-col items-center justify-center relative overflow-hidden"
      dir="rtl"
    >
      {/* Safe Zone Header */}
      <div className="absolute top-0 left-0 right-0 pt-8 flex justify-center z-50">
        <button
          onClick={() => {
            setIsMuted(!isMuted);
            if (isMuted) generateAndPlayAudio("ماذا تريد أن تتعلم اليوم؟ الأرقام أم الحروف؟");
          }}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm border transition-colors ${
            isMuted 
              ? 'bg-slate-100 text-text-secondary border-border-default' 
              : 'bg-tech-brain/10 text-tech-brain border-tech-brain/20'
          }`}
        >
          {isMuted ? (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 10v4a2 2 0 002 2h2.586l3.707 3.707A1 1 0 0015 19V5a1 1 0 00-1.707-.707L9.586 8H7a2 2 0 00-2 2z" />
            </svg>
          )}
        </button>
      </div>
      
      <button onClick={onBack} className="absolute top-8 right-8 bg-white px-6 py-2 rounded-full shadow-sm text-navy font-bold border border-border-default hover:bg-slate-50 z-50">
        خروج
      </button>

      {/* Portals */}
      <div className="flex gap-12 z-10 mb-20">
        <motion.button 
          onHoverStart={() => setHoveredPortal('numbers')}
          onHoverEnd={() => setHoveredPortal(null)}
          onClick={() => onSelect('numbers')} 
          className="w-72 h-96 bg-white rounded-[1rem] shadow-md border-2 border-border-default flex flex-col items-center justify-center hover:border-tech-brain hover:shadow-[0_0_30px_rgba(8,184,251,0.3)] transition-all relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-tech-brain/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-8xl mb-6 drop-shadow-sm group-hover:scale-110 transition-transform">🔢</div>
          <h3 className="text-3xl font-bold text-navy">مغامرة الأرقام</h3>
        </motion.button>

        <motion.button 
          onHoverStart={() => setHoveredPortal('letters')}
          onHoverEnd={() => setHoveredPortal(null)}
          onClick={() => onSelect('letters')} 
          className="w-72 h-96 bg-white rounded-[1rem] shadow-md border-2 border-border-default flex flex-col items-center justify-center hover:border-primary-pulse hover:shadow-[0_0_30px_rgba(237,59,145,0.3)] transition-all relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-pulse/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-8xl mb-6 drop-shadow-sm group-hover:scale-110 transition-transform">أ ب</div>
          <h3 className="text-3xl font-bold text-navy">غابة الحروف</h3>
        </motion.button>
      </div>

      {/* Avatar pointing */}
      <motion.div 
        className="absolute bottom-0 z-20 transition-transform duration-500"
        animate={{ 
          x: hoveredPortal === 'numbers' ? 150 : hoveredPortal === 'letters' ? -150 : 0,
          rotateY: hoveredPortal === 'letters' ? 180 : 0
        }}
      >
        {renderAvatar(1.8)}
      </motion.div>
    </motion.div>
  );
}

function Grade1Journey({ track, renderAvatar, onBack }: any) {
  const nodes = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    symbol: track === 'numbers' ? `${i + 1}` : ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر'][i],
    x: 10 + (i * 8),
    y: 50 + Math.sin(i * 1.5) * 25
  }));

  const [currentNode, setCurrentNode] = useState(0);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  const handleNodeClick = (index: number) => {
    if (index === currentNode) {
      setActiveTask(nodes[index]);
    }
  };

  const handleTaskComplete = () => {
    setActiveTask(null);
    if (currentNode < nodes.length - 1) {
      setCurrentNode(prev => prev + 1);
    }
  };

  return (
    <div className="w-full h-screen bg-slate-50 relative overflow-hidden flex flex-col" dir="rtl">
      {/* Safe Zone Header */}
      <div className="absolute top-0 left-0 right-0 pt-8 flex justify-between items-center px-8 z-40">
        <button onClick={onBack} className="bg-white px-6 py-2 rounded-full shadow-sm text-navy font-bold border border-border-default hover:bg-slate-50">
          العودة
        </button>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm border transition-colors ${
            isMuted 
              ? 'bg-slate-100 text-text-secondary border-border-default' 
              : 'bg-tech-brain/10 text-tech-brain border-tech-brain/20'
          }`}
        >
          {isMuted ? (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 10v4a2 2 0 002 2h2.586l3.707 3.707A1 1 0 0015 19V5a1 1 0 00-1.707-.707L9.586 8H7a2 2 0 00-2 2z" />
            </svg>
          )}
        </button>
        <div className="w-24"></div> {/* Spacer */}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative w-full max-w-6xl mx-auto mt-20">
        {/* Path Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {nodes.map((node, i) => {
            if (i === nodes.length - 1) return null;
            const next = nodes[i + 1];
            const isCompleted = currentNode > i;
            return (
              <line
                key={`line-${i}`}
                x1={`${100 - node.x}%`} // RTL adjustment
                y1={`${node.y}%`}
                x2={`${100 - next.x}%`}
                y2={`${next.y}%`}
                stroke={isCompleted ? '#08b8fb' : '#cbd5e1'}
                strokeWidth="10"
                strokeDasharray="15 15"
                strokeLinecap="round"
                className="transition-colors duration-1000"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node, i) => {
          const isCompleted = currentNode > i;
          const isActive = currentNode === i;
          const isLocked = currentNode < i;
          
          return (
            <div
              key={node.id}
              className="absolute transform translate-x-1/2 -translate-y-1/2 z-10"
              style={{ right: `${node.x}%`, top: `${node.y}%` }} // RTL adjustment
            >
              <button
                onClick={() => handleNodeClick(i)}
                disabled={isLocked}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted ? 'bg-tech-brain text-white shadow-lg border-4 border-white' :
                  isActive ? 'bg-white border-4 border-tech-brain shadow-[0_0_20px_rgba(8,184,251,0.6)] animate-pulse text-tech-brain' :
                  'bg-slate-200 border-4 border-white text-slate-400 opacity-80'
                }`}
              >
                {isLocked ? (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  <span className="text-3xl font-bold">{node.symbol}</span>
                )}
              </button>

              {/* Avatar */}
              {isActive && !activeTask && (
                <motion.div
                  layoutId="avatar-journey"
                  className="absolute -top-28 left-1/2 transform -translate-x-1/2 z-30 drop-shadow-xl"
                  animate={{ y: [0, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  {renderAvatar(0.8)}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tracing Overlay */}
      <AnimatePresence>
        {activeTask && (
          <TracingEngine 
            symbol={activeTask.symbol} 
            onComplete={handleTaskComplete} 
            isMuted={isMuted}
            setIsMuted={setIsMuted}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TracingEngine({ symbol, onComplete, isMuted, setIsMuted }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [drawnPoints, setDrawnPoints] = useState<{x: number, y: number}[]>([]);
  const [showReward, setShowReward] = useState(false);
  const [isError, setIsError] = useState(false);
  
  // Refs for strict tracing logic
  const boundsImageDataRef = useRef<ImageData | null>(null);
  const targetImageDataRef = useRef<ImageData | null>(null);
  const targetPixelsCountRef = useRef<number>(0);

  useEffect(() => {
    if (!isMuted) {
      generateAndPlayAudio(`تتبع النقاط لكتابة ${symbol}`);
    }
  }, [symbol, isMuted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && !showReward) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (context) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        
        // Setup offscreen canvases for boundary and target checking
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
        
        if (offCtx) {
          offCtx.lineCap = 'round';
          offCtx.lineJoin = 'round';
          offCtx.font = 'bold 400px Inter'; // Increased size (60% of height approx)
          offCtx.textAlign = 'center';
          offCtx.textBaseline = 'middle';
          
          // 1. Draw target area (for 100% completion check)
          offCtx.lineWidth = 16; // 12pt approx
          offCtx.strokeText(symbol, canvas.width / 2, canvas.height / 2);
          const targetData = offCtx.getImageData(0, 0, canvas.width, canvas.height);
          targetImageDataRef.current = targetData;
          
          let targetCount = 0;
          for (let i = 3; i < targetData.data.length; i += 4) {
            if (targetData.data[i] > 0) targetCount++;
          }
          targetPixelsCountRef.current = targetCount;
          
          // 2. Draw bounds area (for out-of-bounds check, 5px leeway = 16 + 10 = 26, let's use 40 for safety)
          offCtx.clearRect(0, 0, canvas.width, canvas.height);
          offCtx.lineWidth = 40;
          offCtx.strokeText(symbol, canvas.width / 2, canvas.height / 2);
          boundsImageDataRef.current = offCtx.getImageData(0, 0, canvas.width, canvas.height);
        }

        // Draw visible dotted guide
        context.font = 'bold 400px Inter';
        context.fillStyle = '#e2e8f0'; 
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.setLineDash([20, 20]);
        context.lineWidth = 16; // 12pt
        context.strokeStyle = isError ? '#ef4444' : '#cbd5e1'; // Red flicker on error
        context.strokeText(symbol, canvas.width / 2, canvas.height / 2);
        
        // Reset for drawing
        context.setLineDash([]);
        context.lineWidth = 16;
        context.strokeStyle = '#ed3b91';
        context.shadowColor = 'rgba(237, 59, 145, 0.5)';
        context.shadowBlur = 15;
        setCtx(context);
        
        // Redraw existing points if any
        if (drawnPoints.length > 0) {
          context.beginPath();
          context.moveTo(drawnPoints[0].x, drawnPoints[0].y);
          for (let i = 1; i < drawnPoints.length; i++) {
            context.lineTo(drawnPoints[i].x, drawnPoints[i].y);
          }
          context.stroke();
        }
      }
    }
  }, [symbol, showReward, isError, drawnPoints]);

  const resetStroke = () => {
    setIsDrawing(false);
    setDrawnPoints([]);
    setIsError(true);
    if (!isMuted) generateAndPlayAudio("عفواً، حاول مرة أخرى");
    setTimeout(() => setIsError(false), 500);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    if (ctx) ctx.beginPath();
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx || !canvasRef.current || !boundsImageDataRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Boundary check
    const boundsData = boundsImageDataRef.current;
    const pixelIndex = (Math.floor(y) * boundsData.width + Math.floor(x)) * 4 + 3;
    
    if (boundsData.data[pixelIndex] === 0) {
      // Out of bounds!
      resetStroke();
      return;
    }

    setDrawnPoints(prev => [...prev, {x, y}]);

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (ctx) ctx.beginPath();
    
    // Check completion (100% coverage)
    if (drawnPoints.length > 0 && canvasRef.current && targetImageDataRef.current) {
      const canvas = canvasRef.current;
      const userOffscreen = document.createElement('canvas');
      userOffscreen.width = canvas.width;
      userOffscreen.height = canvas.height;
      const userCtx = userOffscreen.getContext('2d');
      
      if (userCtx) {
        userCtx.lineCap = 'round';
        userCtx.lineJoin = 'round';
        userCtx.lineWidth = 16;
        userCtx.beginPath();
        userCtx.moveTo(drawnPoints[0].x, drawnPoints[0].y);
        for (let i = 1; i < drawnPoints.length; i++) {
          userCtx.lineTo(drawnPoints[i].x, drawnPoints[i].y);
        }
        userCtx.stroke();
        
        const userData = userCtx.getImageData(0, 0, canvas.width, canvas.height);
        const targetData = targetImageDataRef.current;
        
        let coveredPixels = 0;
        for (let i = 3; i < targetData.data.length; i += 4) {
          if (targetData.data[i] > 0 && userData.data[i] > 0) {
            coveredPixels++;
          }
        }
        
        const coverage = targetPixelsCountRef.current > 0 ? coveredPixels / targetPixelsCountRef.current : 1;
        if (coverage > 0.85) { // 85% is practically 100% for human drawing
          handleSuccess();
        } else {
          // Not fully covered, reset
          resetStroke();
        }
      }
    }
  };

  const handleSuccess = () => {
    if (!isMuted) {
      generateAndPlayAudio("عمل رائع!");
    }
    setShowReward(true);
  };

  // Transformation mapping
  const transformations: Record<string, string> = {
    '1': '🦒', '2': '🦢', '3': '🦋', '4': '⛵', '5': '🍎',
    'أ': '🐇', 'ب': '🦆', 'ت': '🐊', 'ث': '🦊', 'ج': '🐪'
  };
  const transformedSymbol = transformations[symbol] || '🌟';

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-background-alt/95 backdrop-blur-sm flex flex-col items-center justify-center"
      dir="rtl"
    >
      {/* Safe Zone Header */}
      <div className="absolute top-0 left-0 right-0 pt-12 flex justify-center z-50">
        <button
          onClick={() => {
            setIsMuted(!isMuted);
            if (isMuted) generateAndPlayAudio(`تتبع النقاط لكتابة ${symbol}`);
          }}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-sm border transition-colors ${
            isMuted 
              ? 'bg-slate-100 text-text-secondary border-border-default' 
              : 'bg-tech-brain/10 text-tech-brain border-tech-brain/20'
          }`}
        >
          {isMuted ? (
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 10v4a2 2 0 002 2h2.586l3.707 3.707A1 1 0 0015 19V5a1 1 0 00-1.707-.707L9.586 8H7a2 2 0 00-2 2z" />
            </svg>
          )}
        </button>
      </div>

      {!showReward ? (
        <motion.div 
          animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="w-full max-w-3xl h-[60vh] bg-white rounded-[0.75rem] shadow-lg border-2 border-border-default relative overflow-hidden mt-24"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </motion.div>
      ) : (
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center mt-24"
        >
          {/* Transformation animation */}
          <motion.div 
            animate={{ 
              rotate: [0, -10, 10, -10, 10, 0], 
              scale: [1, 1.5, 1.2, 1.5, 1],
              filter: ['hue-rotate(0deg)', 'hue-rotate(90deg)', 'hue-rotate(0deg)']
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="text-[12rem] mb-12 drop-shadow-2xl"
          >
            {transformedSymbol}
          </motion.div>
          
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5, type: 'spring' }}
            onClick={onComplete}
            className="mt-8 bg-primary-pulse text-white px-12 py-6 rounded-xl text-3xl font-bold shadow-lg shadow-primary-pulse/30 flex items-center gap-4 hover:scale-105 transition-transform"
          >
            إنهاء
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}

function GameMap({ studentName, avatar, grade, track, onBack }: any) {
  const [currentStation, setCurrentStation] = useState(0);
  const [showLearning, setShowLearning] = useState(false);

  // Helper to render the avatar
  const renderAvatar = (scale = 1) => {
    const femaleHair = [
      { id: 1, color: '#4a3018', type: 'short' },
      { id: 2, color: '#fcd34d', type: 'short' },
      { id: 3, color: '#4a3018', type: 'long' },
      { id: 4, color: '#fcd34d', type: 'long' },
    ];
    const maleHair = [
      { id: 1, color: '#4a3018', type: 'spiky' },
      { id: 2, color: '#fcd34d', type: 'spiky' },
    ];
    const femaleClothes = [
      { id: 1, type: 'dress', color: '#f472b6' },
      { id: 2, type: 'shirt-pants', color: '#60a5fa' },
      { id: 3, type: 'jumpsuit', color: '#a78bfa' },
      { id: 4, type: 'active', color: '#34d399' },
    ];
    const maleClothes = [
      { id: 1, type: 'shirt-jeans', color: '#f87171' },
      { id: 2, type: 'hoodie-shorts', color: '#9ca3af' },
      { id: 3, type: 'active', color: '#60a5fa' },
    ];

    const currentHairList = avatar.gender === 'female' ? femaleHair : maleHair;
    const currentClothesList = avatar.gender === 'female' ? femaleClothes : maleClothes;
    const hair = currentHairList.find(h => h.id === avatar.hair) || currentHairList[0];
    const clothes = currentClothesList.find(c => c.id === avatar.clothes) || currentClothesList[0];

    return (
      <div className="relative flex flex-col items-center" style={{ transform: `scale(${scale})` }}>
        <div className="absolute -top-6 z-20">
          <div className="w-10 h-10 relative flex items-center justify-center">
            {hair.type === 'short' && <div className="w-8 h-8 rounded-t-full rounded-b-md" style={{ backgroundColor: hair.color }}></div>}
            {hair.type === 'long' && <div className="w-8 h-10 rounded-t-full rounded-b-xl" style={{ backgroundColor: hair.color }}></div>}
            {hair.type === 'spiky' && (
               <svg viewBox="0 0 24 24" fill={hair.color} className="w-8 h-8">
                 <path d="M12 2L9 8L3 7L7 12L4 18L10 15L15 19L14 13L20 10L14 8Z" />
               </svg>
            )}
          </div>
        </div>
        <div className="w-16 h-16 bg-amber-100 rounded-full border-4 z-10 flex flex-col items-center justify-center relative" style={{ borderColor: avatar.color }}>
          <div className="flex gap-2 mb-1 mt-2">
            <div className="w-1.5 h-1.5 bg-navy rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-navy rounded-full"></div>
          </div>
          <div className="w-3 h-1 bg-navy rounded-full mt-1"></div>
        </div>
        <div className="mt-1 z-0">
          <div className="w-10 h-10 relative flex items-center justify-center">
            {clothes.type === 'dress' && <div className="w-8 h-10 rounded-t-md rounded-b-xl" style={{ backgroundColor: clothes.color }}></div>}
            {clothes.type === 'shirt-pants' && (
              <div className="flex flex-col gap-1 items-center">
                <div className="w-8 h-5 rounded-md" style={{ backgroundColor: clothes.color }}></div>
                <div className="w-6 h-5 rounded-sm bg-slate-700"></div>
              </div>
            )}
            {clothes.type === 'jumpsuit' && <div className="w-7 h-10 rounded-md" style={{ backgroundColor: clothes.color }}></div>}
            {clothes.type === 'active' && (
              <div className="flex flex-col gap-1 items-center">
                <div className="w-7 h-5 rounded-md" style={{ backgroundColor: clothes.color }}></div>
                <div className="w-7 h-4 rounded-sm bg-slate-800"></div>
              </div>
            )}
            {clothes.type === 'shirt-jeans' && (
              <div className="flex flex-col gap-1 items-center">
                <div className="w-8 h-5 rounded-md" style={{ backgroundColor: clothes.color }}></div>
                <div className="w-6 h-6 rounded-sm bg-blue-800"></div>
              </div>
            )}
            {clothes.type === 'hoodie-shorts' && (
              <div className="flex flex-col gap-1 items-center">
                <div className="w-9 h-6 rounded-t-xl rounded-b-md" style={{ backgroundColor: clothes.color }}></div>
                <div className="w-7 h-4 rounded-sm bg-slate-600"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Specific Maps for Kindergarten
  if (grade === 'k' && track === 'colors') {
    return <ColorsMap studentName={studentName} avatar={avatar} renderAvatar={renderAvatar} onBack={onBack} />;
  }

  // Specific Map for Grade 1
  if (grade === '1') {
    return <Grade1Map studentName={studentName} avatar={avatar} renderAvatar={renderAvatar} onBack={onBack} />;
  }

  if (grade === 'k') {
    const stations = track === 'letters'
      ? [{ id: 0, label: 'أ', icon: '🌳', x: 20, y: 60 }, { id: 1, label: 'ب', icon: '🌲', x: 50, y: 40 }, { id: 2, label: 'ت', icon: '🌴', x: 80, y: 50 }]
      : [{ id: 0, label: '1', icon: '1️⃣', x: 20, y: 40 }, { id: 1, label: '2', icon: '2️⃣', x: 50, y: 60 }, { id: 2, label: '3', icon: '3️⃣', x: 80, y: 30 }];

    const handleStationClick = (index: number) => {
      if (index === currentStation) {
        setShowLearning(true);
        setTimeout(() => {
          setShowLearning(false);
          setCurrentStation(prev => Math.min(prev + 1, stations.length - 1));
        }, 3000);
      }
    };

    return (
      <motion.div
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className={`w-full h-screen relative overflow-hidden flex flex-col grayscale-0 transition-all duration-1000`}
        style={{ backgroundColor: track === 'letters' ? '#ecfdf5' : '#fffbeb' }}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
          <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-sm border border-border-default">
            <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-white overflow-hidden" style={{ borderColor: avatar.color }}>
              <div className="scale-[0.4] -mt-4">
                {renderAvatar()}
              </div>
            </div>
            <div>
              <div className="font-bold text-navy">{studentName}</div>
              <div className="text-xs text-text-secondary font-medium">
                {track === 'letters' ? 'خريطة الأصوات' : 'مغامرة الأرقام'}
              </div>
            </div>
            {/* Badges */}
            <div className="ml-4 flex gap-1 border-l border-border-default pl-4">
              {Array.from({ length: currentStation }).map((_, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-primary-pulse flex items-center justify-center text-white text-xs shadow-sm">★</div>
              ))}
            </div>
          </div>
          <button onClick={onBack} className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-border-default text-navy font-medium hover:bg-white transition-colors">
            خروج
          </button>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative w-full max-w-5xl mx-auto">
          {/* Path Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {stations.map((station, i) => {
              if (i === stations.length - 1) return null;
              const next = stations[i + 1];
              const isCompleted = currentStation > i;
              return (
                <line
                  key={`line-${i}`}
                  x1={`${station.x}%`}
                  y1={`${station.y}%`}
                  x2={`${next.x}%`}
                  y2={`${next.y}%`}
                  stroke={isCompleted ? '#08b8fb' : '#cbd5e1'}
                  strokeWidth="8"
                  strokeDasharray="12 12"
                  className="transition-colors duration-1000"
                />
              );
            })}
          </svg>

          {/* Stations */}
          {stations.map((station, i) => {
            const isCompleted = currentStation > i;
            const isActive = currentStation === i;
            
            return (
              <div
                key={station.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: `${station.x}%`, top: `${station.y}%` }}
              >
                <button
                  onClick={() => handleStationClick(i)}
                  disabled={!isActive && !isCompleted}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted ? 'bg-tech-brain border-4 border-white shadow-lg' :
                    isActive ? 'bg-white border-4 border-primary-pulse shadow-[0_0_20px_rgba(237,59,145,0.4)] animate-pulse' :
                    'bg-slate-200 border-4 border-white opacity-70'
                  }`}
                >
                  <span className="text-3xl">{station.icon || station.label}</span>
                </button>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white/80 px-3 py-1 rounded-full text-sm font-bold text-navy whitespace-nowrap shadow-sm">
                  {station.label}
                </div>

                {/* Avatar positioned on active/completed station */}
                {isActive && !showLearning && (
                  <motion.div
                    layoutId="avatar-map"
                    className="absolute -top-24 left-1/2 transform -translate-x-1/2 z-30 drop-shadow-xl"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    {renderAvatar(0.8)}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Learning Overlay */}
        <AnimatePresence>
          {showLearning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1.2, rotate: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="flex flex-col items-center"
              >
                <div className="text-9xl mb-8 drop-shadow-2xl">{stations[currentStation].icon || stations[currentStation].label}</div>
                <h2 className="text-5xl font-bold text-navy mb-4">
                  تعلم {stations[currentStation].label}!
                </h2>
                <p className="text-2xl text-text-secondary">ابحث عن الأشياء المطابقة...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Generic Map for older grades
  return (
    <motion.div
      initial={{ scale: 1.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="w-full h-screen bg-background-alt relative overflow-hidden flex flex-col"
    >
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-sm border border-border-default">
          <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-white overflow-hidden" style={{ borderColor: avatar.color }}>
             <div className="scale-[0.4] -mt-4">
                {renderAvatar()}
              </div>
          </div>
          <div>
            <div className="font-bold text-navy">{studentName}</div>
            <div className="text-xs text-text-secondary font-medium">الصف {grade}</div>
          </div>
        </div>
        <button onClick={onBack} className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-border-default text-navy font-medium hover:bg-white transition-colors">
          خروج
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #08b8fb 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="relative z-10 text-center">
          <div className="mx-auto bg-white rounded-full shadow-xl border-8 flex items-center justify-center mb-8 animate-bounce w-48 h-48 overflow-hidden" style={{ borderColor: avatar.color }}>
             <div className="scale-100 mt-4">
                {renderAvatar()}
              </div>
          </div>
          <h1 className="text-5xl font-bold text-navy mb-4">مرحباً بك في جزيرة المعرفة!</h1>
          <p className="text-xl text-text-secondary">خريطة اللعبة قيد التطوير للصفوف العليا...</p>
        </div>
      </div>
    </motion.div>
  );
}
