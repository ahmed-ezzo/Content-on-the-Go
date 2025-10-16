import React, { useState, useEffect } from 'react';
import { Brand, Post, Dialect, BrandIdentity } from './types';
import { BrandCard } from './components/BrandCard';
import { GeneratorPage } from './components/GeneratorModal';
import { HistoryModal } from './components/HistoryModal';
import { CampaignModal } from './components/CampaignModal';
import { BrandIdentityModal } from './components/BrandIdentityModal';
import { SparklesIcon, CampaignIcon } from './components/icons';
import { DIALECTS } from './constants';

const BrandForm: React.FC<{ onAddBrand: (name: string, description: string, dialect: Dialect) => void, onCancel: () => void }> = ({ onAddBrand, onCancel }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [dialect, setDialect] = useState<Dialect>(Dialect.Egyptian);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && description.trim()) {
            onAddBrand(name.trim(), description.trim(), dialect);
            setName('');
            setDescription('');
        }
    };

    return (
        <div className="bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-cyan-400">إضافة علامة تجارية جديدة</h3>
                <div>
                    <label htmlFor="brandName" className="block text-sm font-medium text-slate-300 mb-1">اسم العلامة التجارية</label>
                    <input type="text" id="brandName" value={name} onChange={(e) => setName(e.target.value)} required
                           className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500" />
                </div>
                <div>
                    <label htmlFor="brandDesc" className="block text-sm font-medium text-slate-300 mb-1">وصف العلامة التجارية</label>
                    <textarea id="brandDesc" value={description} onChange={(e) => setDescription(e.target.value)} required rows={3}
                              className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
                              placeholder="مثال: مقهى مختص يركز على حبوب البن من مصادر أخلاقية وأجواء مريحة."></textarea>
                </div>
                <div>
                    <label htmlFor="dialect" className="block text-sm font-medium text-slate-300 mb-1">اللغة / اللهجة</label>
                    <select id="dialect" value={dialect} onChange={(e) => setDialect(e.target.value as Dialect)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500">
                         {DIALECTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                </div>
                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={onCancel} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-md transition-colors">إلغاء</button>
                    <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-colors">إضافة علامة تجارية</button>
                </div>
            </form>
        </div>
    );
};

const App: React.FC = () => {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isAddingBrand, setIsAddingBrand] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [viewingHistoryBrand, setViewingHistoryBrand] = useState<Brand | null>(null);
    const [editingIdentityBrand, setEditingIdentityBrand] = useState<Brand | null>(null);
    const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

    useEffect(() => {
        try {
            const savedBrands = localStorage.getItem('socialpost_ai_brands');
            if (savedBrands) {
                const parsedBrands: Brand[] = JSON.parse(savedBrands);
                // Simple migration for brands without dialect or posts array
                const migratedBrands = parsedBrands.map(b => ({
                    ...b,
                    dialect: b.dialect || Dialect.Egyptian,
                    posts: b.posts || [],
                    identity: b.identity || {},
                }));
                setBrands(migratedBrands);
            }
        } catch (error) {
            console.error("Failed to load brands from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('socialpost_ai_brands', JSON.stringify(brands));
        } catch (error) {
            console.error("Failed to save brands to localStorage", error);
        }
    }, [brands]);

    const handleAddBrand = (name: string, description: string, dialect: Dialect) => {
        const newBrand: Brand = { 
            id: Date.now().toString(), 
            name, 
            description, 
            dialect, 
            posts: [],
            identity: { // Initialize with empty identity
                audiencePersona: '',
                contentPillars: [],
                brandLexicon: {
                    keywordsToUse: [],
                    keywordsToAvoid: [],
                },
                successExamples: [],
            },
        };
        setBrands(prevBrands => [...prevBrands, newBrand]);
        setIsAddingBrand(false);
    };
    
    const handleDeleteBrand = (brandId: string) => {
        setBrands(prevBrands => prevBrands.filter(b => b.id !== brandId));
    };

    const handlePostsGenerated = (newPosts: Post[]) => {
        if (!selectedBrand) return;

        setBrands(prevBrands => {
            return prevBrands.map(brand => {
                if (brand.id === selectedBrand.id) {
                    const existingPosts = brand.posts || [];
                    return { ...brand, posts: [...newPosts, ...existingPosts] };
                }
                return brand;
            });
        });
    };
    
    const handleCampaignGenerated = (brandId: string, campaignPosts: Post[]) => {
        setBrands(prevBrands => {
            return prevBrands.map(brand => {
                if (brand.id === brandId) {
                    const existingPosts = brand.posts || [];
                    return { ...brand, posts: [...campaignPosts, ...existingPosts] };
                }
                return brand;
            });
        });
        setIsCreatingCampaign(false);
    };

    const handleUpdatePost = (brandId: string, postId: string, updates: Partial<Post>) => {
        setBrands(prevBrands =>
            prevBrands.map(brand => {
                if (brand.id === brandId) {
                    const updatedPosts = (brand.posts || []).map(p =>
                        p.id === postId ? { ...p, ...updates } : p
                    );
                    return { ...brand, posts: updatedPosts };
                }
                return brand;
            })
        );
    };

    const handleSaveBrandIdentity = (brandId: string, identity: BrandIdentity) => {
        setBrands(prevBrands => 
            prevBrands.map(brand => 
                brand.id === brandId ? { ...brand, identity } : brand
            )
        );
        setEditingIdentityBrand(null);
    };

    const currentSelectedBrand = brands.find(b => b.id === selectedBrand?.id);
    const currentViewingHistoryBrand = brands.find(b => b.id === viewingHistoryBrand?.id);
    const currentEditingIdentityBrand = brands.find(b => b.id === editingIdentityBrand?.id);

    if (currentSelectedBrand) {
        return (
            <GeneratorPage 
                brand={currentSelectedBrand} 
                onBack={() => setSelectedBrand(null)} 
                onPostsGenerated={handlePostsGenerated}
                onUpdatePost={(postId, updates) => handleUpdatePost(currentSelectedBrand.id, postId, updates)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 text-white p-4 sm:p-8">
            <header className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight inline-flex items-center">
                    <SparklesIcon className="w-10 h-10 ms-3 text-cyan-400" />
                    كونتنت علي الماشي
                </h1>
                <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
                    مساعدك الذكي الشخصي لصياغة محتوى جذاب لوسائل التواصل الاجتماعي.
                </p>
            </header>

            <main className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold">علاماتك التجارية</h2>
                     <div className="flex gap-3">
                        <button onClick={() => setIsCreatingCampaign(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors inline-flex items-center gap-2">
                            <CampaignIcon className="w-5 h-5"/>
                            إنشاء حملة
                        </button>
                        {!isAddingBrand && (
                            <button onClick={() => setIsAddingBrand(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                + إضافة علامة تجارية
                            </button>
                        )}
                    </div>
                </div>

                {isAddingBrand && <BrandForm onAddBrand={handleAddBrand} onCancel={() => setIsAddingBrand(false)} />}
                
                {brands.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {brands.map(brand => (
                            <BrandCard 
                                key={brand.id} 
                                brand={brand} 
                                onGenerateClick={setSelectedBrand} 
                                onDelete={handleDeleteBrand}
                                onViewHistory={setViewingHistoryBrand}
                                onEditIdentity={setEditingIdentityBrand}
                            />
                        ))}
                    </div>
                ) : (
                    !isAddingBrand && !isCreatingCampaign &&(
                    <div className="text-center py-16 px-6 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
                        <h3 className="text-xl font-semibold text-slate-300">لا توجد علامات تجارية بعد!</h3>
                        <p className="text-slate-400 mt-2">انقر على 'إضافة علامة تجارية جديدة' للبدء وتوليد أول دفعة من المحتوى.</p>
                    </div>
                    )
                )}

            </main>
            
            <footer className="text-center mt-12 py-6 border-t border-slate-800">
                <p className="text-sm text-slate-500">
                    تم تطويره من قبل <a href="https://www.facebook.com/briefdesign1" target="_blank" rel="noopener noreferrer" className="font-semibold text-cyan-400 hover:underline">Ahmed Abo Al Ezz</a>
                </p>
            </footer>

            {currentViewingHistoryBrand && (
                <HistoryModal 
                    brand={currentViewingHistoryBrand}
                    onClose={() => setViewingHistoryBrand(null)}
                    onUpdatePost={(postId, updates) => handleUpdatePost(currentViewingHistoryBrand.id, postId, updates)}
                />
            )}

            {currentEditingIdentityBrand && (
                <BrandIdentityModal
                    brand={currentEditingIdentityBrand}
                    onClose={() => setEditingIdentityBrand(null)}
                    onSave={handleSaveBrandIdentity}
                />
            )}
            
            {isCreatingCampaign && (
                <CampaignModal
                    brands={brands}
                    onClose={() => setIsCreatingCampaign(false)}
                    onCampaignGenerated={handleCampaignGenerated}
                    onUpdatePost={handleUpdatePost}
                />
            )}

        </div>
    );
};

export default App;
