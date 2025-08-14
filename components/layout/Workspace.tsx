
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../contexts/AppContext';
import Dashboard from '../views/Dashboard';
import ResearchAgent from '../views/ResearchAgent';
import Notes from '../views/Notes';
import SchoolExplorer from '../views/SchoolExplorer';
import Garage from '../views/Garage';
import MagnaCarta from '../views/MagnaCarta';
import Assignments from '../views/Assignments';
import Analyzer from '../views/Analyzer';
import HelpGuide from '../views/HelpGuide';

const Workspace: React.FC = () => {
  const { currentView } = useAppContext();

  const pageVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 },
  };

  const renderView = () => {
    switch (currentView) {
      case 'pulse':
        return <Dashboard />;
      case 'intel':
        return <ResearchAgent />;
      case 'magna_carta':
        return <MagnaCarta />;
      case 'grind':
        return <Assignments />;
      case 'lab':
        return <Notes />;
      case 'analyzer':
        return <Analyzer />;
      case 'campus':
        return <SchoolExplorer />;
      case 'garage':
        return <Garage />;
       case 'playbook':
        return <HelpGuide />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <main className="workspace bg-transparent h-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={{ duration: 0.2 }}
          className="w-full h-full overflow-y-auto"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </main>
  );
};

export default Workspace;
