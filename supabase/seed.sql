-- =============================================================================
-- InterviewFlow — seed.sql
-- Local dev seed: mirrors Phase 1 mock data exactly for dev parity.
-- Uses a fixed test user UUID. DO NOT run against production.
--
-- Prerequisites: supabase db reset (runs all migrations first, then this file)
-- The test user must exist in auth.users before this seed runs.
-- supabase start creates a test user automatically at:
--   email: test@example.com  password: password  id: (see below)
--
-- If seeding manually, first insert into auth.users:
--   insert into auth.users (id, email) values (<TEST_USER_ID>, 'shay@interviewflow.dev');
-- =============================================================================

-- Fixed UUID for the local dev test user
-- Replace this with your actual local Supabase user UUID after `supabase start`
do $$ begin
  if not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-000000000001') then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token
    ) values (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'shay@interviewflow.dev',
      crypt('password', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Shay Silversmith"}'::jsonb,
      false,
      ''
    );
  end if;
end $$;

-- Convenience variable
\set TEST_USER_ID '00000000-0000-0000-0000-000000000001'

-- =============================================================================
-- profiles
-- =============================================================================
insert into profiles (id, user_id, name, email, university, year_of_study, military_unit, headline, bio, skills)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Shay Silversmith',
  'shay@interviewflow.dev',
  'Ben-Gurion University of the Negev',
  3,
  'Unit 9900',
  'IS Engineering Student | Unit 9900 Veteran | Data & Product',
  '3rd-year Information Systems Engineering student at BGU. Former geospatial intelligence analyst in IDF Unit 9900. Building at the intersection of data, product, and AI.',
  array['Python','SQL','PostgreSQL','PostGIS','GIS/QGIS','Pandas','Spark','AWS','React','TypeScript','JIRA','Agile/Scrum']
)
on conflict (id) do nothing;


-- =============================================================================
-- companies
-- =============================================================================
insert into companies (id, user_id, name, industry, size, location, website, linkedin_url, logo_url, description, notes, glassdoor_rating, tech_stack)
values
  (
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Amazon',
    'E-commerce / Cloud / AI',
    '10000+',
    'Tel Aviv, Israel',
    'https://amazon.jobs',
    'https://linkedin.com/company/amazon',
    'https://www.google.com/s2/favicons?domain=amazon.com&sz=128',
    'Amazon is a global technology and e-commerce company. The Israel R&D center works on AWS, Alexa, and data platform projects with a strong focus on engineering excellence.',
    'Strong recruiter contact — Noa Ben-David. Engineering-heavy culture, bar-raiser process. Focus on Leadership Principles in all interviews.',
    3.9,
    array['Python','AWS','Spark','Redshift','Kafka','DynamoDB']
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'MyHeritage',
    'Consumer Tech / Genealogy / AI',
    '501-2000',
    'Or Yehuda, Israel',
    'https://myheritage.com',
    'https://linkedin.com/company/myheritage',
    'https://www.google.com/s2/favicons?domain=myheritage.com&sz=128',
    'MyHeritage is a global genealogy and family history platform with AI-powered photo enhancement and DNA matching. Fast-paced product culture with strong international reach.',
    'Product culture is strong, they value user empathy. Interview process: HR → Product case → Manager. Relatively quick process (2–3 weeks).',
    4.2,
    array['Python','React','PostgreSQL','Elasticsearch','AWS','ML/AI']
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Mobileye',
    'Autonomous Driving / Computer Vision',
    '2001-10000',
    'Jerusalem, Israel',
    'https://mobileye.com',
    'https://linkedin.com/company/mobileye',
    'https://www.google.com/s2/favicons?domain=mobileye.com&sz=128',
    'Mobileye is an Intel subsidiary and global leader in autonomous driving and ADAS systems. Their Jerusalem campus hosts world-class computer vision and AI research.',
    'Very structured interview process. GIS/geospatial background is a strong differentiator here. Emphasize Unit 9900 mapping work. They move slowly — be patient.',
    4.4,
    array['C++','Python','CUDA','ROS','Computer Vision','Deep Learning']
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Wix',
    'SaaS / Web Platform',
    '2001-10000',
    'Tel Aviv, Israel',
    'https://wix.com',
    'https://linkedin.com/company/wix',
    'https://www.google.com/s2/favicons?domain=wix.com&sz=128',
    'Wix is a leading cloud-based web development platform with 250M+ registered users. Known for a strong product culture, data-driven decision making, and large-scale experimentation.',
    'PM program is competitive but well-structured. They love data-informed product decisions. Wix Academy is a great differentiator for student PMs.',
    4.1,
    array['Node.js','React','Scala','Kafka','MySQL','Elasticsearch']
  ),
  (
    'a0000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'Upwind',
    'Cybersecurity / Cloud Security',
    '51-200',
    'Tel Aviv, Israel',
    'https://upwind.io',
    'https://linkedin.com/company/upwind-security',
    'https://www.google.com/s2/favicons?domain=upwind.io&sz=128',
    'Upwind is a runtime cloud security platform backed by top-tier VCs. Fast-growing startup with a small, elite team building next-generation CNAPP solutions.',
    'Early-stage startup — high impact opportunity. Founders are ex-Palo Alto Networks. They value technical curiosity and security mindset from Unit 9900 background.',
    4.6,
    array['Go','Kubernetes','AWS','eBPF','React','PostgreSQL']
  );


