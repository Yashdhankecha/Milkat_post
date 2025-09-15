-- =========================================
-- PHASE 1: NESTLY ESTATE PLATFORM DATABASE MIGRATION
-- =========================================

-- =========================================
-- 1. ENHANCED PROFILES TABLE
-- =========================================
-- Add new columns to support all user roles and business info
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_picture TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));

-- Update role enum to support all business types
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE TEXT,
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'buyer', 'seller', 'broker', 'developer'));

-- =========================================
-- 2. BROKERS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialization TEXT[] DEFAULT '{}',
  office_address TEXT,
  contact_info JSONB DEFAULT '{}'::jsonb,
  commission_rate DECIMAL(5,2) DEFAULT 2.0,
  years_experience INTEGER,
  license_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for brokers
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

-- Brokers RLS Policies
CREATE POLICY "Brokers are viewable by everyone" 
ON public.brokers FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create their own broker profile" 
ON public.brokers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own broker profile" 
ON public.brokers FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can manage all broker profiles
CREATE POLICY "Admins can manage all brokers" 
ON public.brokers FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =========================================
-- 3. DEVELOPERS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_description TEXT,
  established_year INTEGER,
  contact_info JSONB DEFAULT '{}'::jsonb,
  website TEXT,
  social_media JSONB DEFAULT '{}'::jsonb,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for developers
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

-- Developers RLS Policies
CREATE POLICY "Developers are viewable by everyone" 
ON public.developers FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create their own developer profile" 
ON public.developers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own developer profile" 
ON public.developers FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can manage all developer profiles
CREATE POLICY "Admins can manage all developers" 
ON public.developers FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =========================================
-- 4. INQUIRIES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  broker_id UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
  developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('property', 'project', 'general', 'broker_contact', 'developer_contact')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  contact_preference TEXT DEFAULT 'email' CHECK (contact_preference IN ('email', 'phone', 'whatsapp')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for inquiries
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Inquiries RLS Policies
CREATE POLICY "Users can create inquiries" 
ON public.inquiries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own inquiries" 
ON public.inquiries FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own inquiries" 
ON public.inquiries FOR UPDATE 
USING (auth.uid() = user_id);

-- Brokers can view inquiries related to their properties/services
CREATE POLICY "Brokers can view related inquiries" 
ON public.inquiries FOR SELECT 
USING (
  broker_id IN (
    SELECT id FROM public.brokers WHERE user_id = auth.uid()
  )
);

-- Developers can view inquiries related to their projects
CREATE POLICY "Developers can view related inquiries" 
ON public.inquiries FOR SELECT 
USING (
  developer_id IN (
    SELECT id FROM public.developers WHERE user_id = auth.uid()
  )
);

-- Property owners can view inquiries about their properties
CREATE POLICY "Property owners can view property inquiries" 
ON public.inquiries FOR SELECT 
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE owner_id = auth.uid()
  )
);

-- Admins can manage all inquiries
CREATE POLICY "Admins can manage all inquiries" 
ON public.inquiries FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =========================================
-- 5. SUPPORT TICKETS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('technical', 'billing', 'property', 'account', 'general')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for support tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Support Tickets RLS Policies
CREATE POLICY "Users can create support tickets" 
ON public.support_tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own support tickets" 
ON public.support_tickets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own support tickets" 
ON public.support_tickets FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can manage all support tickets
CREATE POLICY "Admins can manage all support tickets" 
ON public.support_tickets FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Assigned admins can view and update assigned tickets
CREATE POLICY "Assigned admins can manage assigned tickets" 
ON public.support_tickets FOR SELECT 
USING (auth.uid() = assigned_to);

CREATE POLICY "Assigned admins can update assigned tickets" 
ON public.support_tickets FOR UPDATE 
USING (auth.uid() = assigned_to);

