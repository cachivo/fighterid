const UrbanDecorations = () => {
  return (
    <>
      {/* Decorative urban lighting overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Neon purple cinematic lighting effects */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-neon-primary/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-purple-neon-secondary/15 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-neon-primary/25 rounded-full blur-2xl opacity-35"></div>
        
        {/* Urban texture overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(192,132,252,0.1)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(147,51,234,0.08)_0%,transparent_60%)]"></div>
      </div>

      {/* Dramatic shadow elements */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-0">
        <div className="h-32 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>

      {/* Side urban elements */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 pointer-events-none z-0">
        <div className="w-1 h-40 bg-gradient-to-b from-transparent via-purple-neon-primary/50 to-transparent"></div>
      </div>
      <div className="fixed right-0 top-1/3 pointer-events-none z-0">
        <div className="w-1 h-32 bg-gradient-to-b from-transparent via-purple-neon-secondary/40 to-transparent"></div>
      </div>
    </>
  );
};

export default UrbanDecorations;