-- =============================================================================
-- cv_versions
-- =============================================================================
insert into cv_versions (id, user_id, name, version_number, emphasis, skills_highlighted, projects_highlighted, file_name, file_size, notes, is_active)
values
  (
    'c0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Data-heavy v2.1',
    3,
    'Data engineering, SQL, Python, GIS/geospatial systems, Unit 9900 intelligence data pipelines',
    array['Python','SQL','PostgreSQL','GIS/QGIS','Pandas','Spark','AWS','Data Pipelines','ETL'],
    array['GIS Data Pipeline (Unit 9900)','BGU Geospatial Analytics Project','SQL Performance Optimization Study'],
    'Shay_Silversmith_CV_Data_v2.1.pdf',
    248000,
    'Strongest data profile. Leads with Unit 9900 data systems work. Best for DE/DA roles.',
    true
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Product-leaning v1.3',
    2,
    'Product thinking, project management, cross-functional leadership, Agile/Scrum, JIRA',
    array['Product Thinking','JIRA','Agile/Scrum','Cross-functional Leadership','User Research','Python','SQL'],
    array['Unit 9900 Cross-unit Intelligence Project (PM role)','BGU IS Capstone Product Spec','Hackathon Win — Urban Mobility App'],
    'Shay_Silversmith_CV_Product_v1.3.pdf',
    235000,
    'Softer technical emphasis, stronger on PM/coordination skills. Use for PM/project roles.',
    true
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'GIS/Geospatial v1.0',
    1,
    'Geospatial systems, remote sensing, GIS analysis, mapping, satellite imagery interpretation',
    array['QGIS','ArcGIS','PostGIS','Remote Sensing','Python (GeoPandas)','Spatial SQL','Leaflet.js'],
    array['Unit 9900 Mapping Systems','BGU Geospatial Remote Sensing Project','Open-source GIS Contribution'],
    'Shay_Silversmith_CV_GIS_v1.0.pdf',
    221000,
    'Highly specialized. Good if a GIS/mapping company shows up. Keep as a template.',
    false
  );


-- =============================================================================
-- job_applications
-- =============================================================================
insert into job_applications (
  id, user_id, company_id, company_name, role_name, role_url, stage, priority,
  work_model, location, salary_min, salary_max, currency,
  fit_score, urgency_score, submitted_cv_version_id, submitted_cv_name,
  applied_at, deadline_at, next_event_at, next_event_description,
  why_interesting, what_to_emphasize, notes, job_description,
  created_at, updated_at
)
values
  -- Amazon
  (
    'b0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Amazon',
    'Data Engineer Intern',
    'https://amazon.jobs/en/jobs/data-engineer-intern',
    'Technical Interview',
    'Critical',
    'Hybrid',
    'Tel Aviv, Israel',
    8000, 12000, 'ILS',
    88, 92,
    'c0000000-0000-0000-0000-000000000001',
    'CV — Data-heavy v2.1',
    '2026-03-18T10:00:00Z',
    null,
    '2026-05-08T14:00:00Z',
    'Technical Interview — SQL & Python coding',
    'Amazon scale data problems are exactly what I want to work on. AWS ecosystem is the industry standard. Strong learning opportunity.',
    'Unit 9900 large-scale data work, SQL proficiency, Python skills, ability to work on ambiguous problems. Frame everything through Amazon Leadership Principles.',
    'Very strong fit — my GIS/data background and Unit 9900 experience directly map to their data infra needs. Need to prep Amazon Leadership Principles hard.',
    'We are looking for a Data Engineer Intern to join our AWS Data Platform team in Tel Aviv. You will work with petabyte-scale datasets, build ETL pipelines, and help shape our data infrastructure.

Responsibilities:
- Design and build scalable ETL pipelines using Python and Spark
- Work with AWS services: Redshift, Glue, S3, Lambda
- Collaborate with data scientists and analysts to understand data needs
- Optimize query performance and data modeling

Requirements:
- 3rd or 4th year B.Sc. in Computer Science, Information Systems, or related field
- Strong SQL skills (window functions, CTEs, optimization)
- Python proficiency (Pandas, PySpark preferred)
- Familiarity with cloud platforms (AWS preferred)
- GPA 85+ preferred',
    '2026-03-15T09:00:00Z',
    '2026-05-02T14:00:00Z'
  ),
  -- MyHeritage
  (
    'b0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'MyHeritage',
    'Project Manager Student',
    'https://myheritage.com/careers',
    'HR Screen',
    'High',
    'Hybrid',
    'Or Yehuda, Israel',
    null, null, 'ILS',
    82, 70,
    'c0000000-0000-0000-0000-000000000002',
    'CV — Product-leaning v1.3',
    '2026-04-01T09:00:00Z',
    null,
    '2026-05-07T10:00:00Z',
    'HR Screen — Intro call with Tal Katz',
    'Fascinating product domain (AI + genealogy + millions of users). Great PM mentorship culture. Relevant scale for learning.',
    'Cross-functional coordination in Unit 9900, JIRA experience, data-driven thinking, user empathy.',
    'Good product culture fit. MyHeritage moves fast. Make sure to mention cross-functional work from Unit 9900.',
    'MyHeritage is looking for a motivated Project Manager Student to join our Product & Engineering team.',
    '2026-03-28T10:00:00Z',
    '2026-05-01T15:00:00Z'
  ),
  -- Mobileye
  (
    'b0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'Mobileye',
    'Project Manager Student',
    'https://mobileye.com/careers',
    'Applied',
    'High',
    'On-site',
    'Jerusalem, Israel',
    null, null, 'ILS',
    79, 55,
    'c0000000-0000-0000-0000-000000000002',
    'CV — Product-leaning v1.3',
    '2026-04-10T11:00:00Z',
    null, null, null,
    'Mobileye is working on some of the hardest engineering problems in the world. GIS background is directly relevant to mapping & localization work.',
    'GIS expertise from Unit 9900, technical depth, structured thinking, experience managing complex parallel workstreams.',
    'Applied online. Waiting for initial response. Jerusalem commute is a concern — clarify remote days.',
    'Mobileye is seeking a Project Manager Student to join our autonomous driving software programs team.',
    '2026-04-08T09:00:00Z',
    '2026-04-10T11:00:00Z'
  ),
  -- Wix
  (
    'b0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'Wix',
    'Product Manager Student Program',
    'https://wix.com/jobs',
    'Home Assignment',
    'Critical',
    'Hybrid',
    'Tel Aviv, Israel',
    null, null, 'ILS',
    85, 88,
    'c0000000-0000-0000-0000-000000000002',
    'CV — Product-leaning v1.3',
    '2026-03-20T09:00:00Z',
    '2026-05-09T23:59:00Z',
    '2026-05-09T23:59:00Z',
    'Home Assignment due — Product Case Study',
    'Wix is a world-class product company with real scale. The student PM program is genuinely rotational and mentored.',
    'Data-driven thinking, user empathy, GIS product thinking, Agile experience from Unit 9900.',
    'High-priority! Home assignment deadline May 9. Case study about improving a Wix feature for small business owners.',
    'Wix is looking for exceptional students to join our PM Student Program — a structured 6-month rotational program.',
    '2026-03-18T08:00:00Z',
    '2026-05-01T16:00:00Z'
  ),
  -- Upwind
  (
    'b0000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000005',
    'Upwind',
    'Cybersecurity Bootcamp',
    'https://upwind.io/careers',
    'Interested',
    'Medium',
    'Hybrid',
    'Tel Aviv, Israel',
    null, null, 'ILS',
    74, 42,
    null, null,
    null, null, null, null,
    'Unit 9900 background is a very strong fit. Runtime cloud security is a growing field. Early-stage means high learning velocity.',
    'Intelligence background, OSINT skills, analytical thinking, ability to work with ambiguous data.',
    'Found via LinkedIn. Very relevant to Unit 9900 background. Small team, high impact. Not applied yet — need to research more.',
    'Upwind Security is running a selective 3-month Cybersecurity Bootcamp for outstanding students with technical backgrounds.',
    '2026-04-20T10:00:00Z',
    '2026-04-25T11:00:00Z'
  );


