-- OPTIONAL: demo students so you can see matching before real users join.
-- Run AFTER schema.sql. Remove later with the DELETE at the bottom.

insert into auth.users (id, email, raw_user_meta_data) values
  ('d0000000-0000-0000-0000-000000000001', 'demo1@codepair.local', '{"full_name":"Demo Aziz (Backend)"}'),
  ('d0000000-0000-0000-0000-000000000002', 'demo2@codepair.local', '{"full_name":"Demo Madina (UI/UX)"}'),
  ('d0000000-0000-0000-0000-000000000003', 'demo3@codepair.local', '{"full_name":"Demo Timur (ML)"}'),
  ('d0000000-0000-0000-0000-000000000004', 'demo4@codepair.local', '{"full_name":"Demo Nilufar (Product)"}'),
  ('d0000000-0000-0000-0000-000000000005', 'demo5@codepair.local', '{"full_name":"Demo Jasur (Frontend)"}'),
  ('d0000000-0000-0000-0000-000000000006', 'demo6@codepair.local', '{"full_name":"Demo Kamila (Data)"}'),
  ('d0000000-0000-0000-0000-000000000007', 'demo7@codepair.local', '{"full_name":"Demo Bekzod (Mobile)"}'),
  ('d0000000-0000-0000-0000-000000000008', 'demo8@codepair.local', '{"full_name":"Demo Sevara (Backend)"}')
on conflict (id) do nothing;

update public.profiles as p set
  university = v.university, roles = v.roles, skills = v.skills, interests = v.interests,
  level = v.level, hours_per_week = v.hours, bio = v.bio
from (values
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'Webster University Tashkent', '{backend}'::text[], '{python,fastapi,postgresql,docker}'::text[], '{edtech,ai}'::text[], 'intermediate', 10, 'Backend на FastAPI, 2 пет-проекта.'),
  ('d0000000-0000-0000-0000-000000000002', 'Webster University Tashkent', '{uiux}', '{figma}', '{edtech,social}', 'intermediate', 8, 'Дизайн мобильных и веб-интерфейсов.'),
  ('d0000000-0000-0000-0000-000000000003', 'INHA University in Tashkent', '{ml,data}', '{python,pytorch,pandas,llm}', '{ai,health}', 'advanced', 12, 'NLP и LLM, участвовал в Kaggle.'),
  ('d0000000-0000-0000-0000-000000000004', 'Westminster International University in Tashkent', '{product,marketing}', '{product-mgmt,smm}', '{edtech,fintech}', 'beginner', 6, 'Хочу вести продукт от идеи до запуска.'),
  ('d0000000-0000-0000-0000-000000000005', 'Webster University Tashkent', '{frontend}', '{react,nextjs,typescript,html-css}', '{productivity,edtech}', 'intermediate', 15, 'React/Next.js, люблю аккуратный UI.'),
  ('d0000000-0000-0000-0000-000000000006', 'TUIT', '{data}', '{python,sql,pandas}', '{fintech,gov}', 'beginner', 5, 'Аналитика данных, дашборды.'),
  ('d0000000-0000-0000-0000-000000000007', 'TUIT', '{mobile}', '{flutter,kotlin}', '{travel,social}', 'advanced', 10, 'Flutter, 3 приложения в сторах.'),
  ('d0000000-0000-0000-0000-000000000008', 'Webster University Tashkent', '{backend,devops}', '{python,django,docker,postgresql}', '{ai}', 'intermediate', 10, 'Django + Docker.')
) as v(id, university, roles, skills, interests, level, hours, bio)
where p.id = v.id;

insert into public.projects (id, owner_id, title, description, tech, interests, needed_roles, status)
values ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
  'Demo: AI-помощник для подготовки к экзаменам',
  'Сервис генерирует вопросы по конспектам и отслеживает прогресс студента.',
  '{python,fastapi,react,llm,figma}', '{edtech,ai}', '{backend,ml,uiux,frontend}', 'open')
on conflict (id) do nothing;

-- To remove all demo data:
-- delete from auth.users where email like '%@codepair.local';
