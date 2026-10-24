import { createClient } from '@supabase/supabase-js';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined };

type DataRow = {
  [key: string]: Json | undefined;
  id: string;
  user_id?: string;
  balance?: number;
  plan?: string;
  history?: Array<{ change: number; reason: string; date: string }>;
  source_type?: string;
  source_label?: string;
  source_url?: string;
  status?: string;
  progress?: number;
  score?: number | null;
  summary?: string | null;
  thumbnail_url?: string | null;
  title_suggestions?: Array<{ title: string; recommended: boolean; reason: string }>;
  improvements?: Array<{ key: string; title: string; description: string }>;
  duration_seconds?: number | null;
  youtube_stats?: { [key: string]: Json | undefined } | null;
  error_message?: string | null;
  created_date?: string;
  updated_date?: string;
  singleton?: boolean;
  brand_name?: string;
  logo_image_url?: string;
  accent_color?: string;
  particles_style?: 'none' | 'neural';
  particle_count?: number;
  particle_size?: number;
  hero_image_url?: string;
  hero_images?: string[];
  tool_analyze_image_url?: string;
  tool_review_image_url?: string;
  before_image_url?: string;
  after_image_url?: string;
  gallery_images?: string[];
  texts?: Record<string, string>;
  credits_enabled?: boolean;
  credits_cost?: number;
  credits_upload_cost?: number;
  credits_signup?: number;
  credits_pro_price?: number;
  credits_pro_amount?: number;
};

type Table<Row> = {
  Row: Row;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

type Database = {
  public: {
    Tables: {
      analyses: Table<DataRow>;
      site_settings: Table<DataRow>;
      credit_accounts: Table<DataRow>;
      upgrade_requests: Table<DataRow>;
      profiles: Table<{
        [key: string]: unknown;
        user_id: string;
        email: string | null;
        role: 'user' | 'admin';
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      consume_credit: {
        Args: { p_analysis_id: string; p_claim_api?: boolean };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const REMEMBER_SESSION_KEY = 'cliplens-remember-session';

const authStorage = {
  async getItem(key: string) {
    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (window.localStorage.getItem(REMEMBER_SESSION_KEY) === 'false') {
      window.sessionStorage.setItem(key, value);
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, value);
    window.sessionStorage.removeItem(key);
  },
  async removeItem(key: string) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
export const supabase = createClient<Database>(
  supabaseUrl || 'https://missing-project.supabase.co',
  supabasePublishableKey || 'missing-publishable-key',
  { auth: { storage: authStorage } }
);

export function setRememberSession(remember: boolean) {
  window.localStorage.setItem(REMEMBER_SESSION_KEY, String(remember));
}

const TABLES = {
  Analysis: 'analyses',
  SiteSettings: 'site_settings',
  CreditAccount: 'credit_accounts',
  UpgradeRequest: 'upgrade_requests',
} as const;

function throwIfError(error: { message: string } | null) {
  if (error) throw error;
}

function entity(name: keyof typeof TABLES) {
  const table = TABLES[name];
  if (!table) throw new Error(`Unknown data collection: ${name}`);

  return {
    async filter(
      filters: Record<string, Json> = {},
      options: { fields?: string[]; sort?: string; limit?: number } = {}
    ) {
      let query = supabase.from(table).select('*');
      for (const [key, value] of Object.entries(filters)) {
        if (value && typeof value === 'object' && '$regex' in value) {
          query = query.ilike(key, `%${String(value.$regex).replace(/[%_]/g, '\\$&')}%`);
        } else {
          query = query.eq(key, value);
        }
      }
      if (options.sort) {
        const descending = options.sort.startsWith('-');
        query = query.order(descending ? options.sort.slice(1) : options.sort, { ascending: !descending });
      }
      if (options.limit) query = query.limit(options.limit);
      const { data, error } = await query;
      throwIfError(error);
      return { items: data || [] };
    },

    async get(id: string) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single()
      throwIfError(error);
      return data;
    },

    async create(values: Record<string, unknown>) {
      const query = name === 'SiteSettings'
        ? supabase.from(table).upsert({ ...values, singleton: true }, { onConflict: 'singleton' })
        : supabase.from(table).insert(values);
      const { data, error } = await query.select().single();
      throwIfError(error);
      return data;
    },

    async update(id: string, values: Record<string, unknown>) {
      const { data, error } = await supabase
        .from(table)
        .update(values)
        .eq('id', id)
        .select()
        .single();
      throwIfError(error);
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      throwIfError(error);
    },

    async aggregate({ groupBy = 'status', avg }: { groupBy?: string; avg?: string } = {}) {
      const { data, error } = await supabase.from(table).select('*');
      throwIfError(error);
      const groups = new Map();
      for (const row of data || []) {
        const key = String(row[groupBy] ?? '');
        const group = groups.get(key) || { [groupBy]: key, count: 0, total: 0, avg_score: null };
        group.count += 1;
        if (typeof row[avg || 'score'] === 'number') group.total += row[avg || 'score'];
        groups.set(key, group);
      }
      const rows = [...groups.values()].map((group) => ({
        ...group,
        avg_score: group.count ? group.total / group.count : null,
      }));
      return { rows };
    },

    subscribe(callback) {
      const channel = supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
        .subscribe();
      return () => { void supabase.removeChannel(channel); };
    },
  };
}

export const backend = {
  data: Object.fromEntries(
    Object.keys(TABLES).map((name) => [name, entity(name as keyof typeof TABLES)])
  ),
};

export async function invokeFunction(name, body, options: { signal?: AbortSignal } = {}) {
  if (name === 'consumeCredit') {
    const { data, error } = await supabase.rpc('consume_credit', {
      p_analysis_id: body.analysisId,
      p_claim_api: body.claimApi === true,
    });
    throwIfError(error);
    return { data };
  }
  const functionNames = {
    fetchYouTubeStats: 'fetch-youtube-stats',
    analyzeYouTubeVideo: 'analyze-youtube-video',
    generateThumbnail: 'generate-thumbnail',
    manusTaskStatus: 'manus-task-status',
    createCreditCheckout: 'create-credit-checkout',
  };
  const functionName = functionNames[name] || name;
  const { data, error } = await supabase.functions.invoke(functionName, { body, ...options });
  throwIfError(error);
  return { data };
}

export async function uploadPublicFile({ file }) {
  const extension = file.name.match(/\.[a-z0-9]{1,10}$/i)?.[0].toLowerCase() || '';
  const path = `${crypto.randomUUID()}${extension}`;
  const { error } = await supabase.storage.from('public-assets').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  throwIfError(error);
  const { data } = supabase.storage.from('public-assets').getPublicUrl(path);
  return { file_url: data.publicUrl };
}
