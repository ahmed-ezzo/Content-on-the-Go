import React, { useState, useEffect } from 'react';
import { Brand, BrandIdentity } from '../types';
import { IdentityIcon } from './icons';

interface BrandIdentityModalProps {
    brand: Brand;
    onClose: () => void;
    onSave: (brandId: string, identity: BrandIdentity) => void;
}

const TagInput: React.FC<{
    tags: string[];
    setTags: (tags: string[]) => void;
    placeholder: string;
}> = ({ tags, setTags, placeholder }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            if (!tags.includes(inputValue.trim())) {
                setTags([...tags, inputValue.trim()]);
            }
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                    <div key={tag} className="flex items-center bg-slate-700 text-slate-200 px-3 py-1 rounded-full text-sm">
                        <span>{tag}</span>
                        <button type="button" onClick={() => removeTag(tag)} className="ms-2 text-slate-400 hover:text-white">
                            &times;
                        </button>
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
            />
        </div>
    );
};


export const BrandIdentityModal: React.FC<BrandIdentityModalProps> = ({ brand, onClose, onSave }) => {
    const [identity, setIdentity] = useState<BrandIdentity>(brand.identity || {});
    
    useEffect(() => {
        // Ensure the identity object has all nested properties to avoid uncontrolled component errors
        setIdentity(currentIdentity => ({
            audiencePersona: currentIdentity.audiencePersona || '',
            contentPillars: currentIdentity.contentPillars || [],
            brandLexicon: {
                keywordsToUse: currentIdentity.brandLexicon?.keywordsToUse || [],
                keywordsToAvoid: currentIdentity.brandLexicon?.keywordsToAvoid || [],
            },
            successExamples: currentIdentity.successExamples || [],
        }));
    }, [brand]);


    const handleSave = () => {
        onSave(brand.id, identity);
    };
    
    const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'contentPillars' || name === 'successExamples') {
             setIdentity(prev => ({ ...prev, [name]: value.split('\n').filter(Boolean) }));
        } else {
            setIdentity(prev => ({ ...prev, [name]: value }));
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <IdentityIcon className="w-7 h-7 text-cyan-400" />
                        ملف الهوية الذكي لـ <span className="text-cyan-400">{brand.name}</span>
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>

                <div className="flex-grow p-6 overflow-y-auto space-y-6">
                    <div>
                        <label htmlFor="audiencePersona" className="block text-lg font-semibold text-slate-200 mb-2">شخصية الجمهور المستهدف</label>
                        <p className="text-sm text-slate-400 mb-2">من هو عميلك المثالي؟ صفه بالتفصيل (عمره، اهتماماته، مشاكله، أهدافه).</p>
                        <textarea
                            id="audiencePersona"
                            name="audiencePersona"
                            value={identity.audiencePersona}
                            onChange={handleTextAreaChange}
                            rows={4}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="مثال: شباب في السعودية، أعمارهم 20-30، مهتمون بالجمال الطبيعي والاستدامة..."
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="contentPillars" className="block text-lg font-semibold text-slate-200 mb-2">أعمدة المحتوى الرئيسية</label>
                         <p className="text-sm text-slate-400 mb-2">ما هي 3-5 مواضيع أساسية تدور حولها علامتك التجارية؟ (كل موضوع في سطر جديد)</p>
                        <textarea
                            id="contentPillars"
                            name="contentPillars"
                            value={(identity.contentPillars || []).join('\n')}
                            onChange={handleTextAreaChange}
                            rows={4}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="الجودة والخبرة&#10;قصص المزارعين&#10;المجتمع واللقاءات"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-lg font-semibold text-slate-200 mb-2">كلمات يجب استخدامها</label>
                             <p className="text-sm text-slate-400 mb-2">كلمات تعكس هوية علامتك. (اضغط Enter للإضافة)</p>
                            <TagInput
                                tags={identity.brandLexicon?.keywordsToUse || []}
                                setTags={(tags) => setIdentity(prev => ({...prev, brandLexicon: {...prev.brandLexicon, keywordsToUse: tags}}))}
                                placeholder="مثال: أصيل، صُنع بحب..."
                            />
                        </div>
                        <div>
                            <label className="block text-lg font-semibold text-slate-200 mb-2">كلمات يجب تجنبها</label>
                             <p className="text-sm text-slate-400 mb-2">كلمات تتعارض مع هوية علامتك. (اضغط Enter للإضافة)</p>
                            <TagInput
                                tags={identity.brandLexicon?.keywordsToAvoid || []}
                                setTags={(tags) => setIdentity(prev => ({...prev, brandLexicon: {...prev.brandLexicon, keywordsToAvoid: tags}}))}
                                placeholder="مثال: رخيص، سريع..."
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="successExamples" className="block text-lg font-semibold text-slate-200 mb-2">أمثلة على محتوى ناجح</label>
                         <p className="text-sm text-slate-400 mb-2">الصق نصوصًا لمنشورات ناجحة (لك أو لمنافسين) ليتعلم منها الذكاء الاصطناعي. (كل مثال في سطر جديد)</p>
                        <textarea
                            id="successExamples"
                            name="successExamples"
                            value={(identity.successExamples || []).join('\n')}
                            onChange={handleTextAreaChange}
                            rows={5}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="قهوتنا مش مجرد مشروب، هي بداية يومك الصح.&#10;لكل كوب حكاية، تبدأ من مزارعنا وتنتهي بين يديك."
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-700 flex justify-end">
                    <button 
                        onClick={handleSave} 
                        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md transition-colors"
                    >
                        حفظ الهوية
                    </button>
                </div>
            </div>
        </div>
    );
};
