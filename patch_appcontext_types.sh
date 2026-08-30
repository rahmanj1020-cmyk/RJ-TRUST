#!/bin/bash
sed -i '/buyBond:/a \  createFD: (amount: number) => { success: boolean; message: string };\n  claimFDProfit: (fdId: string) => { success: boolean; message: string; amount?: number };' src/context/AppContext.tsx
