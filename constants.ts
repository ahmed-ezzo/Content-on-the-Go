
import { Platform, ToneOfVoice, ContentType, Dialect, CampaignGoal } from './types';

export const PLATFORMS = [
  { value: Platform.Facebook, label: 'فيسبوك' },
  { value: Platform.Instagram, label: 'انستجرام' },
  { value: Platform.TikTok, label: 'تيك توك' },
  { value: Platform.X, label: 'X (تويتر سابقًا)' },
  { value: Platform.LinkedIn, label: 'لينكد إن' },
];

export const TONES = [
  { value: ToneOfVoice.Professional, label: 'احترافي' },
  { value: ToneOfVoice.Friendly, label: 'ودي' },
  { value: ToneOfVoice.Funny, label: 'مرح' },
  { value: ToneOfVoice.Bold, label: 'جريء' },
  { value: ToneOfVoice.Inspirational, label: 'ملهم' },
];

export const CONTENT_TYPES = [
    { value: ContentType.SocialPost, label: 'بوست سوشيال ميديا' },
    { value: ContentType.VideoScript, label: 'سكربت فيديو' },
    { value: ContentType.Article, label: 'مقال / مدونة' },
];

export const DIALECTS = [
    { value: Dialect.Egyptian, label: '🇪🇬 العربية (مصرى)' },
    { value: Dialect.Gulf, label: '🇸🇦 العربية (خليجي)' },
    { value: Dialect.English, label: '🇬🇧 English' },
];

export const CAMPAIGN_GOALS = [
    { value: CampaignGoal.ProductLaunch, label: 'إطلاق منتج جديد', description: "حملة تشويقية، إعلان، ومتابعة لإطلاق منتج أو خدمة جديدة." },
    { value: CampaignGoal.BrandAwareness, label: 'زيادة الوعي بالعلامة التجارية', description: "محتوى يركز على قصة العلامة التجارية وقيمها للوصول لجمهور جديد." },
    { value: CampaignGoal.SpecialOffer, label: 'عرض خاص / ترويج', description: "سلسلة من المنشورات للترويج لخصم، عرض، أو فعالية محدودة الوقت." },
    { value: CampaignGoal.CommunityEngagement, label: 'تفاعل مجتمعي', description: "محتوى مصمم لتشجيع المتابعين على المشاركة، التعليق، ومشاركة المحتوى." },
];
