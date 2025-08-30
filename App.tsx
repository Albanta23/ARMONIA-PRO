import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ProgressionGenerator } from './components/ProgressionGenerator';
import { TheoryGuide } from './components/TheoryGuide';
import { RepertoireAnalysis } from './components/RepertoireAnalysis';
import { Footer } from './components/Footer';
import { IntroPanel } from './components/IntroPanel';
import { Topic } from './types';

const App: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<Topic>(Topic.PROGRESSIONS);
  const [showIntro, setShowIntro] = useState(true);

  const handleStart = (topic: Topic) => {
    setActiveTopic(topic);
    setShowIntro(false);
  };

  const goHome = () => {
    setShowIntro(true);
  };

  const renderContent = useCallback(() => {
    switch (activeTopic) {
      case Topic.PROGRESSIONS:
        return <ProgressionGenerator />;
      case Topic.THEORY_GUIDE:
        return <TheoryGuide />;
      case Topic.REPERTOIRE_ANALYSIS:
        return <RepertoireAnalysis />;
      default:
        return <ProgressionGenerator />;
    }
  }, [activeTopic]);
  
  if (showIntro) {
    return <IntroPanel onStart={handleStart} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar activeTopic={activeTopic} setActiveTopic={setActiveTopic} />
      <div className="flex flex-col flex-1 overflow-y-auto">
        <Header onGoHome={goHome} />
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {renderContent()}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;