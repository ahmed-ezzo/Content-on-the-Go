import { GoogleGenAI, Type } from "@google/genai";
import { Platform, ToneOfVoice, ContentType, Dialect, RefinementAction, CampaignGoal, Brand } from '../types';
import { CAMPAIGN_GOALS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const platformGuidelines = {
    [Platform.Facebook]: "ركز على إشراك المجتمع، وطرح الأسئلة، ورواية القصص. استخدم نبرة ودودة ومرحبة.",
    [Platform.Instagram]: "اصنع تعليقات مرئية جذابة. استخدم الهاشتاجات ذات الصلة ونبرة حوارية. يُشجع استخدام الإيموجي.",
    [Platform.TikTok]: "تعليقات قصيرة، قوية، ومركزة على الترندات. استلهم من الأصوات والهاشتاجات الرائجة. حافظ على طابع ممتع وحيوي.",
    [Platform.X]: "رسائل موجزة ومؤثرة. مثالية للأخبار، التحديثات السريعة، والمشاركة في الحوارات. استخدم الهاشتاجات لزيادة الظهور.",
    [Platform.LinkedIn]: "محتوى احترافي ومرتبط بالمجال. شارك رؤى، أخبار الشركة، وقيادة فكرية. حافظ على نبرة رسمية وموثوقة."
};

const getLanguageAndDialect = (dialect: Dialect) => {
    return dialect === Dialect.English ? 'الإنجليزية' : `العربية (${dialect === Dialect.Egyptian ? 'المصرية' : 'الخليجية'})`;
};

const buildBrandIdentityPrompt = (brand: Brand): string => {
    if (!brand.identity) return '';

    let identityPrompt = "\n\n**ملف هوية العلامة التجارية الاستراتيجي (تحليل عميق):**\n";
    identityPrompt += "استخدم هذا الملف كمرجع أساسي ودقيق لكل كلمة تكتبها. يجب أن يكون المحتوى متوافقًا تمامًا مع هذه الهوية.\n";

    if (brand.identity.audiencePersona) {
        identityPrompt += `- **شخصية الجمهور المستهدف:** ${brand.identity.audiencePersona}\n`;
    }
    if (brand.identity.contentPillars && brand.identity.contentPillars.length > 0) {
        identityPrompt += `- **أعمدة المحتوى الرئيسية:** ${brand.identity.contentPillars.join(', ')}\n`;
    }
    if (brand.identity.brandLexicon) {
        if (brand.identity.brandLexicon.keywordsToUse && brand.identity.brandLexicon.keywordsToUse.length > 0) {
            identityPrompt += `- **كلمات يجب استخدامها (لتعزيز الهوية):** ${brand.identity.brandLexicon.keywordsToUse.join(', ')}\n`;
        }
        if (brand.identity.brandLexicon.keywordsToAvoid && brand.identity.brandLexicon.keywordsToAvoid.length > 0) {
            identityPrompt += `- **كلمات يجب تجنبها (للحفاظ على الهوية):** ${brand.identity.brandLexicon.keywordsToAvoid.join(', ')}\n`;
        }
    }
    if (brand.identity.successExamples && brand.identity.successExamples.length > 0) {
        identityPrompt += `- **تحليل أمثلة ناجحة (تعلم من هذا الأسلوب):**\n${brand.identity.successExamples.map(ex => `  - "${ex}"`).join('\n')}\n`;
    }
    return identityPrompt;
};


const parseJsonResponse = (apiResponseText?: string) => {
    if (!apiResponseText) {
        throw new Error("API returned an empty response.");
    }
    let jsonText = apiResponseText.trim();
    const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        jsonText = match[1];
    }
    return JSON.parse(jsonText);
};

interface GeneratedPost {
    text: string;
    tov_phrase: string;
    visual_inspiration: {
        description: string;
        color_palette: string[];
        image_prompt: string;
    };
}

interface GeneratedCampaignPost extends GeneratedPost {
    day: number;
    theme: string;
}

