-- 用户表由 Supabase Auth 托管，无需自建
-- 如需扩展用户字段，可创建 public.profiles 表并与 auth.users 关联

-- 依赖：生成 UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  nickname TEXT,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- 1. 联系人表
CREATE TABLE public.contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT CHECK (type IN ('gift','expense','income')), -- 对应礼簿/支出/收入
  color       TEXT DEFAULT '#3b82f6',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 记录表（随礼/支出/收入）
CREATE TABLE public.records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
ALTER TABLE public.contacts   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.records    DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contacts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.records TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- 匿名/登录用户可读自己数据


-- 5. 默认分类（每个新用户初始化）
-- 取消占位用户插入，改用触发器为每个真实用户创建默认分类

-- 6. 函数：为新注册用户复制默认分类
CREATE OR REPLACE FUNCTION public.clone_default_categories_for_user()
RETURNS TRIGGER AS $$
BEGIN
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
ALTER FUNCTION public.clone_default_categories_for_user SET search_path = public;

CREATE TRIGGER trg_clone_default_categories_user
AFTER INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.clone_default_categories_for_user();