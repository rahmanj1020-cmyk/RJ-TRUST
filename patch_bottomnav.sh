#!/bin/bash
sed -i "s/import { Home, Crown, TrendingUp, Ticket, User as UserIcon, ReceiptText, Shield } from 'lucide-react';/import { Home, Crown, TrendingUp, Ticket, User as UserIcon, ReceiptText, Shield, Landmark } from 'lucide-react';/" src/components/BottomNav.tsx
sed -i "/{ id: 'invest', label: t('invest'), icon: TrendingUp },/a \    { id: 'fd', label: 'FD', icon: Landmark }," src/components/BottomNav.tsx
