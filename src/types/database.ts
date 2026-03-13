export interface Shop {
  id: string;
  user_id: string;
  name: string;
  description: string;
  address: string;
  business_hours: string;
  closed_days: string;
  menu_type: string;
  atmosphere: string;
  tone: string;
  has_takeout: boolean;
  hashtag_policy: string;
  created_at: string;
  updated_at: string;
}

export interface PostGeneration {
  id: string;
  shop_id: string;
  theme: string;
  menu_item: string;
  supplement: string;
  photo_url: string | null;
  platform: string;
  output_1: string;
  output_2: string;
  output_3: string;
  story_text: string;
  line_text: string;
  hashtags: string;
  is_favorite: boolean;
  created_at: string;
}

export interface ReviewReply {
  id: string;
  shop_id: string;
  review_text: string;
  star_rating: number;
  reply_tone: string;
  reply_1: string;
  reply_2: string;
  reply_3: string;
  is_favorite: boolean;
  created_at: string;
}

export type Platform = "instagram" | "story" | "line" | "all";
export type ToneStyle = "polite" | "friendly" | "stylish" | "simple";
export type ReplyTone = "grateful" | "apologetic" | "neutral";
