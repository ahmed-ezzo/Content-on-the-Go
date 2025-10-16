export enum Platform {
  Facebook = 'Facebook',
  Instagram = 'Instagram',
  TikTok = 'TikTok',
  X = 'X (formerly Twitter)',
  LinkedIn = 'LinkedIn',
}

export enum ToneOfVoice {
  Professional = 'Professional',
  Friendly = 'Friendly',
  Funny = 'Funny',
  Bold = 'Bold',
  Inspirational = 'Inspirational',
}

export enum ContentType {
    SocialPost = 'Social Post',
    VideoScript = 'Video Script',
    Article = 'Article',
}

export enum Dialect {
  Egyptian = 'Egyptian Arabic',
  Gulf = 'Gulf Arabic',
  English = 'English',
}

export enum RefinementAction {
  Rephrase = 'rephrase',
  Shorten = 'shorten',
  Lengthen = 'lengthen',
  ChangeTone = 'changeTone',
}

export enum CampaignGoal {
  ProductLaunch = 'Product Launch',
  BrandAwareness = 'Brand Awareness',
  SpecialOffer = 'Special Offer / Promotion',
  CommunityEngagement = 'Community Engagement',
}

export interface VisualInspiration {
  description: string;
  colorPalette: string[];
  imagePrompt: string;
}

export interface BrandIdentity {
  audiencePersona?: string;
  contentPillars?: string[];
  brandLexicon?: {
    keywordsToUse?: string[];
    keywordsToAvoid?: string[];
  };
  successExamples?: string[];
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  dialect: Dialect;
  identity?: BrandIdentity;
  posts?: Post[];
}

export interface Post {
  id: string;
  text: string;
  tovPhrase: string;
  dateGenerated: string; // ISO String
  platform: Platform;
  contentType: ContentType;
  topic: string;
  hashtags?: string[];
  visualInspiration?: VisualInspiration;
  campaignTheme?: string;
  dayInCampaign?: number;
}