-- =========================================
-- 6. FAQ TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT DEFAULT 'general' CHECK (category IN ('buyer', 'seller', 'broker', 'developer', 'general', 'nri', 'investment')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for FAQ
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

-- FAQ RLS Policies
CREATE POLICY "FAQ is viewable by everyone" 
ON public.faq FOR SELECT 
USING (is_active = true);

-- Admins can manage FAQ
CREATE POLICY "Admins can manage FAQ" 
ON public.faq FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =========================================
-- 7. ENHANCE EXISTING TABLES
-- =========================================

-- Add new columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'sale' CHECK (listing_type IN ('sale', 'rent', 'lease', 'pg')),
ADD COLUMN IF NOT EXISTS furnished_status TEXT CHECK (furnished_status IN ('furnished', 'semi_furnished', 'unfurnished')),
ADD COLUMN IF NOT EXISTS lease_term TEXT,
ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC,
ADD COLUMN IF NOT EXISTS security_deposit NUMERIC,
ADD COLUMN IF NOT EXISTS maintenance_cost NUMERIC,
ADD COLUMN IF NOT EXISTS available_from DATE,
ADD COLUMN IF NOT EXISTS min_lease_period TEXT;

-- Add developer reference to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'residential' CHECK (project_type IN ('residential', 'commercial', 'mixed', 'infrastructure')),
ADD COLUMN IF NOT EXISTS total_units INTEGER,
ADD COLUMN IF NOT EXISTS available_units INTEGER,
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS floor_plans JSONB DEFAULT '{}'::jsonb;

-- =========================================
-- 8. ANALYTICS TABLES
-- =========================================

-- Property views tracking
CREATE TABLE IF NOT EXISTS public.property_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for property views
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property views are viewable by property owners" 
ON public.property_views FOR SELECT 
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can record property views" 
ON public.property_views FOR INSERT 
WITH CHECK (true);

-- Admins can view all property analytics
CREATE POLICY "Admins can view all property views" 
ON public.property_views FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- User activity tracking
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'property_view', 'inquiry_sent', 'profile_update', 'search')),
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for user activity
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity" 
ON public.user_activity FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" 
ON public.user_activity FOR INSERT 
WITH CHECK (true);

-- Admins can view all user activity
CREATE POLICY "Admins can view all user activity" 
ON public.user_activity FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =========================================
-- 9. TRIGGERS FOR UPDATED_AT
-- =========================================

-- Create triggers for updated_at columns
CREATE TRIGGER update_brokers_updated_at
  BEFORE UPDATE ON public.brokers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON public.developers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faq_updated_at
  BEFORE UPDATE ON public.faq
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 10. INDEXES FOR PERFORMANCE
-- =========================================

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_brokers_user_id ON public.brokers(user_id);
CREATE INDEX IF NOT EXISTS idx_brokers_status ON public.brokers(status);
CREATE INDEX IF NOT EXISTS idx_developers_user_id ON public.developers(user_id);
CREATE INDEX IF NOT EXISTS idx_developers_status ON public.developers(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON public.inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON public.inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON public.property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_broker_id ON public.properties(broker_id);
CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON public.projects(developer_id);

-- =========================================
-- 11. SAMPLE DATA FOR TESTING
-- =========================================

-- Insert sample FAQ data
INSERT INTO public.faq (category, question, answer, display_order, tags) VALUES
('general', 'What is Nestly Estate?', 'Nestly Estate is a comprehensive real estate platform connecting buyers, sellers, brokers, and developers across multiple countries. We specialize in NRI property investments and provide end-to-end real estate solutions.', 1, ARRAY['platform', 'about']),
('buyer', 'How do I search for properties?', 'You can search for properties using our advanced search filters including location, price range, property type, amenities, and more. Create an account to save your favorite properties and get personalized recommendations.', 2, ARRAY['search', 'properties']),
('seller', 'How do I list my property?', 'To list your property, create a seller account, go to the "Post Property" section, and fill in all the required details including photos, pricing, and property features. Our team will verify and publish your listing.', 3, ARRAY['listing', 'sell']),
('broker', 'What are the commission rates for brokers?', 'Our brokers earn competitive commission rates up to 2.5% on successful transactions, plus performance bonuses. Additional benefits include marketing support, lead generation, and access to our global network.', 4, ARRAY['commission', 'earnings']),
('nri', 'Can NRIs buy property in India through your platform?', 'Yes! We specialize in NRI property investments and provide complete support including legal documentation, property management, and investment advisory services. Our NRI services team is available 24/7.', 5, ARRAY['nri', 'investment', 'legal']);

COMMENT ON TABLE public.profiles IS 'Enhanced user profiles supporting multiple roles: admin, buyer, seller, broker, developer';
COMMENT ON TABLE public.brokers IS 'Broker profiles with specializations, contact info, and verification status';
COMMENT ON TABLE public.developers IS 'Developer/builder profiles with company information and verification';
COMMENT ON TABLE public.inquiries IS 'Customer inquiries for properties, projects, and general services';
COMMENT ON TABLE public.support_tickets IS 'Customer support ticket system with priority and category management';
COMMENT ON TABLE public.faq IS 'Dynamic FAQ system with categorization and tagging';
COMMENT ON TABLE public.property_views IS 'Analytics tracking for property page views';
COMMENT ON TABLE public.user_activity IS 'User behavior analytics and activity logging';