export const generateSocialPosts = async (
    brand: Brand,
    platform: Platform,
    tone: ToneOfVoice,
    postCount: number,
    contentType: ContentType,
    topic: string,
): Promise<GeneratedPost[]> => {
    const languageAndDialect = getLanguageAndDialect(brand.dialect);
    const identityPrompt = buildBrandIdentityPrompt(brand);

    const prompt = `
        أنت خبير استراتيجي في تسويق المحتوى الرقمي ومتخصص في الفنون البصرية، مهمتك هي إنشاء ${postCount} قطعة محتوى متكاملة (نص + إلهام بصري) لعلامة تجارية.

        **تفاصيل العلامة التجارية:**
        - **الوصف:** ${brand.description}
        ${identityPrompt}

        **تفاصيل المهمة:**
        - **المنصة المستهدفة:** ${platform}
        - **نبرة الصوت المطلوبة:** ${tone}
        - **نوع المحتوى المطلوب:** ${contentType}
        - **الموضوع المحدد:** ${topic}
        - **اللغة/اللهجة:** ${languageAndDialect}

        **إرشادات خاصة بالمنصة:**
        ${platformGuidelines[platform]}

        **المهمة:**
        لكل قطعة محتوى من الـ ${postCount} قطعة، قم بإنشاء ما يلي بدقة فائقة بناءً على ملف هوية العلامة التجارية:
        1.  **نص المحتوى (text):** نص كامل، إبداعي، وجذاب. قم بتضمين هاشتاجات ذات صلة إذا كانت مناسبة للمنصة.
        2.  **عبارة تصميم لنبرة الصوت (tov_phrase):** جملة قصيرة جدًا للمصمم لاستخدامها في التصميم (مثال: "الجودة في كل كوب").
        3.  **الإلهام البصري (visual_inspiration):** كائن يحتوي على ثلاثة عناصر لمساعدة المصمم:
            *   **description:** وصف تفصيلي ومبتكر للصورة أو الفيديو الذي يتناسب مع النص والهوية. كن محددًا جدًا حول العناصر، الإضاءة، والزاوية. (مثال: "صورة مقربة لقطرات الندى على حبة بن طازجة، مع إضاءة صباحية دافئة تعكس جودة المنتج").
            *   **color_palette:** مصفوفة من 3-4 أكواد ألوان HEX مقترحة تتناسب مع روح التصميم والهوية. (مثال: ["#6F4E37", "#D2B48C", "#F5F5DC"]).
            *   **image_prompt:** موجه (prompt) احترافي جاهز للاستخدام في أدوات توليد الصور بالذكاء الاصطناعي مثل Midjourney أو DALL-E. يجب أن يكون باللغة الإنجليزية، مفصلاً، وتقنياً. (مثال: "macro shot of a single roasted coffee bean with morning dew, warm morning light, cinematic, photorealistic, bokeh background --ar 16:9 --style raw").

        تأكد من أن جميع النصوص (باستثناء image_prompt) باللغة/اللهجة المحددة: ${languageAndDialect}.
        يجب أن يكون الناتج الخاص بك كائن JSON صالحًا تمامًا.
    `;

    let apiResponseText: string | undefined;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        posts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    text: {
                                        type: Type.STRING,
                                        description: "النص الكامل للمحتوى.",
                                    },
                                    tov_phrase: {
                                        type: Type.STRING,
                                        description: "عبارة تصميم قصيرة.",
                                    },
                                    visual_inspiration: {
                                        type: Type.OBJECT,
                                        properties: {
                                            description: { type: Type.STRING, description: "وصف الصورة/الفيديو المقترح." },
                                            color_palette: { type: Type.ARRAY, items: { type: Type.STRING }, description: "مصفوفة من أكواد الألوان HEX." },
                                            image_prompt: { type: Type.STRING, description: "موجه توليد الصور باللغة الإنجليزية." }
                                        },
                                        required: ["description", "color_palette", "image_prompt"]
                                    }
                                },
                                required: ["text", "tov_phrase", "visual_inspiration"],
                            },
                        },
                    },
                    required: ["posts"],
                },
            },
        });
        
        apiResponseText = response.text;
        const parsedJson = parseJsonResponse(apiResponseText);

        if (parsedJson && Array.isArray(parsedJson.posts)) {
            return parsedJson.posts;
        } else {
            throw new Error("Invalid JSON structure received from API.");
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof SyntaxError) {
             console.error("Failed to parse JSON response:", apiResponseText);
             throw new Error("أرجع الذكاء الاصطناعي استجابة غير متوقعة. يرجى محاولة التوليد مرة أخرى.");
        }
        throw new Error("فشل في توليد المحتوى. قد يكون النموذج قد أرجع خطأ أو فشل طلب الشبكة.");
    }
};

