import React, { useState } from 'react';
import { CheckCircle2, XCircle, Trash2, ArrowDownLeft, ArrowUpRight, CheckSquare, Briefcase } from 'lucide-react';
import { RequestItem, MarketingTeamMember } from '../types';

import { User } from '../types';
interface Props {
  requests: RequestItem[];
  marketingTeam: MarketingTeamMember[];
  users: Record<string, User>;
  approveRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  adminDeleteRequest: (id: string) => void;
}

export const AdminRequestsView: React.FC<Props> = ({ requests, marketingTeam, users, approveRequest, rejectRequest, adminDeleteRequest }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredRequests = requests
    .filter((req) => filter === 'all' || req.status === filter)
    .sort((a, b) => b.timestamp - a.timestamp); // sort newest first usually, but date might be just YYYY-MM-DD. 
    // Usually they are already sorted by how they are in the array (newest first). Let's just keep their original order if date doesn't have time.
    // Actually, reverse the array if we want newest first, assuming they are appended.
    
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const handleBulkApprove = () => {
    if (window.confirm(`Are you sure you want to approve all ${pendingCount} pending requests?`)) {
      requests.filter(r => r.status === 'pending').forEach(req => {
        approveRequest(req.id);
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#14213D] border border-[#2A3A5C] p-4 rounded-3xl shadow-xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-black capitalize whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-white/5 text-[#B0BBD4] hover:bg-white/10 hover:text-white'
              }`}
            >
              {f} {f === 'pending' && pendingCount > 0 && `(${pendingCount})`}
            </button>
          ))}
        </div>
        
        {pendingCount > 0 && (
          <button
            onClick={handleBulkApprove}
            className="px-4 py-2 rounded-xl bg-[#2ed573] hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <CheckSquare className="w-4 h-4" />
            Bulk Approve Pending ({pendingCount})
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => {
            const isDeposit = req.type === 'deposit';
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isRejected = req.status === 'rejected';
            const isMarketingMember = users[req.userPhone]?.isMarketingTeam || marketingTeam.some(m => m.phone === req.userPhone);

            return (
              <div
                key={req.id}
                className="rounded-2xl p-4 bg-[#14213D] border border-[#2A3A5C] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                        isDeposit
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {isDeposit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {req.type}
                    </span>

                    {isPending && <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">Pending</span>}
                    {isApproved && <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">Approved</span>}
                    {isRejected && <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">Rejected</span>}
                    {isMarketingMember && !isDeposit && (
                      <button type="button" className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black shadow-lg flex items-center gap-1 active:scale-95 transition-all cursor-default">
                        <Briefcase className="w-3 h-3" />
                        Marketing Team Trx
                      </button>
                    )}

                    <span className="font-extrabold text-sm text-white">{req.userName}</span>
                    <span className="text-xs text-[#B0BBD4]">({req.userPhone})</span>
                  </div>

                  <div className="text-xs text-[#B0BBD4] flex items-center gap-3 flex-wrap">
                    <span>Method: <strong className="text-white">{req.method}</strong></span>
                    {req.trxId && (
                      <span>TrxID: <strong className="text-[#FCA311] font-mono">{req.trxId}</strong></span>
                    )}
                    {req.accountNumber && (
                      <span>Wallet: <strong className="text-white font-mono">{req.accountNumber}</strong></span>
                    )}
                    <span>Date: {req.date}</span>
                  </div>
                  
                  {!isDeposit && req.netAmount && (
                    <div className="text-[11px] text-[#B0BBD4]">
                      Net Payout: <strong className="text-white">৳{req.netAmount}</strong> (Fee: ৳{req.fee})
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <div className={`text-base font-black ${isPending ? 'text-white' : isApproved ? 'text-emerald-400' : 'text-red-400 line-through opacity-70'}`}>
                      ৳{Number(req.amount).toLocaleString()}
                    </div>
                  </div>

                  {isPending && (
                    <>
                      <button
                        onClick={() => approveRequest(req.id)}
                        className="px-4 py-2 rounded-xl bg-[#2ed573] hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Approve</span>
                      </button>
                      <button
                        onClick={() => rejectRequest(req.id)}
                        className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-extrabold text-xs active:scale-95 transition-all flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Reject</span>
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => adminDeleteRequest(req.id)}
                    title="Delete Request"
                    className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-300 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-8 text-center text-[#B0BBD4] text-xs">
            No requests found for this filter.
          </div>
        )}
      </div>
    </div>
  );
};
