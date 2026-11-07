-- Sample text with a model analysis following the 5-step Terminale method
-- (Introduction, Summary, Commentary, Evaluation, Branching out). See docs/ANALYSIS_METHOD.md.
with t as (
  insert into public.texts (title, series, body, analysis, vocabulary, grammar_tips)
  values (
    'Mobile Phones at School (sample)',
    '{}',
    $b$Mobile phones are now part of students' daily life. Many pupils use them to look for information and to talk with their families. However, some teachers think that phones distract students during lessons. For this reason, several schools have decided to limit their use. In my opinion, the best solution is to teach young people how to use technology wisely.$b$,
    $j$[
      {"title":"1. Introduction","content":"The text entitled “Mobile Phones at School” is an extract from a school magazine. Its author is not mentioned and the date of publication is not given. It is a press article. In terms of genre, the text is argumentative. It deals with the place of mobile phones in students' lives: they are useful but they can distract learners. The writer's intention is to convince the reader that young people should be taught to use technology wisely."},
      {"title":"2. Summary","content":"The text can be divided into three parts. The first part is from the beginning to “their families” and is about the advantages of phones. The second part starts from “However” and goes down to “limit their use”; it deals with the problems phones cause and the reaction of schools. The third and last part is the final sentence; it gives the writer's solution. To sum up, the writer explains that pupils use phones to look for information and to talk with their families, but that some teachers think phones distract students, so several schools limit them. He suggests teaching young people to use technology wisely."},
      {"title":"3. Commentary","content":"I will comment on the structure of the argument. The text is built on a contrast between the advantages and the problems of phones, and the connector “However” marks this opposition. Then the writer moves from facts to a personal solution, as shown by the expression “In my opinion”. The tone is argumentative but moderate."},
      {"title":"4. Evaluation","content":"From the point of view of its value, the text is interesting from a social and educational angle because it deals with a daily issue. I have learnt that prohibition is not the only solution. The author's opinion is that education is better than prohibition. Personally, I agree with the writer because students can learn to manage their time and use their phones for their studies."},
      {"title":"5. Branching out","content":"This text reminds me of the use of phones in my own school. Many students use them to share lessons with classmates, but some also waste time on social media. After reading this text, I think we need clear rules and good habits."}
    ]$j$::jsonb,
    $j$[
      {"word":"distract","meaning":"distraire","example":"Noise can distract students."},
      {"word":"wisely","meaning":"avec sagesse","example":"Use your time wisely."},
      {"word":"limit","meaning":"limiter","example":"Schools limit phone use."}
    ]$j$::jsonb,
    $j$[
      {"title":"However","content":"Use 'However,' to introduce a contrast with the previous sentence. It is followed by a comma."},
      {"title":"Think that","content":"'Some teachers think that ...' introduces an opinion. The verb after 'that' keeps the normal tense."}
    ]$j$::jsonb
  ) returning id
)
insert into public.exercises (text_id, kind, title, items)
select t.id, k.kind, k.title, k.items from t, (values
  ('vocab', 'Vocabulary quiz', $j$[
    {"q":"'distract' means:","choices":["distraire","punir","aider"],"answer":0,"explain":"To distract = to take attention away."},
    {"q":"'wisely' means:","choices":["rapidement","avec sagesse","rarement"],"answer":1,"explain":"Wisely = in a sensible way."}
  ]$j$::jsonb),
  ('grammar', 'Grammar quiz', $j$[
    {"q":"Phones are useful. ___, they can distract students.","choices":["Because","However","So"],"answer":1,"explain":"'However' marks a contrast."},
    {"q":"Some teachers ___ that phones are a problem.","choices":["thinks","think","thinking"],"answer":1,"explain":"Plural subject: 'think'."}
  ]$j$::jsonb)
) as k(kind, title, items);

-- Make a teacher account (after creating the user in Authentication > Users):
-- insert into public.profiles (id, role, first_name, last_name)
-- values ('<AUTH-USER-UUID>', 'teacher', 'Firstname', 'Lastname');
