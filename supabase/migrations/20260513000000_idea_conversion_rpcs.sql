-- ─────────────────────────────────────────────────────────────────
-- Idea conversion RPCs — atomic two-write transactions
-- ─────────────────────────────────────────────────────────────────
-- Phase 4 Session 2: closes the cross-store atomicity gap that was
-- documented in docs/15-TECH-DEBT.md (P1 #2). Previously the client
-- did:
--   1. INSERT new action (or project)
--   2. UPDATE ideas SET status='converted_*', converted_to_id=...
-- If step 2 failed, the action/project existed but the idea remained
-- 'captured' — user could double-convert.
--
-- These RPCs wrap both writes in a single transaction. If the idea
-- update fails, the new entity insert rolls back automatically.
--
-- Security: SECURITY INVOKER so RLS applies via auth.uid(). The
-- caller can only convert their own ideas and insert into their own
-- actions/projects per the existing RLS policies. We also do an
-- explicit ownership pre-check for a clearer error message.

-- ─────────────────────────────────────────────────────────────────
-- convert_idea_to_action
-- ─────────────────────────────────────────────────────────────────

create or replace function public.convert_idea_to_action(
  p_idea_id uuid,
  p_action_payload jsonb
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_user_id uuid := auth.uid();
  v_action_id uuid := gen_random_uuid();
  v_at timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.ideas where id = p_idea_id and user_id = v_user_id
  ) then
    raise exception 'Idea % not found or not owned', p_idea_id;
  end if;

  insert into public.actions (
    id, user_id, goal_id, project_id, title, status,
    scheduled_date, notes, impact, time_estimate_minutes,
    delegate_name, delegate_note, expected_return_date,
    is_sample
  ) values (
    v_action_id,
    v_user_id,
    (p_action_payload->>'goal_id')::uuid,
    nullif(p_action_payload->>'project_id', '')::uuid,
    p_action_payload->>'title',
    coalesce(p_action_payload->>'status', 'backlog'),
    nullif(p_action_payload->>'scheduled_date', '')::date,
    nullif(p_action_payload->>'notes', ''),
    coalesce((p_action_payload->>'impact')::int, 1),
    nullif(p_action_payload->>'time_estimate_minutes', '')::int,
    nullif(p_action_payload->>'delegate_name', ''),
    nullif(p_action_payload->>'delegate_note', ''),
    nullif(p_action_payload->>'expected_return_date', '')::date,
    coalesce((p_action_payload->>'is_sample')::boolean, false)
  );

  insert into public.action_timeline (id, action_id, at, text)
  values (
    gen_random_uuid(),
    v_action_id,
    v_at,
    coalesce(p_action_payload->>'timeline_text', 'Converted from idea')
  );

  update public.ideas
  set status = 'converted_to_action',
      converted_to_id = v_action_id
  where id = p_idea_id;

  return v_action_id;
end;
$$;

grant execute on function public.convert_idea_to_action(uuid, jsonb) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- convert_idea_to_project
-- ─────────────────────────────────────────────────────────────────

create or replace function public.convert_idea_to_project(
  p_idea_id uuid,
  p_project_payload jsonb
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_user_id uuid := auth.uid();
  v_project_id uuid := gen_random_uuid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.ideas where id = p_idea_id and user_id = v_user_id
  ) then
    raise exception 'Idea % not found or not owned', p_idea_id;
  end if;

  insert into public.projects (
    id, user_id, goal_id, title, status, description,
    is_draft, is_sample
  ) values (
    v_project_id,
    v_user_id,
    (p_project_payload->>'goal_id')::uuid,
    p_project_payload->>'title',
    coalesce(p_project_payload->>'status', 'active'),
    case
      when p_project_payload->'description' is null then null
      else p_project_payload->'description'
    end,
    coalesce((p_project_payload->>'is_draft')::boolean, false),
    coalesce((p_project_payload->>'is_sample')::boolean, false)
  );

  update public.ideas
  set status = 'converted_to_project',
      converted_to_id = v_project_id
  where id = p_idea_id;

  return v_project_id;
end;
$$;

grant execute on function public.convert_idea_to_project(uuid, jsonb) to authenticated;