export const generateCampaign = async (
    brand: Brand,
    goal: CampaignGoal,
    duration: number,
    topic: string,
    platform: Platform,
    tone: ToneOfVoice,
): Promise<GeneratedCampaignPost[]> => {
    const languageAndDialect = getLanguageAndDialect(brand.dialect);
    const goalDescription = CAMPAIGN_GOALS.find(g => g.value === goal)?.description || '';
    const identityPrompt = buildBrandIdentityPrompt(brand);

    const prompt = `
        أنت خبير استراتيجي في تسويق الحملات الإعلانية ومدير إبداعي. مهمتك هي إنشاء خطة محتوى متكاملة لحملة تسويقية لعلامة تجارية بناءً على هدف محدد وهوية استراتيجية.

        **تفاصيل العلامة التجارية:**
        - **الوصف:** ${brand.description}
        ${identityPrompt}

        **تفاصيل الحملة:**
        - **الهدف:** ${goal} (${goalDescription})
        - **المدة:** ${duration} أيام
        - **الموضوع/الموجز:** ${topic}
        - **المنصة الأساسية:** ${platform}
        - **النبرة العامة للحملة:** ${tone}
        - **اللغة/اللهجة:** ${languageAndDialect}

        **المهمة:**
        قم بتوليد خطة محتوى متماسكة، يومًا بيوم، لحملة تستمر ${duration} يومًا. لكل يوم، قدم منشورًا كاملاً يتضمن نصًا وإلهامًا بصريًا. يجب أن تبني المنشورات على بعضها البعض لتحقيق هدف الحملة وأن تلتزم تمامًا بملف هوية العلامة التجارية.

        لكل يوم، قم بإنشاء كائن واحد بالبنية التالية:
        1.  **day (number):** رقم اليوم في الحملة (مثال: 1, 2, 3...).
        2.  **theme (string):** "ثيم" أو عنوان قصير لمنشور اليوم (مثال: "تشويق", "الكشف الكبير", "شهادة عميل").
        3.  **text (string):** النص الكامل، الإبداعي، والجذاب للمنشور. قم بتضمين هاشتاجات ذات صلة.
        4.  **tov_phrase (string):** جملة قصيرة جدًا للمصمم لاستخدامها في التصميم المرئي.
        5.  **visual_inspiration (object):** كائن يحتوي على ثلاثة عناصر لتوجيه المصمم:
            *   **description (string):** وصف تفصيلي ومبتكر للصورة أو الفيديو.
            *   **color_palette (array of strings):** مصفوفة من 3-4 أكواد ألوان HEX مقترحة.
            *   **image_prompt (string):** موجه احترافي، مفصل، وتقني باللغة الإنجليزية لأدوات توليد الصور بالذكاء الاصطناعي.

        تأكد من أن جميع النصوص (باستثناء image_prompt) باللغة/اللهجة المحددة: ${languageAndDialect}.
        الناتج النهائي يجب أن يكون كائن JSON صالحًا تمامًا.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        campaignPosts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    day: { type: Type.NUMBER },
                                    theme: { type: Type.STRING },
                                    text: { type: Type.STRING },
                                    tov_phrase: { type: Type.STRING },
                                    visual_inspiration: {
                                        type: Type.OBJECT,
                                        properties: {
                                            description: { type: Type.STRING },
                                            color_palette: { type: Type.ARRAY, items: { type: Type.STRING } },
                                            image_prompt: { type: Type.STRING }
                                        },
                                        required: ["description", "color_palette", "image_prompt"]
                                    }
                                },
                                required: ["day", "theme", "text", "tov_phrase", "visual_inspiration"]
                            }
                        }
                    },
                    required: ["campaignPosts"]
                }
            }
        });
        const parsedJson = parseJsonResponse(response.text);
        if (parsedJson && Array.isArray(parsedJson.campaignPosts)) {
            return parsedJson.campaignPosts;
        }
        throw new Error("Invalid structure for campaign posts.");
    } catch (error) {
        console.error("Error generating campaign:", error);
        throw new Error("فشل في توليد الحملة.");
    }
};

export const generateTopicIdeas = async (brandDescription: string, dialect: Dialect): Promise<string[]> => {
    const languageAndDialect = getLanguageAndDialect(dialect);
    const prompt = `
        بناءً على وصف العلامة التجارية التالي، اقترح 5 أفكار مواضيع إبداعية للمحتوى.
        **الوصف:** "${brandDescription}"
        **اللغة المطلوبة:** ${languageAndDialect}
        يجب أن تكون الأفكار موجزة ومناسبة لوسائل التواصل الاجتماعي.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ideas: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["ideas"]
                }
            }
        });
        const parsedJson = parseJsonResponse(response.text);
        if (parsedJson && Array.isArray(parsedJson.ideas)) {
            return parsedJson.ideas;
        }
        throw new Error("Invalid structure for topic ideas.");
    } catch (error) {
        console.error("Error generating topic ideas:", error);
        throw new Error("فشل في توليد أفكار المواضيع.");
    }
};

