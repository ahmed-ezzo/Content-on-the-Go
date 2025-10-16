import React from 'react';
import { Brand } from '../types';
import { SparklesIcon, HistoryIcon, IdentityIcon } from './icons';
import { DIALECTS } from '../constants';

interface BrandCardProps {
    brand: Brand;
    onGenerateClick: (brand: Brand) => void;
    onDelete: (brandId: string) => void;
    onViewHistory: (brand: Brand) => void;
    onEditIdentity: (brand: Brand) => void;
}

export const BrandCard: React.FC<BrandCardProps> = ({ brand, onGenerateClick, onDelete, onViewHistory, onEditIdentity }) => {
    const dialectLabel = DIALECTS.find(d => d.value === brand.dialect)?.label || brand.dialect;

    return (
        <div className="bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col justify-between transition-shadow hover:shadow-cyan-500/20 duration-300">
            <div>
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-cyan-400">{brand.name}</h3>
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full flex-shrink-0">{dialectLabel}</span>
                </div>
                <p className="text-slate-400 mt-2 text-sm h-20 overflow-y-auto pr-1">{brand.description}</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
                 <button
                    onClick={() => onEditIdentity(brand)}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md inline-flex items-center justify-center transition-colors text-sm"
                >
                    <IdentityIcon className="w-5 h-5 me-2" />
                    الهوية
                </button>
                 <button
                    onClick={() => onViewHistory(brand)}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md inline-flex items-center justify-center transition-colors text-sm"
                >
                    <HistoryIcon className="w-5 h-5 me-2" />
                    السجل
                </button>
                 <button
                    onClick={() => onDelete(brand.id)}
                    className="bg-rose-900/50 hover:bg-rose-800/60 text-rose-300 font-bold py-2 px-4 rounded-md inline-flex items-center justify-center transition-colors text-sm"
                    aria-label="Delete brand"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                    حذف
                </button>
                <button
                    onClick={() => onGenerateClick(brand)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md inline-flex items-center justify-center transition-colors text-sm"
                >
                    <SparklesIcon className="w-5 h-5 me-2" />
                    توليد
                </button>
            </div>
        </div>
    );
};