-- =============================================================================
-- interview_stages
-- =============================================================================
insert into interview_stages (
  id, user_id, application_id, type, stage_order,
  scheduled_at, completed_at, duration_minutes,
  interviewer, interviewer_title, outcome, notes, next_steps
)
values
  -- Amazon: Phone Screen (completed)
  (
    'i0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Phone Screen', 1,
    '2026-04-05T11:00:00Z',
    '2026-04-05T11:30:00Z',
    30,
    'Noa Ben-David', 'Technical Recruiter',
    'Passed',
    'Quick intro call. Asked about background, SQL experience, availability. Moved to technical round.',
    'Technical interview with engineering team'
  ),
  -- Amazon: Technical Interview (upcoming)
  (
    'i0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Technical', 2,
    '2026-05-08T14:00:00Z',
    null,
    60,
    'Ran Levi', 'Senior Data Engineer',
    'Pending',
    'Upcoming. Will cover SQL (complex queries, optimization), Python (data manipulation), and one system design question.',
    null
  ),
  -- MyHeritage: HR Interview (upcoming)
  (
    'i0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'HR Interview', 1,
    '2026-05-07T10:00:00Z',
    null,
    45,
    'Tal Katz', 'HR Manager',
    'Pending',
    'First interview. Cover: background, why MyHeritage, project management experience, availability.',
    null
  ),
  -- Wix: HR Interview (completed)
  (
    'i0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000004',
    'HR Interview', 1,
    '2026-04-12T13:00:00Z',
    '2026-04-12T13:45:00Z',
    45,
    'Lihi Shachar', 'Talent Partner',
    'Passed',
    'Great conversation. She was excited about the GIS background. Asked about product instincts and why Wix. Moved to home assignment.',
    'Complete product case study assignment'
  );


