import { ChevronRight, FileText } from 'lucide-react';

const PaginaIncio = () => {
  return (
    <div className="min-h-screen bg-[#0a0c14] text-white font-sans flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />

      <main className="text-center z-10 px-6 max-w-4xl">
        <div className="mb-12 flex justify-center">
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <img 
              src="/image.png" 
              alt="University Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tight">
          Análisis de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Algoritmos</span>
        </h1>
        
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="h-px w-12 bg-white/10" />
          <h2 className="text-2xl md:text-3xl font-light text-gray-400 italic">
            Sergio Mendieta
          </h2>
          <div className="h-px w-12 bg-white/10" />
        </div>

        

        
      </main>

      
      
    </div>
  );
};

export default PaginaIncio;