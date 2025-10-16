import React, { useState, useEffect } from 'react';
import { Brand, Post, RefinementAction, ToneOfVoice } from '../types';
import { TONES } from '../constants';
import { refinePost, generateHashtags, generateTovPhrase } from '../services/geminiService';
import { CopyIcon, PlatformIcon, SpinnerIcon, RephraseIcon, ToneIcon, ShortenIcon, LengthenIcon, HashtagIcon, ImageIcon, SparklesIcon } from './icons';

interface PostCardProps {
    post: Post;
    brand: Brand;
    onUpdatePost: (updates: Partial<Post>) => void;
}

const TooltipButton: React.FC<{
    onClick?: () => void;
    children: React.ReactNode;
    tooltip: string;
    isLoading?: boolean;
    disabled?: boolean;
    isActive?: boolean;
}> = ({ onClick, children, tooltip, isLoading = false, disabled = false, isActive = false }) => (
    <div className="relative group">
        <button
            type="button"
            onClick={onClick}
            disabled={isLoading || disabled}
            className={`p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
        >
            {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : children}
        </button>
        <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {tooltip}
        </div>
    </div>
);

const VisualInspirationSection: React.FC<{ post: Post }> = ({ post }) => {
    const [promptCopied, setPromptCopied] = useState(false);
    
    if (!post.visualInspiration) return null;

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(post.visualInspiration?.imagePrompt || '').then(() => {
            setPromptCopied(true);
            setTimeout(() => setPromptCopied(false), 2000);
        });
    };

    return (
        <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3 animate-fade-in">
            <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-1">الوصف المرئي</h4>
                <p className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded-md">{post.visualInspiration.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-1">لوحة الألوان</h4>
                    <div className="flex gap-2 p-2 bg-slate-900/50 rounded-md">
                        {post.visualInspiration.colorPalette.map((color, i) => (
                            <div key={i} className="relative group w-8 h-8 rounded-full border-2 border-slate-600" style={{ backgroundColor: color }}>
                                 <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {color}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-1">موجه توليد الصور (AI)</h4>
                    <div className="relative">
                        <textarea
                            readOnly
                            value={post.visualInspiration.imagePrompt}
                            className="w-full text-xs text-slate-400 bg-slate-900/50 p-2 rounded-md font-mono resize-none pr-10"
                            rows={3}
                        />
                         <button onClick={handleCopyPrompt} className="absolute top-2 left-2 text-slate-400 hover:text-white">
                            <CopyIcon className="w-4 h-4"/>
                        </button>
                        {promptCopied && <span className="absolute bottom-2 right-2 text-xs text-cyan-400">تم النسخ!</span>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export const PostCard: React.FC<PostCardProps> = ({ post, brand, onUpdatePost }) => {
    const [copied, setCopied] = useState(false);
    const [tov, setTov] = useState(post.tovPhrase);
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [isGeneratingTov, setIsGeneratingTov] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showInspiration, setShowInspiration] = useState(false);

    useEffect(() => {
        setTov(post.tovPhrase);
    }, [post.tovPhrase]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleTovBlur = () => {
        if (tov !== post.tovPhrase) {
            onUpdatePost({ tovPhrase: tov });
        }
    };
    
    const handleRefine = async (action: RefinementAction, tone?: ToneOfVoice) => {
        const loadingKey = tone ? `${action}-${tone}` : action;
        setIsLoading(loadingKey);
        setError(null);
        try {
            const newText = await refinePost(post.text, action, brand.dialect, tone);
            onUpdatePost({ text: newText });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Refinement failed.');
        } finally {
            setIsLoading(null);
        }
    };
    
    const handleGenerateHashtags = async () => {
        setIsLoading('hashtags');
        setError(null);
        try {
            const newHashtags = await generateHashtags(post.text, brand.dialect);
            onUpdatePost({ hashtags: newHashtags });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Hashtag generation failed.');
        } finally {
            setIsLoading(null);
        }
    };
    
    const handleGenerateTov = async () => {
        setIsGeneratingTov(true);
        setError(null);
        try {
            const newTov = await generateTovPhrase(post.text, brand.description, brand.dialect);
            onUpdatePost({ tovPhrase: newTov });
            setTov(newTov);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل في توليد عبارة التصميم.');
        } finally {
            setIsGeneratingTov(false);
        }
    };

    return (
        <div className="bg-slate-800 p-4 rounded-lg flex flex-col transition-all duration-300">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                 <div className="flex items-center gap-3">
                    {post.platform && <PlatformIcon platform={post.platform} className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />}
                    <div className="flex flex-col">
                         {post.dayInCampaign && post.campaignTheme && (
                            <span className="text-xs font-bold text-purple-400 bg-purple-900/50 px-2 py-1 rounded-full self-start mb-2">
                                اليوم {post.dayInCampaign}: {post.campaignTheme}
                            </span>
                        )}
                        <p className="font-semibold text-slate-300 text-sm">الموضوع: {post.topic || 'غير محدد'}</p>
                    </div>
                </div>
                <button onClick={() => handleCopy(post.text)} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm flex-shrink-0">
                    <CopyIcon className="w-4 h-4"/>
                    {copied ? 'تم النسخ!' : 'نسخ النص'}
                </button>
            </div>
            
            {/* Main Text */}
            <div className="bg-slate-900/50 p-3 rounded-md min-h-[100px]">
                <p className="text-slate-300 whitespace-pre-wrap flex-grow">{post.text}</p>
            </div>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

            {/* Hashtags */}
            {(post.hashtags && post.hashtags.length > 0) && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                     <div className="flex flex-wrap gap-2">
                        {post.hashtags.map((tag, i) => (
                            <span key={i} className="text-sm text-cyan-300 bg-cyan-900/50 px-2 py-1 rounded">{tag}</span>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Visual Inspiration Section (Collapsible) */}
            {showInspiration && <VisualInspirationSection post={post} />}

            {/* Footer and Toolbox */}
            <div className="border-t border-slate-700 mt-4 pt-3 flex flex-col sm:flex-row gap-4">
                {/* TOV Input */}
                <div className="flex-grow">
                    <label htmlFor={`tov-${post.id}`} className="block text-xs font-medium text-slate-400 mb-1">عبارة التصميم (TOV)</label>
                    <div className="relative">
                        <input
                            id={`tov-${post.id}`}
                            type="text"
                            value={tov}
                            onChange={(e) => setTov(e.target.value)}
                            onBlur={handleTovBlur}
                            placeholder="اكتب عبارة للمصمم..."
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-md p-2 text-sm text-cyan-300 placeholder-slate-500 focus:ring-cyan-500 focus:border-cyan-500 pe-10"
                        />
                        <button
                            type="button"
                            onClick={handleGenerateTov}
                            disabled={isGeneratingTov}
                            className="absolute inset-y-0 end-2 flex items-center text-slate-400 hover:text-cyan-400 transition-colors disabled:cursor-not-allowed group"
                            aria-label="توليد عبارة تصميم جديدة"
                        >
                            {isGeneratingTov ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                            <div className="absolute bottom-full mb-2 -end-4 w-max px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                توليد عبارة مختلفة
                            </div>
                        </button>
                    </div>
                </div>
                {/* Toolbox */}
                <div className="flex-shrink-0">
                    <label className="block text-xs font-medium text-slate-400 mb-1 text-center sm:text-right">صندوق أدوات المحتوى</label>
                    <div className="flex items-center justify-center sm:justify-start gap-1 bg-slate-700/50 p-1 rounded-md">
                        <TooltipButton tooltip="إعادة صياغة" onClick={() => handleRefine(RefinementAction.Rephrase)} isLoading={isLoading === RefinementAction.Rephrase}>
                            <RephraseIcon className="w-5 h-5"/>
                        </TooltipButton>

                        <div className="relative group">
                             <TooltipButton tooltip="تغيير النبرة" disabled={!!isLoading}>
                                <ToneIcon className="w-5 h-5"/>
                            </TooltipButton>
                            <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 w-32 p-1 bg-slate-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10">
                                {TONES.map(tone => (
                                     <button key={tone.value} onClick={() => handleRefine(RefinementAction.ChangeTone, tone.value)} className="w-full text-sm text-right px-2 py-1 rounded hover:bg-slate-700 disabled:opacity-50" disabled={isLoading === `${RefinementAction.ChangeTone}-${tone.value}`}>
                                        {isLoading === `${RefinementAction.ChangeTone}-${tone.value}` ? '...' : tone.label}
                                     </button>
                                ))}
                            </div>
                        </div>

                        <TooltipButton tooltip="تقصير" onClick={() => handleRefine(RefinementAction.Shorten)} isLoading={isLoading === RefinementAction.Shorten}>
                            <ShortenIcon className="w-5 h-5"/>
                        </TooltipButton>
                        <TooltipButton tooltip="إطالة" onClick={() => handleRefine(RefinementAction.Lengthen)} isLoading={isLoading === RefinementAction.Lengthen}>
                            <LengthenIcon className="w-5 h-5"/>
                        </TooltipButton>
                        <div className="border-l h-6 border-slate-600 mx-1"></div>
                        <TooltipButton tooltip="توليد هاشتاجات" onClick={handleGenerateHashtags} isLoading={isLoading === 'hashtags'}>
                            <HashtagIcon className="w-5 h-5"/>
                        </TooltipButton>
                        <TooltipButton tooltip="الإلهام البصري" onClick={() => setShowInspiration(s => !s)} isActive={showInspiration}>
                            <ImageIcon className="w-5 h-5"/>
                        </TooltipButton>
                    </div>
                </div>
            </div>
        </div>
    );
};