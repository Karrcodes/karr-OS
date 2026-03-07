-- ============================================================================
-- Flow Planner Schema Update
-- Adds the new Tier 1 Anchor routine settings.
-- ============================================================================

ALTER TABLE public.fin_day_planner_settings
ADD COLUMN IF NOT EXISTS anchors_work JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS anchors_off JSONB DEFAULT '[]'::jsonb;

-- Example default seed for the admin user, converting the legacy rigid routines into the new Anchor blocks
DO $$
DECLARE
    admin_uuid UUID;
BEGIN
    SELECT id INTO admin_uuid FROM auth.users WHERE email = 'abduluk98@gmail.com' LIMIT 1;
    
    IF admin_uuid IS NOT NULL THEN
        UPDATE public.fin_day_planner_settings
        SET anchors_work = '[
            {"id": "anchor-wake", "name": "Wake / Prep", "start_time": "03:30", "end_time": "04:15", "type": "routine", "is_flexible": false},
            {"id": "anchor-commute1", "name": "Commute", "start_time": "04:15", "end_time": "05:45", "type": "transit", "is_flexible": false},
            {"id": "anchor-shift1", "name": "GXO Shift (P1)", "start_time": "06:00", "end_time": "09:30", "type": "routine", "is_flexible": false},
            {"id": "anchor-break1", "name": "Break", "start_time": "09:30", "end_time": "10:00", "type": "meal", "is_flexible": false},
            {"id": "anchor-shift2", "name": "GXO Shift (P2)", "start_time": "10:00", "end_time": "14:00", "type": "routine", "is_flexible": false},
            {"id": "anchor-break2", "name": "Break", "start_time": "14:00", "end_time": "14:30", "type": "meal", "is_flexible": false},
            {"id": "anchor-shift3", "name": "GXO Shift (P3)", "start_time": "14:30", "end_time": "18:00", "type": "routine", "is_flexible": false},
            {"id": "anchor-commute2", "name": "Commute", "start_time": "18:15", "end_time": "19:40", "type": "transit", "is_flexible": false},
            {"id": "anchor-evening", "name": "Meal, Shower & Wind Down", "start_time": "19:40", "end_time": "20:40", "type": "routine", "is_flexible": true},
            {"id": "anchor-sleep", "name": "Sleep", "start_time": "21:30", "end_time": "03:30", "type": "sleep", "is_flexible": false}
        ]'::jsonb,
        anchors_off = '[
            {"id": "anchor-wake-off", "name": "Wake Up", "start_time": "09:00", "end_time": "09:30", "type": "routine", "is_flexible": true},
            {"id": "anchor-sleep-off", "name": "Sleep", "start_time": "23:30", "end_time": "09:00", "type": "sleep", "is_flexible": true}
        ]'::jsonb
        WHERE user_id = admin_uuid;
    END IF;
END $$;