-- =============================================================================
-- tasks
-- =============================================================================
insert into tasks (
  id, user_id, application_id, company_id, company_name,
  title, description, category, priority, status, due_at, completed_at,
  created_at, updated_at
)
values
  (
    't0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Amazon',
    'Prepare SQL questions for Amazon technical interview',
    'Cover: window functions, CTEs, query optimization, explain plans. Practice on LeetCode SQL track.',
    'Preparation', 'Critical', 'In Progress',
    '2026-05-07T23:59:00Z', null,
    '2026-04-20T09:00:00Z', '2026-05-02T10:00:00Z'
  ),
  (
    't0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Amazon',
    'Prepare Amazon Leadership Principles answers (STAR format)',
    'Prepare 2 stories per LP, focus on: Dive Deep, Are Right A Lot, Deliver Results, Bias for Action, Customer Obsession.',
    'Preparation', 'Critical', 'In Progress',
    '2026-05-07T23:59:00Z', null,
    '2026-04-21T09:00:00Z', '2026-05-01T14:00:00Z'
  ),
  (
    't0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000004',
    'Wix',
    'Complete Wix Product Case Study assignment',
    'Improve a Wix feature for small business owners. Structure: user research → problem definition → solution → metrics → roadmap.',
    'Assignment', 'Critical', 'In Progress',
    '2026-05-09T23:59:00Z', null,
    '2026-04-13T09:00:00Z', '2026-05-02T09:00:00Z'
  ),
  (
    't0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'MyHeritage',
    'Prepare for MyHeritage HR Screen interview',
    'Review MyHeritage product, prepare why MyHeritage answer, rehearse project management examples from Unit 9900.',
    'Preparation', 'High', 'Todo',
    '2026-05-06T23:59:00Z', null,
    '2026-04-30T10:00:00Z', '2026-04-30T10:00:00Z'
  ),
  (
    't0000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'MyHeritage',
    'Review submitted CV for MyHeritage',
    'Check that the product-leaning CV properly highlights cross-functional PM experience and JIRA/Agile skills.',
    'Application', 'Medium', 'Done',
    '2026-03-31T23:59:00Z',
    '2026-03-30T16:00:00Z',
    '2026-03-28T09:00:00Z', '2026-03-30T16:00:00Z'
  ),
  (
    't0000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000004',
    'Wix',
    'Send follow-up email to recruiter at Wix after assignment',
    'After submitting the home assignment, send a polite follow-up to Lihi confirming receipt and expressing continued enthusiasm.',
    'Follow-up', 'High', 'Todo',
    '2026-05-10T12:00:00Z', null,
    '2026-04-13T10:00:00Z', '2026-04-13T10:00:00Z'
  ),
  (
    't0000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    'Mobileye',
    'Research Mobileye autonomous driving stack',
    'Understand EyeQ chips, MobilEye Shield+, AV roadmap. Read their engineering blog and recent patents.',
    'Research', 'Medium', 'In Progress',
    '2026-05-12T23:59:00Z', null,
    '2026-04-11T09:00:00Z', '2026-04-20T14:00:00Z'
  ),
  (
    't0000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000005',
    'Upwind',
    'Research Upwind and cloud security landscape',
    'Read about CNAPP, CSPM, eBPF. Understand what makes Upwind different from Wiz and Orca. Find the right person to reach out to.',
    'Research', 'Low', 'Todo',
    '2026-05-15T23:59:00Z', null,
    '2026-04-20T11:00:00Z', '2026-04-20T11:00:00Z'
  ),
  (
    't0000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000001',
    null, null, null,
    'Update LinkedIn profile headline and about section',
    'Update headline to reflect current search focus. Add recent BGU project and GIS coursework.',
    'Admin', 'Low', 'Todo',
    '2026-05-20T23:59:00Z', null,
    '2026-04-15T09:00:00Z', '2026-04-15T09:00:00Z'
  ),
  (
    't0000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Amazon',
    'Write up notes from Amazon phone screen',
    'Document what was discussed, what went well, what to improve for the technical round.',
    'Admin', 'Medium', 'Done',
    '2026-04-06T23:59:00Z',
    '2026-04-05T18:00:00Z',
    '2026-04-05T16:00:00Z', '2026-04-05T18:00:00Z'
  ),
  (
    't0000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Amazon',
    'Practice Python data manipulation for Amazon interview',
    'Focus on Pandas: groupby, merge, pivot, apply. Also review list comprehensions, generators, and OOP basics.',
    'Preparation', 'High', 'Todo',
    '2026-05-07T23:59:00Z', null,
    '2026-04-25T09:00:00Z', '2026-04-25T09:00:00Z'
  );