export const refinePost = async (
    postText: string,
    action: RefinementAction,
    dialect: Dialect,
    tone?: ToneOfVoice
): Promise<string> => {
    const languageAndDialect = getLanguageAndDialect(dialect);
    let actionInstruction = "";
    switch (action) {
        case RefinementAction.Rephrase:
            actionInstruction = "أعد صياغة هذا البوست بأسلوب مختلف مع الحفاظ على الرسالة الأساسية.";
            break;
        case RefinementAction.Shorten:
            actionInstruction = "اجعل هذا البوست أقصر وأكثر إيجازًا، ومناسبًا لمنصة مثل X/Twitter.";
            break;
        case RefinementAction.Lengthen:
            actionInstruction = "قم بإطالة هذا البوست، وأضف المزيد من التفاصيل أو سياقًا أوسع.";
            break;

        case RefinementAction.ChangeTone:
            actionInstruction = `غيّر نبرة هذا البوست إلى ${tone}.`;
            break;
    }

    const prompt = `
        **المهمة:** ${actionInstruction}
        **النص الأصلي:** "${postText}"
        **اللغة/اللهجة المطلوبة:** ${languageAndDialect}
        قم بإرجاع النص المعدل فقط.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error(`Error refining post (action: ${action}):`, error);
        throw new Error("فشل في تحسين النص.");
    }
};

export const generateHashtags = async (postText: string, dialect: Dialect): Promise<string[]> => {
    const languageAndDialect = getLanguageAndDialect(dialect);
    const prompt = `
        بناءً على نص البوست التالي، اقترح 5 هاشتاجات ذات صلة ومناسبة.
        **نص البوست:** "${postText}"
        **اللغة/اللهجة المطلوبة:** ${languageAndDialect}
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hashtags: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING, description: "Hashtag starting with #" }
                        }
                    },
                    required: ["hashtags"]
                }
            }
        });
        const parsedJson = parseJsonResponse(response.text);
        if (parsedJson && Array.isArray(parsedJson.hashtags)) {
            return parsedJson.hashtags;
        }
        throw new Error("Invalid structure for hashtags.");
    } catch (error) {
        console.error("Error generating hashtags:", error);
        throw new Error("فشل في توليد الهاشتاجات.");
    }
};

export const generateTovPhrase = async (postText: string, brandDescription: string, dialect: Dialect): Promise<string> => {
    const languageAndDialect = getLanguageAndDialect(dialect);
    const prompt = `
        أنت مدير إبداعي. بناءً على نص المنشور التالي ووصف العلامة التجارية، قم بتوليد عبارة واحدة موجزة وملهمة (3-5 كلمات) ليستخدمها مصمم الجرافيك في التصميم.
        هذه العبارة تسمى "عبارة تصميم لنبرة الصوت".
        
        **وصف العلامة التجارية:** "${brandDescription}"
        **نص المنشور:** "${postText}"
        
        **اللغة المطلوبة:** ${languageAndDialect}
        
        قم بإرجاع العبارة فقط كنص خام بدون أي تنسيق إضافي أو علامات اقتباس.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                maxOutputTokens: 20,
                thinkingConfig: { thinkingBudget: 0 },
            }
        });
        return response.text.replace(/"/g, '').trim();
    } catch (error) {
        console.error("Error generating TOV phrase:", error);
        throw new Error("فشل في توليد عبارة التصميم.");
    }
};
