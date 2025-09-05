-- Create comprehensive UFC-style fight control system

-- 1. JUDGES TABLE - Official judges registry
CREATE TABLE public.judges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    certification_level TEXT NOT NULL DEFAULT 'REGIONAL' CHECK (certification_level IN ('REGIONAL', 'NATIONAL', 'INTERNATIONAL')),
    specialization TEXT[] DEFAULT ARRAY[]::TEXT[], -- MMA, Boxing, Kickboxing, etc
    active BOOLEAN NOT NULL DEFAULT true,
    email TEXT,
    phone TEXT,
    country TEXT DEFAULT 'HN',
    organization_id UUID REFERENCES public.organizations(id),
    certified_since TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
    total_fights_judged INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. FIGHT OFFICIALS - Assignments per fight
CREATE TABLE public.fight_officials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
    official_id UUID NOT NULL REFERENCES public.judges(id),
    role TEXT NOT NULL CHECK (role IN ('JUDGE_1', 'JUDGE_2', 'JUDGE_3', 'REFEREE', 'SUPERVISOR')),
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    confirmed BOOLEAN DEFAULT false,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    UNIQUE(fight_id, role), -- One person per role per fight
    UNIQUE(fight_id, official_id) -- One role per official per fight
);

-- 3. FIGHT SCORECARDS - Official round-by-round scoring
CREATE TABLE public.fight_scorecards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES public.judges(id),
    round_number INTEGER NOT NULL CHECK (round_number >= 1 AND round_number <= 15),
    fighter_a_score INTEGER NOT NULL CHECK (fighter_a_score >= 7 AND fighter_a_score <= 10),
    fighter_b_score INTEGER NOT NULL CHECK (fighter_b_score >= 7 AND fighter_b_score <= 10),
    -- Professional scoring validations
    CONSTRAINT valid_score_difference CHECK (
        ABS(fighter_a_score - fighter_b_score) <= 3 AND
        (fighter_a_score + fighter_b_score) = 19 OR (fighter_a_score + fighter_b_score) = 18 OR (fighter_a_score + fighter_b_score) = 17
    ),
    notes TEXT,
    knockdown_fighter_a INTEGER DEFAULT 0 CHECK (knockdown_fighter_a >= 0),
    knockdown_fighter_b INTEGER DEFAULT 0 CHECK (knockdown_fighter_b >= 0),
    point_deduction_a INTEGER DEFAULT 0 CHECK (point_deduction_a >= 0),
    point_deduction_b INTEGER DEFAULT 0 CHECK (point_deduction_b >= 0),
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    round_start_time TIMESTAMP WITH TIME ZONE,
    round_end_time TIMESTAMP WITH TIME ZONE,
    UNIQUE(fight_id, judge_id, round_number)
);

-- 4. FIGHT CONTROL EVENTS - Referee control log
CREATE TABLE public.fight_control_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES public.judges(id),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'FIGHT_START', 'FIGHT_STOP', 'FIGHT_PAUSE', 'FIGHT_RESUME', 
        'ROUND_END', 'ROUND_START', 'KNOCKDOWN', 'STANDING_COUNT',
        'FOUL', 'POINT_DEDUCTION', 'DISQUALIFICATION', 'TKO', 'KO', 
        'SUBMISSION', 'MEDICAL_TIMEOUT', 'TECHNICAL_DECISION', 'NO_CONTEST'
    )),
    round_number INTEGER CHECK (round_number >= 1 AND round_number <= 15),
    fighter_affected UUID REFERENCES public.fighter_profiles(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reason TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- 5. FIGHT STATISTICS - Real-time fight stats
CREATE TABLE public.fight_statistics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL CHECK (round_number >= 1 AND round_number <= 15),
    fighter_id UUID NOT NULL REFERENCES public.fighter_profiles(id),
    
    -- Striking stats
    strikes_thrown INTEGER DEFAULT 0,
    strikes_landed INTEGER DEFAULT 0,
    significant_strikes_thrown INTEGER DEFAULT 0,
    significant_strikes_landed INTEGER DEFAULT 0,
    head_strikes_landed INTEGER DEFAULT 0,
    body_strikes_landed INTEGER DEFAULT 0,
    leg_strikes_landed INTEGER DEFAULT 0,
    
    -- Grappling stats  
    takedown_attempts INTEGER DEFAULT 0,
    takedowns_successful INTEGER DEFAULT 0,
    takedown_defense INTEGER DEFAULT 0,
    submission_attempts INTEGER DEFAULT 0,
    ground_control_time INTEGER DEFAULT 0, -- seconds
    
    -- Other stats
    knockdowns INTEGER DEFAULT 0,
    cage_control_time INTEGER DEFAULT 0, -- seconds
    aggression_score INTEGER DEFAULT 0 CHECK (aggression_score >= 0 AND aggression_score <= 10),
    
    recorded_by UUID REFERENCES auth.users(id),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(fight_id, round_number, fighter_id)
);