-- =============================================================================
-- contacts
-- =============================================================================
insert into contacts (
  id, user_id, company_id, application_id, company_name,
  name, title, type, email, linkedin_url,
  notes, last_interaction_at, follow_up_due_at,
  created_at, updated_at
)
values
  (
    'n0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Amazon',
    'Noa Ben-David', 'Technical Recruiter', 'Recruiter',
    'noa.bendavid@amazon.com',
    'https://linkedin.com/in/noa-bendavid',
    'Very responsive. Prefers email. Reached out via LinkedIn first. Good signal — she fast-tracked us.',
    '2026-04-05T12:00:00Z', '2026-05-08T18:00:00Z',
    '2026-03-20T09:00:00Z', '2026-05-02T10:00:00Z'
  ),
  (
    'n0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Amazon',
    'Ran Levi', 'Senior Data Engineer', 'Hiring Manager',
    null,
    'https://linkedin.com/in/ran-levi-aws',
    'Will be the technical interviewer on May 8. Ex-Check Point. Probably deep on SQL optimization — prep accordingly.',
    '2026-04-05T11:30:00Z', null,
    '2026-04-06T09:00:00Z', '2026-04-06T09:00:00Z'
  ),
  (
    'n0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'MyHeritage',
    'Tal Katz', 'HR Manager', 'HR',
    'tal.katz@myheritage.com',
    'https://linkedin.com/in/tal-katz',
    'Scheduled the HR screen for May 7. Seems friendly and organized.',
    '2026-04-30T14:00:00Z', '2026-05-07T18:00:00Z',
    '2026-04-28T10:00:00Z', '2026-04-30T14:00:00Z'
  ),
  (
    'n0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000004',
    'Wix',
    'Lihi Shachar', 'Talent Partner', 'Recruiter',
    'lihi.shachar@wix.com',
    'https://linkedin.com/in/lihi-shachar',
    'Was really enthusiastic about the GIS background. Quick to respond. Mentioned VP Product is involved in final decisions.',
    '2026-04-12T14:00:00Z', '2026-05-10T12:00:00Z',
    '2026-03-22T09:00:00Z', '2026-04-12T14:00:00Z'
  ),
  (
    'n0000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000003',
    'Mobileye',
    'Yoav Shapira', 'Program Manager, Autonomous Driving', 'Employee',
    null,
    'https://linkedin.com/in/yoav-shapira-mobileye',
    'Found via LinkedIn. BGU alumni. Agreed to an informal coffee chat. Very helpful about the interview process.',
    '2026-04-15T09:00:00Z', null,
    '2026-04-12T10:00:00Z', '2026-04-15T09:00:00Z'
  ),
  (
    'n0000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000004',
    'Wix',
    'Dana Cohen', 'Product Manager', 'Referral',
    'dana@example.com',
    'https://linkedin.com/in/dana-cohen-wix',
    'Friend of a friend. Was a Wix PM Student. Gave great insider tips on the home assignment format.',
    '2026-04-14T16:00:00Z', null,
    '2026-04-13T11:00:00Z', '2026-04-14T16:00:00Z'
  ),
  (
    'n0000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Amazon',
    'Michael Torres', 'Software Engineer', 'Other',
    null,
    'https://linkedin.com/in/michael-torres-amzn',
    'Met at a tech meetup. Works on the AWS data team. Gave informal advice on the interview process.',
    '2026-03-28T19:00:00Z', null,
    '2026-03-28T20:00:00Z', '2026-03-28T20:00:00Z'
  );


-- =============================================================================
-- calendar_events
-- =============================================================================
insert into calendar_events (
  id, user_id, application_id, contact_id,
  title, type, company_name, application_name,
  starts_at, ends_at, all_day,
  location, meeting_url, description, reminder_minutes,
  created_at, updated_at
)
values
  (
    'e0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'n0000000-0000-0000-0000-000000000002',
    'Amazon Technical Interview — SQL & Python',
    'Interview',
    'Amazon', 'Data Engineer Intern',
    '2026-05-08T14:00:00Z', '2026-05-08T15:00:00Z', false,
    'Google Meet', 'https://meet.google.com/abc-defg-hij',
    'Technical interview with Ran Levi. Focus: SQL complex queries, Python/Pandas, one system design question.',
    60,
    '2026-04-06T09:00:00Z', '2026-04-06T09:00:00Z'
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000004',
    null,
    'Wix Home Assignment Due',
    'Assignment Deadline',
    'Wix', 'Product Manager Student Program',
    '2026-05-09T21:59:00Z', null, false,
    null, null,
    'Submit the product case study: improving a Wix feature for small business owners.',
    1440,
    '2026-04-13T09:00:00Z', '2026-04-13T09:00:00Z'
  ),
  (
    'e0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'n0000000-0000-0000-0000-000000000003',
    'MyHeritage HR Screen — Tal Katz',
    'Interview',
    'MyHeritage', 'Project Manager Student',
    '2026-05-07T10:00:00Z', '2026-05-07T10:45:00Z', false,
    'Zoom', 'https://zoom.us/j/123456789',
    'First interview with Tal Katz (HR Manager). Cover background, why MyHeritage, PM experience.',
    30,
    '2026-04-30T14:00:00Z', '2026-04-30T14:00:00Z'
  ),
  (
    'e0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    null,
    'Amazon Interview Prep Session',
    'Preparation Session',
    'Amazon', 'Data Engineer Intern',
    '2026-05-06T18:00:00Z', '2026-05-06T20:00:00Z', false,
    null, null,
    'Final prep session: 2 hrs SQL practice + Leadership Principles review',
    null,
    '2026-05-01T09:00:00Z', '2026-05-01T09:00:00Z'
  ),
  (
    'e0000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000004',
    'n0000000-0000-0000-0000-000000000004',
    'Send follow-up to Wix after assignment',
    'Follow-up Reminder',
    'Wix', 'Product Manager Student Program',
    '2026-05-10T12:00:00Z', null, false,
    null, null,
    'Email Lihi confirming assignment submission and expressing continued interest.',
    60,
    '2026-04-13T10:00:00Z', '2026-04-13T10:00:00Z'
  ),
  (
    'e0000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000003',
    null,
    'Mobileye research + reach out to Yoav',
    'General Task',
    'Mobileye', 'Project Manager Student',
    '2026-05-12T14:00:00Z', '2026-05-12T16:00:00Z', false,
    null, null,
    'Read Mobileye engineering blog, prepare questions for Yoav coffee chat',
    null,
    '2026-04-11T09:00:00Z', '2026-04-11T09:00:00Z'
  ),
  (
    'e0000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    null,
    'Amazon — SQL Prep Deadline',
    'Application Deadline',
    'Amazon', 'Data Engineer Intern',
    '2026-05-07T21:59:00Z', null, false,
    null, null,
    'Self-imposed deadline: complete all SQL prep before the technical interview',
    120,
    '2026-04-20T09:00:00Z', '2026-04-20T09:00:00Z'
  ),
  (
    'e0000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000001',
    null, null,
    'Update LinkedIn & resume',
    'General Task',
    null, null,
    '2026-05-14T10:00:00Z', '2026-05-14T11:30:00Z', false,
    null, null,
    'Update LinkedIn headline, about section, and skills. Reflect current job search focus.',
    null,
    '2026-04-15T09:00:00Z', '2026-04-15T09:00:00Z'
  ),
  (
    'e0000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    null,
    'Review MyHeritage application status',
    'Follow-up Reminder',
    'MyHeritage', 'Project Manager Student',
    '2026-04-28T10:00:00Z', null, false,
    null, null,
    'Follow up with Tal if no response after 2 weeks',
    null,
    '2026-04-01T10:00:00Z', '2026-04-01T10:00:00Z'
  ),
  (
    'e0000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    null,
    'Finalize Amazon phone screen notes',
    'General Task',
    'Amazon', 'Data Engineer Intern',
    '2026-04-30T18:00:00Z', null, false,
    null, null,
    'Write up and organize notes from the phone screen',
    null,
    '2026-04-05T18:00:00Z', '2026-04-05T18:00:00Z'
  );


