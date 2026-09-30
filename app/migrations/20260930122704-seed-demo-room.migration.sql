-- seed demo room
/** @env development */

insert into users (id, name) values
  ('0190a000-0000-7000-8000-000000000001', 'Priya Raman'),
  ('0190a000-0000-7000-8000-000000000002', 'Marcus Chen'),
  ('0190a000-0000-7000-8000-000000000003', 'Sofia Alvarez'),
  ('0190a000-0000-7000-8000-000000000004', 'Dev Okafor'),
  ('0190a000-0000-7000-8000-000000000005', 'Hana Kim');

insert into rooms (id, code, name, facilitatorId)
     values ('0190a000-0000-7000-8000-0000000000a1', 'sprint42', 'Checkout Squad · Sprint 42', '0190a000-0000-7000-8000-000000000001');

insert into participants (roomId, userId, name, createdAt)
  select '0190a000-0000-7000-8000-0000000000a1', id, name, now() - interval '2 hours' + (row_number() over (order by id)) * interval '1 minute'
    from users
   where id::text like '0190a000-0000-7000-8000-00000000000%';

insert into stories (id, roomId, title, url, status, round, estimate, average, voteCount, estimatedAt, createdAt) values
  ('0190a000-0000-7000-8000-0000000000b1', '0190a000-0000-7000-8000-0000000000a1', 'Guest checkout: remember the shipping address', 'https://tracker.example.com/CHK-311', 'estimated', 1, '5', 5.2, 5, now() - interval '95 minutes', now() - interval '2 hours'),
  ('0190a000-0000-7000-8000-0000000000b2', '0190a000-0000-7000-8000-0000000000a1', 'Apple Pay on the payment step', 'https://tracker.example.com/CHK-318', 'estimated', 2, '8', 8.4, 5, now() - interval '80 minutes', now() - interval '119 minutes'),
  ('0190a000-0000-7000-8000-0000000000b3', '0190a000-0000-7000-8000-0000000000a1', 'Fix rounding on split-tender refunds', 'https://tracker.example.com/CHK-322', 'estimated', 1, '3', 3.2, 5, now() - interval '70 minutes', now() - interval '118 minutes'),
  ('0190a000-0000-7000-8000-0000000000b4', '0190a000-0000-7000-8000-0000000000a1', 'Promo code field ignores letter case', 'https://tracker.example.com/CHK-325', 'estimated', 1, '1', 1.2, 5, now() - interval '62 minutes', now() - interval '117 minutes'),
  ('0190a000-0000-7000-8000-0000000000b5', '0190a000-0000-7000-8000-0000000000a1', 'Redesign the order confirmation email', 'https://tracker.example.com/CHK-329', 'voting', 1, null, null, 0, null, now() - interval '116 minutes'),
  ('0190a000-0000-7000-8000-0000000000b6', '0190a000-0000-7000-8000-0000000000a1', 'Retry failed card authorizations once', 'https://tracker.example.com/CHK-331', 'pending', 1, null, null, 0, null, now() - interval '115 minutes'),
  ('0190a000-0000-7000-8000-0000000000b7', '0190a000-0000-7000-8000-0000000000a1', 'Show a delivery estimate in the cart', 'https://tracker.example.com/CHK-334', 'pending', 1, null, null, 0, null, now() - interval '114 minutes');

update rooms
   set currentStoryId = '0190a000-0000-7000-8000-0000000000b5'
 where id = '0190a000-0000-7000-8000-0000000000a1';

-- The settled stories keep their revealed cards; the story on the table has
-- all five cards down, waiting on whoever joins next.
insert into votes (roomId, storyId, userId, round, card, revealed)
  select '0190a000-0000-7000-8000-0000000000a1', v.storyId::uuid, v.userId::uuid, v.round, v.card, v.revealed
    from (values
      ('0190a000-0000-7000-8000-0000000000b1', '0190a000-0000-7000-8000-000000000001', 1, '5', true),
      ('0190a000-0000-7000-8000-0000000000b1', '0190a000-0000-7000-8000-000000000002', 1, '5', true),
      ('0190a000-0000-7000-8000-0000000000b1', '0190a000-0000-7000-8000-000000000003', 1, '8', true),
      ('0190a000-0000-7000-8000-0000000000b1', '0190a000-0000-7000-8000-000000000004', 1, '3', true),
      ('0190a000-0000-7000-8000-0000000000b1', '0190a000-0000-7000-8000-000000000005', 1, '5', true),
      ('0190a000-0000-7000-8000-0000000000b2', '0190a000-0000-7000-8000-000000000001', 2, '8', true),
      ('0190a000-0000-7000-8000-0000000000b2', '0190a000-0000-7000-8000-000000000002', 2, '13', true),
      ('0190a000-0000-7000-8000-0000000000b2', '0190a000-0000-7000-8000-000000000003', 2, '8', true),
      ('0190a000-0000-7000-8000-0000000000b2', '0190a000-0000-7000-8000-000000000004', 2, '8', true),
      ('0190a000-0000-7000-8000-0000000000b2', '0190a000-0000-7000-8000-000000000005', 2, '5', true),
      ('0190a000-0000-7000-8000-0000000000b3', '0190a000-0000-7000-8000-000000000001', 1, '3', true),
      ('0190a000-0000-7000-8000-0000000000b3', '0190a000-0000-7000-8000-000000000002', 1, '2', true),
      ('0190a000-0000-7000-8000-0000000000b3', '0190a000-0000-7000-8000-000000000003', 1, '3', true),
      ('0190a000-0000-7000-8000-0000000000b3', '0190a000-0000-7000-8000-000000000004', 1, '5', true),
      ('0190a000-0000-7000-8000-0000000000b3', '0190a000-0000-7000-8000-000000000005', 1, '3', true),
      ('0190a000-0000-7000-8000-0000000000b4', '0190a000-0000-7000-8000-000000000001', 1, '1', true),
      ('0190a000-0000-7000-8000-0000000000b4', '0190a000-0000-7000-8000-000000000002', 1, '1', true),
      ('0190a000-0000-7000-8000-0000000000b4', '0190a000-0000-7000-8000-000000000003', 1, '2', true),
      ('0190a000-0000-7000-8000-0000000000b4', '0190a000-0000-7000-8000-000000000004', 1, '1', true),
      ('0190a000-0000-7000-8000-0000000000b4', '0190a000-0000-7000-8000-000000000005', 1, '1', true),
      ('0190a000-0000-7000-8000-0000000000b5', '0190a000-0000-7000-8000-000000000001', 1, '5', false),
      ('0190a000-0000-7000-8000-0000000000b5', '0190a000-0000-7000-8000-000000000002', 1, '8', false),
      ('0190a000-0000-7000-8000-0000000000b5', '0190a000-0000-7000-8000-000000000003', 1, '5', false),
      ('0190a000-0000-7000-8000-0000000000b5', '0190a000-0000-7000-8000-000000000004', 1, '3', false),
      ('0190a000-0000-7000-8000-0000000000b5', '0190a000-0000-7000-8000-000000000005', 1, '8', false)
    ) as v(storyId, userId, round, card, revealed);
