#!/bin/bash
sed -i '/buyBond,/a \        createFD,\n        claimFDProfit,' src/context/AppContext.tsx