-- 6. FIGHT RESULTS - Final official results  
CREATE TABLE public.fight_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    fight_id UUID NOT NULL UNIQUE REFERENCES public.fights(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES public.fighter_profiles(id),
    result_type TEXT NOT NULL CHECK (result_type IN (
        'DECISION_UNANIMOUS', 'DECISION_MAJORITY', 'DECISION_SPLIT', 'DECISION_DRAW',
        'TKO', 'KO', 'SUBMISSION', 'DISQUALIFICATION', 'NO_CONTEST', 'TECHNICAL_DRAW'
    )),
    finish_method TEXT, -- Specific submission, punch type, etc
    finish_round INTEGER CHECK (finish_round >= 1 AND finish_round <= 15),
    finish_time TEXT, -- Format: MM:SS
    
    -- Judge scorecards summary
    judge_1_scorecard INTEGER[], -- Array of scores [10,9,10,9,10]
    judge_2_scorecard INTEGER[], 
    judge_3_scorecard INTEGER[],
    judge_1_total INTEGER,
    judge_2_total INTEGER,  
    judge_3_total INTEGER,
    
    -- Performance bonuses
    performance_bonus BOOLEAN DEFAULT false,
    fight_of_night BOOLEAN DEFAULT false,
    
    confirmed_by UUID REFERENCES auth.users(id),
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Automatic ELO calculation
    winner_elo_before INTEGER,
    winner_elo_after INTEGER,
    loser_elo_before INTEGER,
    loser_elo_after INTEGER
);

-- Enable Row Level Security
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fight_officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fight_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fight_control_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fight_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fight_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Judges: Admins can manage, judges can view their own profile
CREATE POLICY "judges_admin_manage" ON public.judges FOR ALL USING (is_admin());
CREATE POLICY "judges_self_read" ON public.judges FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.app_user WHERE auth_user_id = auth.uid() AND email = judges.email)
);

-- Fight Officials: Admins manage, officials can see their assignments
CREATE POLICY "fight_officials_admin_manage" ON public.fight_officials FOR ALL USING (is_admin());
CREATE POLICY "fight_officials_self_read" ON public.fight_officials FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.judges j JOIN public.app_user u ON j.email = u.email 
        WHERE j.id = fight_officials.official_id AND u.auth_user_id = auth.uid()
    )
);

-- Scorecards: Only assigned judges can create/update their scorecards
CREATE POLICY "scorecards_judge_manage" ON public.fight_scorecards FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.judges j JOIN public.app_user u ON j.email = u.email
        WHERE j.id = fight_scorecards.judge_id AND u.auth_user_id = auth.uid()
    ) OR is_admin()
);

-- Control Events: Only assigned referees can create events
CREATE POLICY "control_events_referee_manage" ON public.fight_control_events FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.judges j JOIN public.app_user u ON j.email = u.email
        WHERE j.id = fight_control_events.referee_id AND u.auth_user_id = auth.uid()
    ) OR is_admin()
);

-- Statistics: Admins and authorized personnel only
CREATE POLICY "statistics_admin_manage" ON public.fight_statistics FOR ALL USING (is_admin());

-- Results: Public read, admin manage
CREATE POLICY "results_public_read" ON public.fight_results FOR SELECT USING (true);
CREATE POLICY "results_admin_manage" ON public.fight_results FOR INSERT, UPDATE, DELETE USING (is_admin());

-- Add triggers for updated_at
CREATE TRIGGER update_judges_updated_at BEFORE UPDATE ON public.judges
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_judges_active ON public.judges(active);
CREATE INDEX idx_judges_certification ON public.judges(certification_level);
CREATE INDEX idx_fight_officials_fight ON public.fight_officials(fight_id);
CREATE INDEX idx_fight_officials_role ON public.fight_officials(fight_id, role);
CREATE INDEX idx_scorecards_fight_judge ON public.fight_scorecards(fight_id, judge_id);
CREATE INDEX idx_scorecards_round ON public.fight_scorecards(fight_id, round_number);
CREATE INDEX idx_control_events_fight ON public.fight_control_events(fight_id);
CREATE INDEX idx_control_events_type ON public.fight_control_events(event_type);
CREATE INDEX idx_statistics_fight_round ON public.fight_statistics(fight_id, round_number);
CREATE INDEX idx_results_fight ON public.fight_results(fight_id);