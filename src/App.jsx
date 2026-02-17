import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';  
import Graficador from './paginas/Graficador'
import AnalisisInfo from './paginas/AlgoInfo'
import PaginaIncio from './paginas/PaginaInicio';
import { Play, BookOpen, Zap, Code, Layout, Users, ChevronRight } from 'lucide-react';

export default function App() {
  return (
    <Router>
      
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#0a0c14] backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-500 transition-colors">
            <Code size={20} className="text-white" />
          </div>
          
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link to="/paginaInicio" className="text-white hover:text-blue-400">
            Inicio
          </Link>
          <Link to="/algoritmos" className="text-white hover:text-blue-400">
            ¿Qué es un algoritmo?
          </Link>
          <Link to="/graficador" className="text-white hover:text-blue-400">
            Graficador
          </Link>
        </div>

        <div className="flex items-center gap-4">
         
          
        </div>
      </nav>

      
      <Routes>
        <Route path="/" element={<Navigate to="/paginaInicio" replace />} />
        <Route path="/algoritmos" element={<AnalisisInfo />} />
        <Route path="/graficador" element={<Graficador />} />
        <Route path="/paginaInicio" element={<PaginaIncio />} />
      </Routes>
    </Router>
  );
}