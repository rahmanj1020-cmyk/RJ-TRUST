import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Ticket, Trophy, ShieldCheck, Copy, Check, Sparkles, RefreshCw, AlertCircle, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RJ_BONDS } from '../data/constants';
import { PriceBondDef } from '../types';

export const BondTab: React.FC = () => {
  const { currentUser, buyBond, t, lang, showToast } = useApp();
  const [selectedBond, setSelectedBond] = useState<PriceBondDef | null>(null);
  const [buying, setBuying] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  if (!currentUser) return null;

  const myBonds = currentUser.bonds || [];
  const totalBondsCount = myBonds.length;
  const totalInvestedInBonds = myBonds.reduce((acc, b) => acc + b.price, 0);

  const handleBuy = (bondDef: PriceBondDef) => {
    if (currentUser.balance < bondDef.price) {
      showToast(
        lang === 'bn'
          ? `অপর্যাপ্ত ব্যালেন্স! প্রয়োজন ৳${bondDef.price}`
          : `Insufficient balance! Required ৳${bondDef.price}`,
        'error'
      );
      return;
    }
    setBuying(true);
    const res = buyBond(bondDef.id);
    setBuying(false);
    if (res.success && res.serialNumber) {
      setSelectedBond(null);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleCopySerial = (serial: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(serial);
      setCopiedSerial(serial);
      showToast(lang === 'bn' ? `বন্ড নম্বর কপি হয়েছে: ${serial}` : `Copied: ${serial}`, 'success');
      setTimeout(() => setCopiedSerial(null), 2500);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-[#14213D] via-[#1B2C52] to-[#0A1128] border border-[#FCA311] p-6 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FCA311]/15 text-[#FCA311] mb-2 shadow-inner">
          <Ticket className="w-8 h-8" />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-[#FCA311] tracking-wide">
          {t('bondTitle')}
        </h2>
        <p className="text-xs text-[#B0BBD4] mt-1 max-w-md mx-auto">
          {t('bondSub')} • 100% Money-Back Protection
        </p>

        {/* Quick Snapshot */}
        <div className="mt-4 grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <div className="bg-[#FCA311]/10 border border-[#FCA311]/30 rounded-2xl p-2.5 text-center">
            <div className="text-lg font-black text-[#FCA311]">{totalBondsCount}</div>
            <div className="text-[10px] font-bold text-[#B0BBD4] uppercase">{t('myBond')}</div>
          </div>
          <div className="bg-[#2ed573]/10 border border-[#2ed573]/30 rounded-2xl p-2.5 text-center">
            <div className="text-lg font-black text-[#2ed573]">৳{totalInvestedInBonds.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-[#B0BBD4] uppercase">{t('totalInv')}</div>
          </div>
        </div>
      </motion.div>

      {/* Bond Shop Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#B0BBD4] flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-[#FCA311]" />
            <span>{t('buyBond')}</span>
          </h3>
          <span className="text-[11px] text-[#2ed573] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Refundable</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {RJ_BONDS.map((bond) => {
            const myCountOfThisBond = myBonds.filter((b) => b.bondDefId === bond.id).length;

            return (
              <div
                key={bond.id}
                className="rounded-2xl border overflow-hidden bg-[#14213D] shadow-xl flex flex-col justify-between"
                style={{
                  borderColor: `${bond.color}55`,
                  borderLeftWidth: '5px',
                  borderLeftColor: bond.color,
                }}
              >
                {/* Header row */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shadow-inner"
                      style={{
                        backgroundColor: `${bond.color}25`,
                        color: bond.color,
                      }}
                    >
                      {bond.icon}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-white" style={{ color: bond.color }}>
                        {bond.name}
                      </h4>
                      <div className="text-xs text-[#B0BBD4]">
                        Price: <span className="font-black text-white">৳{bond.price.toLocaleString()}</span>
                      </div>
                      {myCountOfThisBond > 0 && (
                        <div className="text-[10px] font-bold text-amber-300 mt-0.5">
                          Owned: {myCountOfThisBond} bonds
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuy(bond)}
                    disabled={buying}
                    className="py-2 px-4 rounded-xl font-black text-xs text-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all hover:brightness-105"
                    style={{
                      background: `linear-gradient(135deg, ${bond.color}, #FCA311)`,
                    }}
                  >
                    {t('buy')}
                  </button>
                </div>

                {/* Prize Breakdown Box */}
                <div className="bg-black/50 p-3 text-xs border-t border-white/5 space-y-1.5">
                  <div className="text-[10px] font-black tracking-wider uppercase mb-1" style={{ color: bond.color }}>
                    {t('prizeList')}
                  </div>
                  {bond.prizes.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] text-[#B0BBD4]">
                      <span>{lang === 'bn' ? p.titleBn : p.rank}</span>
                      <span className="font-black text-[#2ed573]">৳{p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-[11px] text-[#B0BBD4] pt-1 border-t border-white/5">
                    <span>{t('noReturn')}</span>
                    <span className="font-black text-[#FCA311]">৳{bond.price} Back</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Active Bonds List */}
      {myBonds.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#B0BBD4] flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#FCA311]" />
              <span>{t('myBonds')}</span>
            </h3>
            <span className="text-xs text-[#FCA311] font-bold">
              {myBonds.length} Active
            </span>
          </div>

          <div className="space-y-2.5">
            {myBonds.map((b) => {
              const def = RJ_BONDS.find((x) => x.id === b.bondDefId);
              const isWinner = b.status.includes('Prize');
              const isReturned = b.status === 'Return';

              return (
                <div
                  key={b.id}
                  className="rounded-2xl p-4 border bg-[#14213D] shadow-lg"
                  style={{
                    borderColor: `${def?.color || '#FCA311'}44`,
                    borderLeftWidth: '4px',
                    borderLeftColor: def?.color || '#FCA311',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-extrabold text-sm text-white" style={{ color: def?.color }}>
                        {b.bondName}
                      </div>
                      <div className="text-[10px] text-[#B0BBD4] mt-0.5">
                        Purchased: {b.purchaseDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-red-400">৳{b.price.toLocaleString()}</div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black mt-1 ${
                          isWinner
                            ? 'bg-[#2ed573]/20 text-[#2ed573] border border-[#2ed573]/40'
                            : isReturned
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-[#FCA311]/20 text-[#FCA311] border border-[#FCA311]/30'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </div>

                  {/* Serial Box (Tap to Copy) */}
                  <div
                    onClick={() => handleCopySerial(b.serialNumber)}
                    className="p-2.5 rounded-xl bg-black/60 border border-dashed border-[#FCA311]/50 flex items-center justify-between cursor-pointer hover:border-[#FCA311] transition-all group"
                  >
                    <div>
                      <div className="text-[9px] font-bold text-[#B0BBD4] uppercase tracking-wider">
                        Official Bond Number (Show to Admin for Prize)
                      </div>
                      <div className="font-black text-sm tracking-[0.2em] text-[#FCA311] group-hover:scale-105 transition-transform origin-left">
                        {b.serialNumber}
                      </div>
                    </div>
                    <button className="p-1.5 rounded-lg bg-white/10 text-white group-hover:text-[#FCA311]">
                      {copiedSerial === b.serialNumber ? <Check className="w-4 h-4 text-[#2ed573]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Winning Prize Banner if won */}
                  {b.prizeAmount && (
                    <div className="mt-2.5 p-2 rounded-xl bg-[#2ed573]/15 border border-[#2ed573]/30 text-center text-xs font-black text-[#2ed573]">
                      🏆 Winner! Cash Prize ৳{b.prizeAmount.toLocaleString()} Credited
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
