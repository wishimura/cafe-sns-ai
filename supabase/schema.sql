-- Shops table
create table if not exists public.shops (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  address text default '',
  business_hours text default '',
  closed_days text default '',
  menu_type text default '',
  atmosphere text default '',
  tone text default '',
  has_takeout boolean default false,
  hashtag_policy text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Post generations table
create table if not exists public.post_generations (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  theme text default '',
  menu_item text default '',
  supplement text default '',
  photo_url text,
  platform text default 'all',
  output_1 text default '',
  output_2 text default '',
  output_3 text default '',
  story_text text default '',
  line_text text default '',
  hashtags text default '',
  is_favorite boolean default false,
  created_at timestamptz default now()
);

-- Review replies table
create table if not exists public.review_replies (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  review_text text not null,
  star_rating integer not null check (star_rating >= 1 and star_rating <= 5),
  reply_tone text default 'neutral',
  reply_1 text default '',
  reply_2 text default '',
  reply_3 text default '',
  is_favorite boolean default false,
  created_at timestamptz default now()
);

-- RLS policies
alter table public.shops enable row level security;
alter table public.post_generations enable row level security;
alter table public.review_replies enable row level security;

-- Shops: users can only access their own shops
create policy "Users can view own shops" on public.shops
  for select using (auth.uid() = user_id);

create policy "Users can insert own shops" on public.shops
  for insert with check (auth.uid() = user_id);

create policy "Users can update own shops" on public.shops
  for update using (auth.uid() = user_id);

-- Post generations: users can access through their shops
create policy "Users can view own posts" on public.post_generations
  for select using (
    shop_id in (select id from public.shops where user_id = auth.uid())
  );

create policy "Users can insert own posts" on public.post_generations
  for insert with check (
    shop_id in (select id from public.shops where user_id = auth.uid())
  );

create policy "Users can update own posts" on public.post_generations
  for update using (
    shop_id in (select id from public.shops where user_id = auth.uid())
  );

create policy "Users can delete own posts" on public.post_generations
  for delete using (
    shop_id in (select id from public.shops where user_id = auth.uid())
  );

-- Review replies: users can access through their shops
create policy "Users can view own replies" on public.review_replies
  for select using (
    shop_id in (select id from public.shops where user_id = auth.uid())
  );

create policy "Users can insert own replies" on public.review_replies
  for insert with check (
    shop_id in (select id from public.shops where user_id = auth.uid())
  );

create policy "Users can update own replies" on public.review_replies
  for update using (
    shop_id in (select id from public.shops where user_id = auth.uid())
  );

create policy "Users can delete own replies" on public.review_replies
  for delete using (
    shop_id in (select id from public.shops where user_id = auth.uid())
  );
