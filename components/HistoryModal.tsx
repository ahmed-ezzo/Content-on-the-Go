import React, { useState, useMemo } from 'react';
import { Brand, Post } from '../types';
import { HistoryIcon, ChevronDownIcon, ExportIcon } from './icons';
import { PostCard } from './PostCard';

interface HistoryModalProps {
    brand: Brand;
    onClose: () => void;
    onUpdatePost: (postId: string, updates: Partial<Post>) => void;
}

const getPostCountLabel = (count: number) => {
    if (count === 1) return 'بوست';
    if (count === 2) return 'بوستين';
    if (count >= 3 && count <= 10) return 'بوستات';
    return 'بوست';
}

// Helper to escape CSV fields
const escapeCSV = (field: any): string => {
    if (field === null || field === undefined) {
        return '';
    }
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};


export const HistoryModal: React.FC<HistoryModalProps> = ({ brand, onClose, onUpdatePost }) => {
    const groupedPostsByDate = useMemo(() => {
        const grouped = (brand.posts || []).reduce((acc, post) => {
            const dateKey = post.dateGenerated ? post.dateGenerated.split('T')[0] : 'unknown';
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(post);
            return acc;
        }, {} as Record<string, Post[]>);
        
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => new Date(b.dateGenerated).getTime() - new Date(a.dateGenerated).getTime());
        });

        return grouped;
    }, [brand.posts]);

    const sortedDateKeys = useMemo(() => {
        return Object.keys(groupedPostsByDate).sort((a, b) => b.localeCompare(a));
    }, [groupedPostsByDate]);
    
    const [expandedDate, setExpandedDate] = useState<string | null>(sortedDateKeys[0] || null);

    const toggleDate = (dateKey: string) => {
        setExpandedDate(prev => (prev === dateKey ? null : dateKey));
    };

    const handleExport = () => {
        if (!brand.posts || brand.posts.length === 0) return;

        const headers = ['Date', 'Platform', 'Topic', 'Text', 'TOV Phrase', 'Hashtags'];
        const rows = brand.posts.map(post => [
            new Date(post.dateGenerated).toLocaleString('ar-EG'),
            post.platform,
            post.topic,
            post.text,
            post.tovPhrase,
            (post.hashtags || []).join(' '),
        ].map(escapeCSV));

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${brand.name}_content_history.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">
                        سجل المحتوى لـ <span className="text-cyan-400">{brand.name}</span>
                    </h2>
                     <div className="flex items-center gap-4">
                        <button onClick={handleExport} className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-md">
                            <ExportIcon className="w-5 h-5"/>
                            تصدير
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
                    </div>
                </div>

                <div className="flex-grow p-6 overflow-y-auto">
                    {sortedDateKeys.length > 0 ? (
                        <div className="space-y-3">
                            {sortedDateKeys.map(dateKey => {
                                const posts = groupedPostsByDate[dateKey];
                                const isExpanded = expandedDate === dateKey;
                                const formattedDate = new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full' }).format(new Date(dateKey));
                                
                                return (
                                    <div key={dateKey} className="bg-slate-800 rounded-lg overflow-hidden transition-all duration-300">
                                        <button
                                            onClick={() => toggleDate(dateKey)}
                                            className="w-full flex justify-between items-center p-4 text-right font-semibold text-white hover:bg-slate-700/50 transition-colors"
                                            aria-expanded={isExpanded}
                                        >
                                            <span className="flex items-center gap-3">
                                                <HistoryIcon className="w-5 h-5 text-cyan-400" />
                                                <span>{formattedDate}</span>
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <span className="text-sm font-normal text-slate-400 bg-slate-700 px-2 py-1 rounded-full">{posts.length} {getPostCountLabel(posts.length)}</span>
                                                <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </span>
                                        </button>
                                        {isExpanded && (
                                            <div className="p-4 border-t border-slate-700 bg-black/10">
                                                <div className="space-y-4">
                                                    {posts.map(post => <PostCard key={post.id} post={post} brand={brand} onUpdatePost={(updates) => onUpdatePost(post.id, updates)} />)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
                            <HistoryIcon className="w-12 h-12 mb-4"/>
                            <h3 className="text-xl font-semibold">لا يوجد سجل حتى الآن</h3>
                            <p>قم بتوليد محتوى جديد لهذه العلامة التجارية ليظهر هنا.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};