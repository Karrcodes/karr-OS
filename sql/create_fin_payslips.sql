-- Create the fin_payslips table for tracking payslip history and salary analytics
-- Run this in your Supabase SQL Editor

create table if not exists public.fin_payslips (
    id uuid primary key default gen_random_uuid(),
    date date not null,
    employer text,
    gross_pay numeric(12, 2),
    net_pay numeric(12, 2) not null,
    tax_paid numeric(12, 2),
    pension_contributions numeric(12, 2),
    student_loan numeric(12, 2),
    profile text not null default 'personal' check (profile in ('personal', 'business')),
    created_at timestamptz not null default now()
);

-- Enable Row Level Security (optional, if you use RLS on other tables)
-- alter table public.fin_payslips enable row level security;

-- Index for fast lookups by profile and date
create index if not exists idx_fin_payslips_profile_date on public.fin_payslips(profile, date desc);
