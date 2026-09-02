import React, { useState } from "react";
import { ArrowLeft, ExternalLink, RotateCw, Maximize2, Minimize2, Eye, EyeOff, Compass } from "lucide-react";

interface MapViewerProps {
  onBack: () => void;
}

export default function MapViewer({ onBack }: MapViewerProps) {
  const [reloadKey, setReloadKey] = useState(0);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const mapUrl = "http://zefircraft.ddns.net:8123/?worldname=Towny";

  const handleReload = () => {
    setReloadKey((prev) => prev + 1);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullScreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen bg-[#070b14] flex flex-col overflow-hidden select-none">
      {/* Top Header Bar */}
      {!isHeaderHidden && (
        <header className="h-12 bg-gradient-to-r from-[#0a1224] via-[#0d1b38] to-[#0a1224] border-b border-sky-500/30 px-3 sm:px-4 flex items-center justify-between shrink-0 shadow-lg z-20">
          {/* Left: Back button & Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onBack}
              id="map-back-btn"
              className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 hover:text-white border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Ana Sayfaya Dön"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Ana Sayfa</span>
            </button>

            <div className="h-4 w-px bg-slate-700/60 hidden xs:block" />

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Compass className="w-3.5 h-3.5 animate-spin-slow" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-white tracking-tight">Towny Canlı Harita</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    CANLI
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Refresh */}
            <button
              onClick={handleReload}
              id="map-reload-btn"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-all cursor-pointer"
              title="Haritayı Yenile"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Toggle Fullscreen / Hide Controls */}
            <button
              onClick={() => setIsHeaderHidden(true)}
              id="map-hide-bar-btn"
              className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold hidden sm:flex items-center gap-1 transition-all cursor-pointer"
              title="Üst Menüyü Gizle (Tam Harita Modu)"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px]">Gizle</span>
            </button>

            <button
              onClick={toggleFullScreen}
              id="map-fullscreen-btn"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-all cursor-pointer hidden md:flex"
              title={isFullScreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
            >
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Open in New Tab (Critical fallback for mixed content HTTP/HTTPS) */}
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="map-new-tab-link"
              className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-950/40 border border-emerald-400/30 transition-all cursor-pointer"
              title="Haritayı Yeni Sekmede Aç"
            >
              <span className="hidden sm:inline">Yeni Sekmede Aç</span>
              <span className="sm:hidden">Sekmede Aç</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-90" />
            </a>
          </div>
        </header>
      )}

      {/* Floating restore button when header is hidden */}
      {isHeaderHidden && (
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
          <button
            onClick={() => setIsHeaderHidden(false)}
            className="px-3 py-1.5 rounded-xl bg-[#0b1324]/90 hover:bg-[#111f3b] text-sky-200 border border-sky-500/40 text-xs font-bold flex items-center gap-1.5 shadow-xl backdrop-blur-md cursor-pointer transition-all active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>Menüyü Göster</span>
          </button>
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl bg-[#0b1324]/90 hover:bg-[#111f3b] text-slate-300 hover:text-white border border-slate-700 text-xs shadow-xl backdrop-blur-md cursor-pointer transition-all"
            title="Ana Sayfaya Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Full screen Map Iframe Area */}
      <div className="relative flex-1 w-full h-full bg-[#050811] overflow-hidden">
        <iframe
          key={reloadKey}
          id="dynmap-iframe"
          src={mapUrl}
          title="ZefirCraft Towny Canlı Haritası"
          className="w-full h-full border-0 block"
          allow="fullscreen; clipboard-read; clipboard-write"
          loading="eager"
        />

        {/* Discreet bottom-right helper in case browser mixed-content blocks HTTP in HTTPS */}
        <div className="absolute bottom-2 right-2 z-20 pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/10 text-[11px] text-slate-300 hover:text-white transition-colors"
          >
            <span>Harita açılmıyor mu? Yeni sekmede aç</span>
            <ExternalLink className="w-3 h-3 text-sky-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