-- =============================================================================
-- documents
-- =============================================================================
insert into documents (id, user_id, application_id, name, type, file_name, file_size, notes, created_at, updated_at)
values
  (
    'd0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Cover Letter — Amazon Data Engineer',
    'Cover Letter',
    'Cover_Letter_Amazon_DE_2026.pdf', 85000,
    'Emphasizes big data experience and Amazon LP alignment.',
    '2026-03-18T10:00:00Z', '2026-03-18T10:00:00Z'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000004',
    'Cover Letter — Wix PM Program',
    'Cover Letter',
    'Cover_Letter_Wix_PM_2026.pdf', 82000,
    'Focuses on product instinct, data-driven thinking, and Wix product love.',
    '2026-03-20T09:00:00Z', '2026-03-20T09:00:00Z'
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    null,
    'BGU Academic Transcript',
    'Transcript',
    'BGU_Transcript_2026.pdf', 340000,
    'GPA 88. Sent only when requested.',
    '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Data Projects Portfolio',
    'Portfolio',
    'Shay_Silversmith_Portfolio_2026.pdf', 1200000,
    'PDF portfolio with screenshots and descriptions of 4 data projects.',
    '2026-02-28T14:00:00Z', '2026-03-15T10:00:00Z'
  ),
  (
    'd0000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'DataCamp SQL Certification',
    'Certificate',
    'DataCamp_SQL_Certificate.pdf', 145000,
    'Completed DataCamp SQL track certificate.',
    '2026-02-15T09:00:00Z', '2026-02-15T09:00:00Z'
  );


-- =============================================================================
-- prepared_answers (first 4 from mock; abridged for seed length)
-- =============================================================================
insert into prepared_answers (
  id, user_id, application_id,
  question, category, answer,
  tags, confidence, is_ready, last_updated_at, created_at, updated_at
)
values
  (
    'p0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    null,
    'Tell me about yourself',
    'Personal Pitch',
    'I''m a third-year Information Systems Engineering student at Ben-Gurion University. Before starting my degree, I served for two years in Unit 9900 — the IDF''s geospatial intelligence unit — where I worked on large-scale GIS and data systems under operational conditions. That experience gave me strong analytical foundations and the ability to drive clarity in ambiguous, high-stakes environments.

At BGU, I''m deepening my technical skills in data engineering, systems design, and product development. I''ve led a cross-disciplinary capstone project and won a hackathon building a data-driven urban mobility app.

I''m now looking for a student role where I can combine my technical depth with product or project management — specifically in tech companies building things that matter at scale.',
    array['intro','background','opening'],
    5, true,
    '2026-04-25T14:00:00Z', '2026-03-01T09:00:00Z', '2026-03-01T09:00:00Z'
  ),
  (
    'p0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Why Amazon?',
    'HR',
    'Amazon operates at a scale that''s genuinely hard to replicate anywhere else — petabyte-scale data problems, global infrastructure, and the discipline of the Leadership Principles creating a consistent engineering culture.

Specifically for the Data Engineer role: I want to work on real production data pipelines, not toy datasets. The AWS ecosystem (Redshift, Glue, Spark on EMR) is the industry standard for what I want to do long-term, and getting hands-on experience here would compress years of learning into months.

The Leadership Principles also resonate with me personally. "Dive Deep" and "Are Right A Lot" describe how I operated in Unit 9900 — where precision mattered and assumptions could be costly.',
    array['motivation','amazon','company-specific'],
    4, true,
    '2026-04-28T11:00:00Z', '2026-03-20T09:00:00Z', '2026-03-20T09:00:00Z'
  ),
  (
    'p0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000004',
    'Why Wix? Why Product Management?',
    'HR',
    'Why Wix: I''ve been a Wix user — I actually built a portfolio site for a side project on Wix. What impressed me wasn''t just the tool but the product decisions behind it: how they balance simplicity for non-technical users with power for developers. That''s a genuinely hard product problem, and I want to work on it from the inside.

Why PM: I keep gravitating toward the "why" questions — why are we building this, who is it for, how do we know it worked? In Unit 9900, even as a technical contributor, I ended up driving decisions about what data to collect and why. PM is the natural fit.',
    array['motivation','wix','pm','company-specific'],
    4, true,
    '2026-04-20T14:00:00Z', '2026-03-22T09:00:00Z', '2026-03-22T09:00:00Z'
  ),
  (
    'p0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    null,
    'Tell me about your military service in Unit 9900',
    'Behavioral',
    'Unit 9900 is the IDF''s visual intelligence and geospatial analysis unit. My role involved working with large-scale GIS data — satellite imagery, sensor data, spatial databases — to extract actionable intelligence under tight timelines.

The technical side: I worked with PostGIS, Python scripting, and QGIS on datasets of thousands of records per day. I also contributed to automating parts of a manual analysis pipeline, which cut processing time by roughly 40%.

The professional side: I learned to communicate under uncertainty, prioritize ruthlessly, and work across unit boundaries with people who had very different specializations.',
    array['military','unit-9900','background','gis'],
    5, true,
    '2026-04-22T10:00:00Z', '2026-03-01T09:00:00Z', '2026-03-01T09:00:00Z'
  );


