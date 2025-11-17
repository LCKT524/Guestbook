-- 用户表由 Supabase Auth 托管，无需自建
-- 如需扩展用户字段，可创建 public.profiles 表并与 auth.users 关联

-- 依赖：生成 UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. 联系人表
CREATE TABLE public.contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  address     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 分类表（系统+用户自定义）
CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT CHECK (type IN ('gift','expense','income')), -- 对应礼簿/支出/收入
  color       TEXT DEFAULT '#3b82f6',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 记录表（随礼/支出/收入）
CREATE TABLE public.records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id  UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type        TEXT CHECK (type IN ('gift_given','gift_received','expense','income')),
  amount      NUMERIC(12,2) NOT NULL,
  event_name  TEXT,
  note        TEXT,
  record_date DATE NOT NULL,
  payment_method TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 行级安全（RLS）（仅允许用户操作自己的数据）
ALTER TABLE public.contacts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records    ENABLE ROW LEVEL SECURITY;

-- 匿名/登录用户可读自己数据
CREATE POLICY "Users can read own contacts" ON public.contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own records" ON public.records FOR SELECT USING (auth.uid() = user_id);

-- 登录用户可写自己数据
CREATE POLICY "Users can insert own contacts" ON public.contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON public.contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON public.contacts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON public.records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own records" ON public.records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own records" ON public.records FOR DELETE USING (auth.uid() = user_id);

-- 5. 默认分类（每个新用户初始化）
-- 取消占位用户插入，改用触发器为每个真实用户创建默认分类

-- 6. 函数：为新注册用户复制默认分类
CREATE OR REPLACE FUNCTION public.clone_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- 为新用户写入默认分类
  INSERT INTO public.categories (user_id, name, type, color) VALUES
    (NEW.id, '结婚随礼', 'gift',   '#ec4899'),
    (NEW.id, '满月随礼', 'gift',   '#f59e0b'),
    (NEW.id, '节日红包', 'gift',   '#10b981'),
    (NEW.id, '日常支出', 'expense','#ef4444'),
    (NEW.id, '工资收入', 'income', '#6366f1');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 安全：限定 search_path，避免在错误 schema 中解析对象
ALTER FUNCTION public.clone_default_categories SET search_path = public;

CREATE TRIGGER trg_clone_default_categories
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.clone_default_categories();