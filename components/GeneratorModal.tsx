import React, { useState, useEffect } from 'react';
import { Brand, Platform, Post, ToneOfVoice, ContentType } from '../types';
import { PLATFORMS, TONES, CONTENT_TYPES } from '../constants';
import { generateSocialPosts, generateTopicIdeas } from '../services/geminiService';
import { SparklesIcon, SpinnerIcon, LightbulbIcon, ArrowRightIcon } from './icons';
import { PostCard } from './PostCard';

interface GeneratorPageProps {
    brand: Brand;
    onBack: () => void;
    onPostsGenerated: (posts: Post[]) => void;
    onUpdatePost: (postId: string, updates: Partial<Post>) => void;
}

export const GeneratorPage: React.FC<GeneratorPageProps> = ({ brand, onBack, onPostsGenerated, onUpdatePost }) => {
    const [platform, setPlatform] = useState<Platform>(Platform.Facebook);
    const [tone, setTone] = useState<ToneOfVoice>(ToneOfVoice.Friendly);
    const [count, setCount] = useState<number>(5);
    const [contentType, setContentType] = useState<ContentType>(ContentType.SocialPost);
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedPosts, setGeneratedPosts] = useState<Post[]>([]);

    const [isSuggesting, setIsSuggesting] = useState(false);
    const [topicIdeas, setTopicIdeas] = useState<string[]>([]);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);

    const handleSuggestTopics = async () => {
        setIsSuggesting(true);
        setSuggestionError(null);
        setTopicIdeas([]);
        try {
            const ideas = await generateTopicIdeas(brand.description, brand.dialect);
            setTopicIdeas(ideas);
        } catch (err) {
            setSuggestionError(err instanceof Error ? err.message : 'Failed to get suggestions.');
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setGeneratedPosts([]);

        try {
            const results = await generateSocialPosts(brand, platform, tone, count, contentType, topic);
            const newPosts: Post[] = results.map((p, index) => ({
                id: `${Date.now()}-${index}`,
                text: p.text,
                tovPhrase: p.tov_phrase,
                dateGenerated: new Date().toISOString(),
                platform: platform,
                contentType: contentType,
                topic: topic,
                hashtags: [],
                visualInspiration: p.visual_inspiration ? {
                    description: p.visual_inspiration.description,
                    colorPalette: p.visual_inspiration.color_palette,
                    imagePrompt: p.visual_inspiration.image_prompt,
                } : undefined,
            }));
            setGeneratedPosts(newPosts);
            onPostsGenerated(newPosts);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostUpdate = (postId: string, updates: Partial<Post>) => {
        setGeneratedPosts(currentPosts => 
            currentPosts.map(p => (p.id === postId ? { ...p, ...updates } : p))
        );
        onUpdatePost(postId, updates);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            <header className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm flex justify-between items-center flex-shrink-0 z-10 sticky top-0">
                <h2 className="text-2xl font-bold text-white">
                    توليد محتوى لـ <span className="text-cyan-400">{brand.name}</span>
                </h2>
                <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md inline-flex items-center justify-center transition-colors text-sm gap-2">
                     <ArrowRightIcon className="w-5 h-5"/>
                     العودة للعلامات التجارية
                </button>
            </header>

            <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
                {/* Form Section */}
                <form onSubmit={handleSubmit} className="w-full md:w-2/5 lg:w-1/3 p-6 border-l border-slate-800 flex flex-col space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="contentType" className="block text-sm font-medium text-slate-300 mb-1">نوع المحتوى</label>
                        <select id="contentType" value={contentType} onChange={(e) => setContentType(e.target.value as ContentType)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500">
                            {CONTENT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="topic" className="block text-sm font-medium text-slate-300">اكتب موضوع المحتوى</label>
                            <button type="button" onClick={handleSuggestTopics} disabled={isSuggesting} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 disabled:opacity-50">
                                {isSuggesting ? <SpinnerIcon className="w-3 h-3 animate-spin"/> : <LightbulbIcon className="w-4 h-4"/>}
                                {isSuggesting ? '...' : 'اقترح أفكار'}
                            </button>
                        </div>
                        <textarea id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} required rows={4}
                                  className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
                                  placeholder="مثال: إطلاق منتج جديد، عرض خاص، نصيحة..."></textarea>
                        {suggestionError && <p className="text-xs text-red-400 mt-1">{suggestionError}</p>}
                        {topicIdeas.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {topicIdeas.map((idea, i) => (
                                    <button type="button" key={i} onClick={() => { setTopic(idea); setTopicIdeas([]); }} className="w-full text-right text-sm bg-slate-800/50 hover:bg-slate-700/50 p-2 rounded-md text-slate-300">
                                        {idea}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="platform" className="block text-sm font-medium text-slate-300 mb-1">المنصة</label>
                        <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500">
                            {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tone" className="block text-sm font-medium text-slate-300 mb-1">نبرة الصوت</label>
                        <select id="tone" value={tone} onChange={(e) => setTone(e.target.value as ToneOfVoice)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500">
                            {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="count" className="block text-sm font-medium text-slate-300 mb-1">عدد البوستات</label>
                        <input
                            type="number"
                            id="count"
                            value={count}
                            onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 0)))}
                            min="1"
                            max="20"
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                    <div className="flex-grow"></div>
                    <button type="submit" disabled={isLoading} className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-md inline-flex items-center justify-center transition-colors">
                        {isLoading ? <SpinnerIcon className="animate-spin w-5 h-5 me-2" /> : <SparklesIcon className="w-5 h-5 me-2" />}
                        {isLoading ? 'جاري التوليد...' : 'توليد المحتوى'}
                    </button>
                </form>

                {/* Results Section */}
                <div className="w-full md:w-3/5 lg:w-2/3 p-6 overflow-y-auto bg-slate-900/50">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <SpinnerIcon className="animate-spin w-10 h-10 mb-4" />
                            <p className="text-lg">يقوم الذكاء الاصطناعي بالكتابة...</p>
                            <p className="text-sm">قد يستغرق هذا بضع لحظات</p>
                        </div>
                    )}
                    {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md text-right">{error}</div>}
                    
                    {!isLoading && generatedPosts.length === 0 && !error && (
                         <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <SparklesIcon className="w-12 h-12 mb-4"/>
                            <h3 className="text-xl font-semibold">جاهز للإبداع؟</h3>
                            <p>املأ النموذج على اليمين لتوليد المحتوى</p>
                        </div>
                    )}

                    {generatedPosts.length > 0 && (
                        <div className="space-y-4">
                            {generatedPosts.map(post => 
                                <PostCard 
                                    key={post.id} 
                                    post={post} 
                                    brand={brand}
                                    onUpdatePost={(updates) => handlePostUpdate(post.id, updates)} 
                                />
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};