-- =============================================================================
-- ai_summaries
-- =============================================================================
insert into ai_summaries (id, user_id, tool_type, entity_type, entity_id, input_data, output_data, is_mocked, created_at)
values
  (
    'ai000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Company Summary',
    'application',
    'b0000000-0000-0000-0000-000000000001',
    '{"companyName":"Amazon","targetRole":"Data Engineer Intern"}'::jsonb,
    '{
      "mission": "To be Earth''s most customer-centric company, enabling anyone to find and discover anything they want to buy online.",
      "culture": "Driven by 16 Leadership Principles. High-performance, data-driven, and customer-obsessed culture. Engineers are expected to own their domain end-to-end. Strong bias for written communication (6-pager memos).",
      "recentNews": "AWS re:Invent 2025 announcements: new Redshift Serverless capabilities, Amazon Q for data engineering workflows, expanded Bedrock foundation model offerings.",
      "interviewTips": "Every interview question can and should be answered through a Leadership Principle lens. Prepare 2 STAR stories per LP. The bar-raiser will challenge you on depth — be ready to Dive Deep into specifics.",
      "redFlags": "Work-life balance concerns are common in Glassdoor reviews. Amazon Israel is smaller and more autonomous than US offices, which can be positive for students.",
      "fitAssessment": "Strong fit for Shay. Unit 9900 GIS/data work directly maps to AWS data platform work. LP stories around Dive Deep and Invent and Simplify are authentic and strong."
    }'::jsonb,
    true,
    '2026-04-20T14:00:00Z'
  ),
  (
    'ai000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'JD Parser',
    'application',
    'b0000000-0000-0000-0000-000000000001',
    '{"jobDescription":"Amazon Data Engineer Intern JD"}'::jsonb,
    '{
      "mustHaveSkills": "SQL (complex queries, optimization), Python (Pandas/PySpark), AWS basics, analytical mindset",
      "niceToHaveSkills": "Apache Spark, Kafka, data warehousing (star/snowflake schema), Git",
      "keyResponsibilities": "ETL pipeline design, AWS service integration (Redshift/Glue/S3/Lambda), collaboration with data scientists, query optimization",
      "cultureFit": "Customer obsession, bias for action, ownership mentality, ability to work with ambiguity",
      "interviewFocus": "Technical round will likely cover: 2-3 SQL problems (medium-hard complexity), Python/Pandas manipulation, one system design question around data pipelines",
      "coverageScore": "88/100 — CV covers most must-haves. Gap: no explicit Spark experience mentioned. Recommend adding GeoPandas pipeline work as a proxy."
    }'::jsonb,
    true,
    '2026-04-21T09:00:00Z'
  ),
  (
    'ai000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Prepare Me',
    'application',
    'b0000000-0000-0000-0000-000000000001',
    '{"interviewType":"Technical Interview","interviewDate":"2026-05-08","role":"Data Engineer Intern"}'::jsonb,
    '{
      "likelyTopics": "1. SQL: Window functions, CTEs, query optimization (EXPLAIN ANALYZE)\n2. Python: Pandas manipulation, GroupBy, Merge, handling NaN\n3. System Design: Design a data pipeline for a specific use case\n4. Leadership Principles: 2-3 behavioral questions",
      "practiceQuestions": "SQL: Find the top 3 products by revenue per category using window functions.\nPython: Given a DataFrame with missing values, describe your approach to cleaning it.\nSystem Design: Design a pipeline that ingests 10M events/day from a web app.",
      "studyPlan": "Day 1-2: SQL practice (LeetCode SQL 50). Day 3: Python/Pandas review. Day 4: System design concepts. Day 5: LP stories. Day 6: Mock interview.",
      "prepTips": "Lead with your Unit 9900 experience when asked behavioral questions. On SQL, always explain your thought process aloud. On system design, start with requirements before drawing any architecture."
    }'::jsonb,
    true,
    '2026-04-22T10:00:00Z'
  ),
  (
    'ai000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Interview Summary',
    'application',
    'b0000000-0000-0000-0000-000000000001',
    '{"interviewType":"Phone Screen","date":"2026-04-05","interviewer":"Noa Ben-David"}'::jsonb,
    '{
      "keyMoments": "Strong opener: Unit 9900 introduction landed well (Noa mentioned it was impressive). SQL section: confident answers on joins and GROUP BY. Weak moment: stumbled on question about Spark experience.",
      "whatWorked": "Clear, structured answers. Good energy. Translated military experience into business value effectively.",
      "whatToImprove": "Add Spark to study plan before technical round. Prepare a more specific answer about familiarity with AWS services.",
      "overallSentiment": "Positive — Noa was engaged throughout and fast-tracked to next round. Good signal.",
      "nextSteps": "Prepare for technical interview: SQL (window functions, optimization), Python/Pandas, one system design question. Study Amazon LP stories."
    }'::jsonb,
    true,
    '2026-04-06T09:00:00Z'
  ),
  (
    'ai000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'Follow-up Message',
    'application',
    'b0000000-0000-0000-0000-000000000004',
    '{"recipientName":"Lihi Shachar","occasion":"After submitting home assignment","tone":"Professional, warm"}'::jsonb,
    '{
      "subject": "Wix PM Program — Home Assignment Submitted",
      "message": "Hi Lihi,\n\nI wanted to let you know I''ve submitted the home assignment — it was a really engaging challenge. I focused on improving the Wix onboarding experience for small business owners, with a proposal built around reducing post-launch anxiety through lightweight site versioning.\n\nI enjoyed the process and it confirmed my genuine excitement about the product problems Wix is solving.\n\nLooking forward to your feedback and to the next steps.\n\nBest,\nShay",
      "tone": "Professional but warm. Shows product thinking without being over-eager."
    }'::jsonb,
    true,
    '2026-05-02T10:00:00Z'
  ),
  (
    'ai000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'Personalized Answer',
    'application',
    'b0000000-0000-0000-0000-000000000001',
    '{"question":"Tell me about a time you delivered results under pressure","company":"Amazon","lpFocus":"Deliver Results"}'::jsonb,
    '{
      "answer": "**Situation:** During my service in Unit 9900, we received a time-critical analytical request with a 3-hour deadline — significantly shorter than our standard process of 8-12 hours.\n\n**Task:** I needed to deliver a complete spatial analysis without compromising accuracy.\n\n**Action:** I immediately triaged the request: what was truly required vs. nice-to-have. I ran critical analysis paths in parallel, automated the most repetitive verification steps with a quick Python script, and handed off summary components to a colleague while I focused on the highest-uncertainty data.\n\n**Result:** Delivered a complete, verified output in 2h45m — 15 minutes ahead of deadline.\n\n**Amazon LP connection:** This is Deliver Results — never accepting that something is impossible without first asking what can be restructured. It''s also Bias for Action — moving quickly once the path is clear.",
      "tips": "Lead with specifics. Amazon interviewers will ask ''tell me more'' to test depth — prepare two follow-up levels for each story. Quantify where possible."
    }'::jsonb,
    true,
    '2026-04-28T14:00:00Z'
  );


