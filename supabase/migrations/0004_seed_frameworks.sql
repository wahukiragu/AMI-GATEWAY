-- =====================================================================
-- AMI Gateway: seed data
-- The Culture-Trade Gateway Framework, methodology draft v0.1.
-- To revise the framework, add a NEW version row and new stage rows in a
-- new migration and publish it. Never edit a published version in place:
-- connections keep the version they were logged under.
-- =====================================================================

insert into public.framework_versions (id, name, version, status, rights_holder, licence_notice, published_at)
values (
  '00000000-0000-4000-8000-000000000001',
  'Culture-Trade Gateway Framework',
  '0.1',
  'published',
  'African Musicology Institute (attribution and rights to be confirmed in writing)',
  'Draft methodology. Authorship, ownership and licence terms to be confirmed in writing between the rights holder and IPWORTH Ltd before wider use or publication.',
  now()
);

insert into public.framework_stages
  (framework_version_id, stage_no, name, short_label, meaning, example, evidence_guidance, event_types)
values
  ('00000000-0000-4000-8000-000000000001', 1, 'Exposure', 'Showcased or seen',
   'People encounter each other''s heritage: music, dress, instruments, ideas.',
   'A group performs, or a visitor watches a workshop.',
   'Programme, stream link or stall record.',
   array['Registered at the festival','Performed at the festival','Exhibited or sold at a stall','Presented a paper','Featured on live stream or podcast','Other']),
  ('00000000-0000-4000-8000-000000000001', 2, 'Curiosity', 'Asked for more',
   'Someone wants to know more or stay in touch.',
   'A visitor asks how to book a group or where to buy a garment.',
   'Message, email or a logged conversation.',
   array['Enquiry received','Asked for contact','Invited to a follow-up meeting','Requested a sample or demo','Other']),
   ('00000000-0000-4000-8000-000000000001', 3, 'Consumption', 'Value changed hands',
   'Someone gives something in return for what they discovered — money, a trade, or a swap of goods and skills.',
   'A guest buys a drum, trades a craft item for a ticket, or barters a skill for a workshop place.',
   'Receipt, payment record, or a description of what was exchanged.',
   array['Purchase','Ticket or entry paid','Trade or barter exchange','Download or stream paid','Workshop fee paid','Other']),
  ('00000000-0000-4000-8000-000000000001', 4, 'Exchange', 'Booked or contracted',
   'A booking, commission or order that involves an agreement.',
   'A venue books a choir, or a shop places a supply order.',
   'Contract, invoice or written confirmation.',
   array['Paid booking','Commission','Supply order','Contract signed','Other']),
  ('00000000-0000-4000-8000-000000000001', 5, 'Integration', 'Partnership or repeat trade',
   'The relationship becomes ongoing: repeat trade, joint work, formal links across borders.',
   'Repeat orders, a joint production, or an MoU.',
   'Signed agreement or a record of repeat trade.',
   array['Repeat order','Joint production','MoU or partnership','Import or export link','Other']);

insert into public.sdg_goals (no, name, featured) values
  (1,  'No poverty', false),
  (2,  'Zero hunger', false),
  (3,  'Good health and well-being', false),
  (4,  'Quality education', true),
  (5,  'Gender equality', true),
  (6,  'Clean water and sanitation', false),
  (7,  'Affordable and clean energy', false),
  (8,  'Decent work and economic growth', true),
  (9,  'Industry, innovation and infrastructure', true),
  (10, 'Reduced inequalities', true),
  (11, 'Sustainable cities and communities', true),
  (12, 'Responsible consumption and production', false),
  (13, 'Climate action', false),
  (14, 'Life below water', false),
  (15, 'Life on land', false),
  (16, 'Peace, justice and strong institutions', false),
  (17, 'Partnerships for the goals', true);

insert into public.editions (name, year, venue, is_current)
values ('AMI Festival 2026', 2026, 'University of Venda', true);
