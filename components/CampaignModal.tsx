import React, { useState, useEffect } from 'react';
// FIX: Import ContentType to use its enum values.
import { Brand, Post, CampaignGoal, Platform, ToneOfVoice, ContentType } from '../types';
import { CAMPAIGN_GOALS, PLATFORMS, TONES } from '../constants';
import { generateCampaign } from '../services/geminiService';
import { SparklesIcon, SpinnerIcon, CampaignIcon, ChevronDownIcon, HistoryIcon } from './icons';
import { PostCard } from './PostCard';

interface CampaignModalProps {
    brands: Brand[];
    onClose: () => void;
    onCampaignGenerated: (brandId: string, posts: Post[]) => void;
    onUpdatePost: (brandId: string, postId: string, updates: Partial<Post>) => void;
}

const getPostCountLabel = (count: number) => {
    if (count === 1) return 'بوست';
    if (count === 2) return 'بوستين';
    if (count >= 3 && count <= 10) return 'بوستات';
    return 'بوست';
}

export const CampaignModal: React.FC<CampaignModalProps> = ({ brands, onClose, onCampaignGenerated, onUpdatePost }) => {
    const [selectedBrandId, setSelectedBrandId] = useState<string>(brands[0]?.id || '');
    const [goal, setGoal] = useState<CampaignGoal>(CampaignGoal.ProductLaunch);
    const [duration, setDuration] = useState<number>(5);
    const [topic, setTopic] = useState('');
    const [platform, setPlatform] = useState<Platform>(Platform.Instagram);
    const [tone, setTone] = useState<ToneOfVoice>(ToneOfVoice.Friendly);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedPosts, setGeneratedPosts] = useState<Post[]>([]);

    const [expandedDay, setExpandedDay] = useState<number | null>(1);

    const selectedBrand = brands.find(b => b.id === selectedBrandId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBrand) {
            setError("يرجى اختيار علامة تجارية أولاً.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedPosts([]);

        try {
            const results = await generateCampaign(selectedBrand, goal, duration, topic, platform, tone);
            const newPosts: Post[] = results.map((p, index) => ({
                id: `${Date.now()}-${index}`,
                text: p.text,
                tovPhrase: p.tov_phrase,
                dateGenerated: new Date().toISOString(),
                platform: platform,
                // FIX: Use ContentType enum member instead of a string literal to ensure type safety.
                contentType: ContentType.SocialPost,
                topic: topic,
                hashtags: [],
                visualInspiration: {
                    description: p.visual_inspiration.description,
                    colorPalette: p.visual_inspiration.color_palette,
                    imagePrompt: p.visual_inspiration.image_prompt,
                },
                dayInCampaign: p.day,
                campaignTheme: p.theme,
            }));
            setGeneratedPosts(newPosts);
            setExpandedDay(1); // Expand the first day by default
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveCampaign = () => {
        if(selectedBrandId && generatedPosts.length > 0) {
            onCampaignGenerated(selectedBrandId, generatedPosts);
        }
    };
    
    const handlePostUpdate = (postId: string, updates: Partial<Post>) => {
        setGeneratedPosts(currentPosts => 
            currentPosts.map(p => (p.id === postId ? { ...p, ...updates } : p))
        );
        if (selectedBrandId) {
            onUpdatePost(selectedBrandId, postId, updates);
        }
    };
    
    const groupedPostsByDay = generatedPosts.reduce((acc, post) => {
        const day = post.dayInCampaign || 0;
        if (!acc[day]) acc[day] = [];
        acc[day].push(post);
        return acc;
    }, {} as Record<number, Post[]>);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <CampaignIcon className="w-7 h-7 text-purple-400"/>
                        مولّد الحملات المتكاملة
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>

                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="w-full md:w-1/3 p-6 border-l border-slate-700 flex flex-col space-y-4 overflow-y-auto">
                        <div>
                            <label htmlFor="brand" className="block text-sm font-medium text-slate-300 mb-1">العلامة التجارية</label>
                            <select id="brand" value={selectedBrandId} onChange={(e) => setSelectedBrandId(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500">
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="goal" className="block text-sm font-medium text-slate-300 mb-1">هدف الحملة</label>
                            <select id="goal" value={goal} onChange={(e) => setGoal(e.target.value as CampaignGoal)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500">
                                {CAMPAIGN_GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                            </select>
                            <p className="text-xs text-slate-400 mt-1">{CAMPAIGN_GOALS.find(g => g.value === goal)?.description}</p>
                        </div>
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-slate-300 mb-1">مدة الحملة (أيام)</label>
                            <input type="number" id="duration" value={duration} onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))} min="1" max="14" className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500" />
                        </div>
                        <div>
                             <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-1">موضوع / موجز الحملة</label>
                            <textarea id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} required rows={4}
                                      className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
                                      placeholder="مثال: إطلاق قهوة الكولد برو الجديدة..."></textarea>
                        </div>
                        <div>
                            <label htmlFor="platform" className="block text-sm font-medium text-slate-300 mb-1">المنصة الأساسية</label>
                             <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500">
                                {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="tone" className="block text-sm font-medium text-slate-300 mb-1">النبرة العامة</label>
                             <select id="tone" value={tone} onChange={(e) => setTone(e.target.value as ToneOfVoice)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500">
                                {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div className="flex-grow"></div>
                        <button type="submit" disabled={isLoading || !selectedBrandId} className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-md inline-flex items-center justify-center transition-colors">
                            {isLoading ? <SpinnerIcon className="animate-spin w-5 h-5 me-2" /> : <SparklesIcon className="w-5 h-5 me-2" />}
                            {isLoading ? 'جاري التخطيط...' : 'خطط للحملة'}
                        </button>
                    </form>

                    {/* Results Section */}
                    <div className="w-full md:w-2/3 p-6 overflow-y-auto">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <SpinnerIcon className="animate-spin w-10 h-10 mb-4" />
                                <p className="text-lg">يقوم الخبير الاستراتيجي بالتخطيط...</p>
                                <p className="text-sm">هذا يتطلب تفكيرًا أعمق، قد يستغرق الأمر لحظات</p>
                            </div>
                        )}
                        {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md text-right">{error}</div>}
                        
                        {!isLoading && generatedPosts.length === 0 && !error && (
                             <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <CampaignIcon className="w-12 h-12 mb-4"/>
                                <h3 className="text-xl font-semibold">جاهز لإطلاق حملتك؟</h3>
                                <p>املأ النموذج على اليمين لتوليد خطة محتوى متكاملة</p>
                            </div>
                        )}

                        {generatedPosts.length > 0 && (
                            <>
                            <div className="space-y-3">
                                {Object.keys(groupedPostsByDay).map(dayKey => {
                                    const dayNum = parseInt(dayKey, 10);
                                    const posts = groupedPostsByDay[dayNum];
                                    const isExpanded = expandedDay === dayNum;
                                    
                                    return (
                                        <div key={dayKey} className="bg-slate-800 rounded-lg overflow-hidden transition-all duration-300">
                                            <button
                                                onClick={() => setExpandedDay(isExpanded ? null : dayNum)}
                                                className="w-full flex justify-between items-center p-4 text-right font-semibold text-white hover:bg-slate-700/50 transition-colors"
                                                aria-expanded={isExpanded}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <span className="text-lg font-bold text-purple-400">اليوم {dayNum}</span>
                                                    <span className="text-sm font-normal text-slate-300">{posts[0]?.campaignTheme}</span>
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </span>
                                            </button>
                                            {isExpanded && (
                                                <div className="p-4 border-t border-slate-700 bg-black/10">
                                                    <div className="space-y-4">
                                                        {posts.map(post => <PostCard key={post.id} post={post} brand={selectedBrand!} onUpdatePost={(updates) => handlePostUpdate(post.id, updates)} />)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-6">
                                <button onClick={handleSaveCampaign} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-md inline-flex items-center justify-center transition-colors">
                                    <HistoryIcon className="w-5 h-5 me-2"/>
                                    حفظ الحملة في السجل
                                </button>
                            </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};