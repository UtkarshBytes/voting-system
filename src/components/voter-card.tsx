'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { ShieldCheck, Cpu, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoterCardProps {
  user: {
    id: string;
    _id?: string;
    name: string;
    role: string;
    kyc?: {
      status: string;
      idNumber?: string;
    };
  };
  className?: string;
}

const VoterCardDesign = ({ user, isPrint = false }: { user: VoterCardProps['user'], isPrint?: boolean }) => {
  const voterId = user.id || user._id || 'UNKNOWN';
  const verificationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/voter/${voterId}`;

  return (
    <div className={cn(
      "relative group w-full aspect-[1.6/1] rounded-3xl p-8 overflow-hidden text-white bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 shadow-2xl border border-white/10 transition-all duration-500",
      !isPrint && "hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(0,200,255,0.4)]",
      isPrint ? "shadow-none scale-100 max-w-[600px]" : "max-w-md"
    )}>

      {/* Blockchain Accent Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>

      {/* Holographic Watermark */}
      <div className={cn(
        "absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(120deg,rgba(255,0,150,0.4),rgba(0,255,255,0.4),rgba(255,255,0,0.4))] bg-[length:200%_200%]",
        !isPrint && "animate-hologramMove"
      )}></div>

      {/* Animated Shine Effect */}
      <div className={cn(
        "absolute top-0 left-[-75%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-12 pointer-events-none",
        !isPrint && "animate-shine"
      )}></div>

      {/* Glass Overlay */}
      <div className="absolute inset-0 backdrop-blur-md bg-white/5 pointer-events-none"></div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col justify-between h-full">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] text-cyan-200 uppercase">SecureVote</h3>
              <h1 className="text-sm font-bold tracking-widest text-white/80">OFFICIAL VOTER ID</h1>
            </div>
          </div>

          {/* NFC Chip */}
          <div className="w-12 h-10 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-md border border-yellow-600/30 flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#000_2px,#000_4px)]"></div>
             <Wifi className="w-6 h-6 text-yellow-700/60 rotate-90" />
          </div>
        </div>

        {/* User Details */}
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Voter Identity</p>
            <h2 className="text-2xl font-bold tracking-wide text-white drop-shadow-md">{user.name}</h2>
            <div className="flex items-center gap-2 mt-2">
               <Cpu className="w-4 h-4 text-cyan-500" />
               <p className="text-lg font-mono tracking-widest text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                 {voterId.substring(0, 8).toUpperCase()}...
               </p>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Digital Blockchain ID</p>
          </div>

          {/* QR Code */}
          <div className="bg-white p-3 rounded-xl shadow-lg flex flex-col items-center gap-1">
            <QRCodeSVG value={verificationUrl} size={64} level="H" />
            <span className="text-[8px] font-bold text-slate-900 uppercase tracking-tight">Scan to Verify</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VoterCard = ({ user, className }: VoterCardProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownload = () => {
    window.print();
  };

  return (
    <>
      <div className={cn("flex flex-col items-center gap-6 print:hidden", className)}>
        <VoterCardDesign user={user} />

        {/* Action Buttons */}
        <div>
          <Button onClick={handleDownload} variant="outline" className="gap-2 border-slate-300 text-slate-600 hover:text-blue-600 hover:border-blue-300">
             Download / Print Card
          </Button>
        </div>
      </div>

      {/* Print Portal */}
      {mounted && createPortal(
        <div id="voter-card-print-portal" className="hidden print:flex fixed inset-0 z-[99999] bg-white items-center justify-center p-0 m-0 w-screen h-screen">
           <VoterCardDesign user={user} isPrint={true} />
           <style jsx global>{`
             @media print {
               @page { margin: 0; size: auto; }
               body { visibility: hidden; }
               #voter-card-print-portal { visibility: visible; }
             }
           `}</style>
        </div>,
        document.body
      )}
    </>
  );
};
