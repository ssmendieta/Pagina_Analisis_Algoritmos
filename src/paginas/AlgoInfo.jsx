import { Play, BookOpen, Zap, Code, Layout, Users, ChevronRight } from 'lucide-react';

const AlgoInfo = () => {
  return (
    <div className="min-h-screen bg-[#0a0c14] text-white font-sans selection:bg-blue-500/30">
      

      <header className="relative pt-24 pb-32 px-8 overflow-hidden">
        
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -mr-64 -mt-32" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <h1 className="text-6xl md:text-7xl font-extrabold mt-6 leading-tight">
              Análisis de <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-300">
                Algoritmos
              </span>
            </h1>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-[#161b22] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-white/5 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                <span className="ml-2 text-xs text-gray-500 font-mono">complexity_analysis.py</span>
              </div>
              <div className="p-6 font-mono text-sm">
                <pre className="text-blue-400">def <span className="text-yellow-400">binary_search</span>(arr, target):</pre>
                <pre className="text-gray-500">    low, high = 0, len(arr) - 1</pre>
                <pre className="text-gray-500">    while low &lt;= high:</pre>
                <pre className="text-purple-400">        mid = (low + high) // 2</pre>
                <pre className="text-gray-300">        if arr[mid] == target: return mid</pre>
                <pre className="text-gray-300">        elif arr[mid] &lt; target: low = mid + 1</pre>
                <pre className="text-gray-300">        else: high = mid - 1</pre>
                <pre className="text-blue-400">    return -1</pre>
              </div>
              <div className="absolute bottom-4 right-4 bg-blue-600/90 backdrop-blur px-4 py-2 rounded-lg flex items-center gap-2 border border-blue-400/30">
                <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Rendimiento: O(log n)</span>
              </div>
            </div>
          </div>
        </div>
      </header>


      <section className="py-24 px-8 bg-[#0d1117]/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Conceptos Básicos</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-16" />
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Layout className="text-blue-500" />,
                title: "Secuencia de Pasos",
                desc: "Entiende el algoritmo como una receta: una serie finita de instrucciones precisas para resolver un problema de manera lógica."
              },
              {
                icon: <Zap className="text-blue-500" />,
                title: "Eficiencia de Software",
                desc: "No basta con que funcione. Analizamos el balance crítico entre el tiempo de ejecución y el uso de recursos de memoria."
              },
              {
                icon: <Code className="text-blue-500" />,
                title: "Notación Big O",
                desc: "El lenguaje universal para describir el peor escenario de rendimiento a medida que el conjunto de datos de entrada crece."
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-[#161b22] p-8 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all hover:-translate-y-2 group">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-4">Recursos Visuales</h2>
              
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "INTRODUCCIÓN A ALGORITMOS",
                desc: "En este video tendrás un mejor panorama de qué es lo que es un algoritmo en computación, algunos usos y clases de algoritmos.",
                time: "7:21",
                thumb: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80",
                url:"https://youtu.be/f10jKIslSUY?si=U28LUBNmHPSasIUa"
              },
              {
                title: "¿Qué es un algoritmo y por qué debería importarte?",
                desc: "ICiencias de la computación en Khan Academy: aprenda temas seleccionados de ciencias de la computación: algoritmos (cómo resolvemos problemas comunes en ciencias de la computación y medimos la eficiencia de nuestras soluciones), criptografía (cómo protegemos la información secreta) y teoría de la información (cómo codificamos y comprimimos la información).",
                time: "5:27",
                thumb: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
                url:"https://youtu.be/CvSOaYi89B4?si=eHulGNlsS02UXfOK"
              }
            ].map((video, idx) => (
              <div key={idx} className="group cursor-pointer"
              onClick={() => window.open(video.url, "_blank")}>
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 mb-6">
                  <img src={video.thumb} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <Play fill="white" size={24} className="ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded text-xs font-bold font-mono">
                    {video.time}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{video.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{video.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default AlgoInfo