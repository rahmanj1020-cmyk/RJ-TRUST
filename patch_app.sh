#!/bin/bash
sed -i "/import { BondTab } from '.\/components\/BondTab';/a \import { FDTab } from '.\/components\/FDTab';" src/App.tsx
sed -i "/{activeTab === 'invest' && (/a \        {activeTab === 'fd' && <FDTab />}" src/App.tsx