-- =============================================================================
-- recent_activity
-- =============================================================================
insert into recent_activity (id, user_id, activity_type, entity_type, entity_id, title, description, created_at)
values
  (
    'ac000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'stage_changed', 'application', 'b0000000-0000-0000-0000-000000000001',
    'Amazon advanced to Technical Interview',
    'Stage moved from HR Screen → Technical Interview',
    '2026-04-06T09:30:00Z'
  ),
  (
    'ac000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'interview_scheduled', 'application', 'b0000000-0000-0000-0000-000000000001',
    'Amazon Technical Interview scheduled',
    'Interview scheduled for May 8 at 14:00 with Ran Levi',
    '2026-04-06T09:00:00Z'
  ),
  (
    'ac000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'stage_changed', 'application', 'b0000000-0000-0000-0000-000000000004',
    'Wix advanced to Home Assignment',
    'Stage moved from HR Screen → Home Assignment',
    '2026-04-12T14:00:00Z'
  ),
  (
    'ac000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'contact_added', 'contact', 'n0000000-0000-0000-0000-000000000003',
    'Added Tal Katz (MyHeritage)',
    'HR Manager at MyHeritage added to contacts',
    '2026-04-28T10:00:00Z'
  ),
  (
    'ac000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'task_completed', 'task', 't0000000-0000-0000-0000-000000000005',
    'Task completed: Review submitted CV for MyHeritage',
    'Marked as done',
    '2026-03-30T16:00:00Z'
  ),
  (
    'ac000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'application_created', 'application', 'b0000000-0000-0000-0000-000000000003',
    'Added Mobileye — Project Manager Student',
    'New application created',
    '2026-04-08T09:00:00Z'
  ),
  (
    'ac000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'note_added', 'application', 'b0000000-0000-0000-0000-000000000001',
    'Note added to Amazon',
    'Updated prep notes after phone screen',
    '2026-04-05T18:30:00Z'
  ),
  (
    'ac000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000001',
    'document_added', 'document', 'd0000000-0000-0000-0000-000000000004',
    'Portfolio uploaded',
    'Data Projects Portfolio added to documents',
    '2026-03-15T10:00:00Z'
  ),
  (
    'ac000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000001',
    'task_completed', 'task', 't0000000-0000-0000-0000-000000000010',
    'Task completed: Write up Amazon phone screen notes',
    'Marked as done',
    '2026-04-05T18:00:00Z'
  ),
  (
    'ac000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'application_created', 'application', 'b0000000-0000-0000-0000-000000000005',
    'Added Upwind — Cybersecurity Bootcamp',
    'New application created',
    '2026-04-20T10:00:00Z'
  );
