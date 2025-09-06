import React from 'react';
import { NervousSystem } from './components/NervousSystem';

function App() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <div className="absolute top-4 left-4 z-10 text-white">
        <h1 className="text-2xl font-bold mb-2 text-cyan-300">Single Neuron Study</h1>
        <p className="text-blue-200">Move mouse to rotate view</p>
        <p className="text-blue-200">Scroll to zoom</p>
      </div>
      <NervousSystem />
    </div>
  );
}

export default App;