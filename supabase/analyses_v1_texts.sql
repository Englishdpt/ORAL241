-- Model analyses (5-step Terminale method) for the 9 original texts.
-- Run AFTER import_v1_texts.sql. Authors, sources and dates are NOT in the supplied texts, so each
-- introduction says they are not given: edit that sentence once you know the real source of a text.

update public.texts set analysis = $j$[
 {
  "title": "1. Introduction",
  "content": "The text entitled “Entrepreneurship” is an article. Its author is not mentioned, and its source and date of publication are not given. In terms of genre, the text is informative and explanatory. It deals with entrepreneurship, that is, the ability to start and run a business, and its different types. The writer's intention is to inform the reader about what entrepreneurship is and to show its four main forms."
 },
 {
  "title": "2. Summary",
  "content": "The text can be divided into three parts. The first part, made of the first two paragraphs, defines entrepreneurship and explains its role in the economy. The second part, the third paragraph, says that entrepreneurship goes from small businesses to multinational companies. The third and last part goes from the fourth paragraph down to the end; it presents four types: small business, scalable startup, large company and social entrepreneurship. To sum up, entrepreneurship is the readiness to create and run a business despite uncertainty in order to make a profit, except social entrepreneurship, which only aims at solving social problems."
 },
 {
  "title": "3. Commentary",
  "content": "I will comment on the structure of the text. The writer moves from a general definition to a classification, then to a list of types, each introduced by its name followed by a dash, which makes the text clear and easy to follow. The text is also built on a contrast between small businesses, which aim at feeding a family, and scalable startups, which think their vision can change the world. The tone is simple and neutral because the writer only gives facts."
 },
 {
  "title": "4. Evaluation",
  "content": "The text is interesting from an economic and social point of view because it explains how businesses can create wealth. I have learnt that there are four types of entrepreneurship and that some entrepreneurs do not look for profit. The author's opinion is that entrepreneurship is an indispensable part of a nation's capacity to succeed. Personally, I agree with the writer because young people who create their own businesses help to reduce unemployment."
 },
 {
  "title": "5. Branching out",
  "content": "This text reminds me of the small businesses around me, such as hairdressers, shops and craftsmen. After reading this text, I think of the young entrepreneurs of my country who start small and dream big. One day, I would like to create my own business."
 }
]$j$::jsonb
where title = $t$ENTREPRENEURSHIP$t$ and owner_id is null;

update public.texts set analysis = $j$[
 {
  "title": "1. Introduction",
  "content": "The text entitled “The Importance of Physical Fitness” is an article. Its author is not mentioned, and its source and date of publication are not given. In terms of genre, the text is informative and argumentative. It deals with the benefits of regular physical activity for people of all ages. The writer's intention is to sensitize the reader and to persuade him to stay active throughout his life."
 },
 {
  "title": "2. Summary",
  "content": "The text can be divided into three parts. The first part, made of the first two paragraphs, says that physical activity is important for everyone and announces its benefits. The second part goes from the third paragraph to the sixth; it presents the benefits: fewer chronic diseases, a longer life, stronger muscles and bones, fewer injuries, and a better mood and mental health. The third and last part, the final paragraph, gives an example: climbing a mountain, an experience that people with fitness limitations cannot enjoy. To sum up, staying active improves health and quality of life."
 },
 {
  "title": "3. Commentary",
  "content": "I will comment on the use of facts and examples. To convince the reader, the writer quotes the Centers for Disease Control and Prevention, which says that chronic diseases cause 7 out of 10 deaths in the U.S. He also gives a concrete example: stronger muscles and better balance mean that you are less likely to slip and fall. The tone is serious and encouraging, and the text is built on a contrast between an active life and a sedentary lifestyle."
 },
 {
  "title": "4. Evaluation",
  "content": "The text is interesting from a health and social point of view because it concerns everybody. I have learnt that exercise also improves mood and mental health. The author's opinion is that physical activity is important at every stage of life. Personally, I agree with him because sport keeps the body strong and the mind clear."
 },
 {
  "title": "5. Branching out",
  "content": "This text reminds me of sport at school and in my neighbourhood. After reading this text, I think of my favourite sport, football, and of my team. I think that every student should practise a sport regularly."
 }
]$j$::jsonb
where title = $t$THE IMPORTANCE OF PHYSICAL FITNESS$t$ and owner_id is null;

update public.texts set analysis = $j$[
 {
  "title": "1. Introduction",
  "content": "The text entitled “Exports and Imports” is an article. Its author is not mentioned, and its source and date of publication are not given. In terms of genre, the text is informative and explanatory. It deals with exports and imports and their role in the health of an economy. The writer's intention is to explain to the reader what exports and imports are and why they matter."
 },
 {
  "title": "2. Summary",
  "content": "The text can be divided into three parts. The first part, made of the first two paragraphs, defines exports and explains why countries export, with the example of coffee. The second part, the third and fourth paragraphs, defines imports and shows that a high level of imports can be a sign of a growing economy, with the example of a paper company that buys a machine from Italy. The third and last part, from the fifth paragraph to the end, deals with the balance of trade, which can show a trade surplus or a trade deficit. To sum up, exports and imports together make up the balance of trade, which affects the health of an economy."
 },
 {
  "title": "3. Commentary",
  "content": "I will comment on the use of examples. To make abstract ideas clear, the writer gives concrete examples: Jamaica, Kenya and Colombia export coffee because of their climate, and an American company imports a machine because it is more cost effective. The text is also built on an opposition between exports and imports, and between a trade surplus and a trade deficit. The tone is simple and neutral."
 },
 {
  "title": "4. Evaluation",
  "content": "The text is interesting from an economic point of view because it explains how trade works between countries. I have learnt that importing is not always bad, especially when a country imports machines that increase its productivity. The author's opinion is that a healthy economy sees both exports and imports grow. Personally, I agree with the writer because no country produces everything it needs."
 },
 {
  "title": "5. Branching out",
  "content": "This text makes me think of my own country, Gabon, which exports oil, manganese and wood, and imports many products such as machines and food. After reading this text, I think we should produce more at home to reduce imports."
 }
]$j$::jsonb
where title = $t$EXPORTS AND IMPORTS$t$ and owner_id is null;

update public.texts set analysis = $j$[
 {
  "title": "1. Introduction",
  "content": "The text entitled “The Global Impact of Artificial Intelligence” is an article. Its author is not mentioned, and its source and date of publication are not given. In terms of genre, the text is expository and argumentative. It deals with artificial intelligence, its benefits and its risks for society. The writer's intention is to draw the reader's attention to both the opportunities and the dangers of artificial intelligence."
 },
 {
  "title": "2. Summary",
  "content": "The text can be divided into four parts. The first part, the first paragraph, defines artificial intelligence and says that it can transform every sector of society. The second part, the second paragraph, presents its applications and benefits, such as medical diagnosis, economic growth and personalised learning in education. The third part, the third paragraph, deals with the risks: job loss, inequality, bias, privacy problems and the spread of fake news. The fourth and last part, the conclusion, says that governments, industry and academia must work together. To sum up, artificial intelligence offers great benefits but needs to be controlled."
 },
 {
  "title": "3. Commentary",
  "content": "I will comment on the structure of the argument. The text is built on a contrast between the benefits and the risks of artificial intelligence, and the expression “On the other hand” marks this opposition. The writer supports his ideas with a reference to specialists, Russell and Norvig, and with many examples of applications. The tone is serious and balanced."
 },
 {
  "title": "4. Evaluation",
  "content": "The text is interesting from a scientific, social and ethical point of view because artificial intelligence now touches our daily lives. I have learnt that it can also threaten privacy and democracy. The author's opinion is that collaboration and public education are essential to benefit from artificial intelligence while limiting its risks. Personally, I agree with the writer because new technology is useful only if it is used responsibly."
 },
 {
  "title": "5. Branching out",
  "content": "This text reminds me of the chatbots and applications that students use today to look for information and to do their homework. After reading this text, I think that we should use artificial intelligence to learn better, not to avoid thinking."
 }
]$j$::jsonb
where title = $t$THE GLOBAL IMPACT OF ARTIFICIAL INTELLIGENCE$t$ and owner_id is null;

update public.texts set analysis = $j$[
 {
  "title": "1. Introduction",
  "content": "The text entitled “Malaria” is an article. Its author is not mentioned, and its source and date of publication are not given. In terms of genre, the text is informative. It deals with malaria, its causes, its symptoms and its prevention. The writer's intention is to inform and to sensitize the reader about the dangers of malaria and the ways to prevent it."
 },
 {
  "title": "2. Summary",
  "content": "The text can be divided into three parts. The first part, the first paragraph, explains that malaria is caused by a parasite transmitted by infected female Anopheles mosquitoes. The second part, the second and third paragraphs, deals with the symptoms, which appear 9 to 30 days after the bite and can be simple, like a flu, or complicated when a vital organ is reached. The third and last part, from the fourth paragraph to the end, is about prevention: environmental measures such as mosquito nets and the sanitation of wetlands, and preventive treatment for travellers, children and pregnant women. To sum up, malaria is a dangerous disease, but it can be prevented and treated early."
 },
 {
  "title": "3. Commentary",
  "content": "I will comment on the structure of the text. It follows a logical order: causes, symptoms, then prevention. The text is also built on a contrast between simple malaria and complicated malaria, and between people who travel to affected areas and people who live there. The vocabulary is scientific and the tone is serious and informative. The writer insists on treatment from the first symptoms, because the high number of deaths is mainly due to delayed or inadequate treatment."
 },
 {
  "title": "4. Evaluation",
  "content": "The text is interesting from a medical and social point of view because malaria is a major problem in Africa. I have learnt that anti-malarial drugs cannot guarantee total protection. The author's opinion is that prevention is essential and can be very effective. Personally, I agree with him because sleeping under a mosquito net saves lives."
 },
 {
  "title": "5. Branching out",
  "content": "This text reminds me of malaria in my own country and city, where many families have suffered from it. After reading this text, I think of the importance of mosquito nets, of clean surroundings and of going quickly to the hospital when we have a fever."
 }
]$j$::jsonb
where title = $t$MALARIA$t$ and owner_id is null;

update public.texts set analysis = $j$[
 {
  "title": "1. Introduction",
  "content": "The text entitled “Deforestation” is an article. Its author is not mentioned, and its source and date of publication are not given. In terms of genre, the text is expository. It deals with deforestation, its causes, its consequences and the solutions to it. The writer's intention is to inform the reader and to draw his attention to the destruction of forests."
 },
 {
  "title": "2. Summary",
  "content": "The text can be divided into four parts. The first part, the first paragraph, defines deforestation and says that forests cover about 31% of the Earth's land. The second part, the second and third paragraphs, presents the causes: agricultural expansion, logging and infrastructure development. The third part, the fourth and fifth paragraphs, deals with the consequences: loss of habitat and biodiversity, displaced communities and global warming. The fourth and last part, the final paragraph, suggests solutions: sustainable forestry, reforestation and afforestation. To sum up, deforestation is a serious problem, but we can act against it."
 },
 {
  "title": "3. Commentary",
  "content": "I will comment on the structure of the text. It is built on the pattern definition, causes, consequences and solutions, which makes the problem easy to understand. The writer uses the image of carbon sinks to explain the role of forests, and he says that the consequences “reverberate through ecosystems and human societies”. The tone is serious and concerned."
 },
 {
  "title": "4. Evaluation",
  "content": "The text is interesting from an environmental, social and economic point of view. I have learnt that planting trees in a new area is called afforestation. The author's opinion is that consumers can play a pivotal role by supporting sustainable practices. Personally, I agree with the writer because protecting forests means protecting our future."
 },
 {
  "title": "5. Branching out",
  "content": "This text reminds me of the forests of my country, Gabon, which are a precious treasure. After reading this text, I think we should protect them and plant trees in our schools and neighbourhoods."
 }
]$j$::jsonb
where title = $t$DEFORESTATION$t$ and owner_id is null;

update public.texts set analysis = $j$[
 {
  "title": "1. Introduction",
  "content": "The text entitled “Electric Circuits” is an article. Its author is not mentioned, and its source and date of publication are not given. In terms of genre, the text is explanatory. It deals with electric circuits and their different types. The writer's intention is to explain to the reader what electric circuits are and how they work."
 },
 {
  "title": "2. Summary",
  "content": "The text can be divided into three parts. The first part, the first paragraph, defines an electric circuit as a closed loop through which electrons flow, powered by a source like a battery. The second part, from the second to the fifth paragraph, presents the types of circuits: series, parallel, open and short circuits, and the ground fault. The third and last part, the final paragraph, says that circuits are essential to modern electronics and that engineers and technicians must understand them. To sum up, electric circuits power everything from simple devices to complex systems."
 },
 {
  "title": "3. Commentary",
  "content": "I will comment on the structure of the text. It moves from a definition to a classification, and the writer uses the connectors “In contrast” and “Conversely” to oppose a series circuit and a parallel circuit, and an open circuit and a short circuit. The vocabulary is technical and the tone is neutral and precise, as in a lesson."
 },
 {
  "title": "4. Evaluation",
  "content": "The text is interesting from a scientific and technical point of view. I have learnt that in a parallel circuit each component shares the same voltage, and that a short circuit can cause excessive current and damage. The author's opinion is that understanding circuit design is crucial for people who work with electronics. Personally, I agree with him because electricity is everywhere in our lives."
 },
 {
  "title": "5. Branching out",
  "content": "This text reminds me of the electrical installations in my home and in my school. After reading this text, I think of the danger of faulty wires and of the importance of calling a qualified electrician."
 }
]$j$::jsonb
where title = $t$ELECTRIC CIRCUITS$t$ and owner_id is null;

update public.texts set analysis = $j$[
 {
  "title": "1. Introduction",
  "content": "The text entitled “Safety Equipment and Use” is an article. Its author is not mentioned, and its source and date of publication are not given. In terms of genre, the text is informative and argumentative. It deals with safety equipment and the reasons why workers must wear it. The writer's intention is to convince the reader of the importance of wearing safety equipment."
 },
 {
  "title": "2. Summary",
  "content": "The text can be divided into two parts. The first part, the first two paragraphs, defines safety equipment, with examples such as gloves, helmets, safety glasses, earplugs and respirators, and says that wearing it is essential for high-risk tasks. The second part, from the third paragraph to the end, gives the reasons: it prevents accidents, it reduces the severity of injuries, it ensures compliance with regulations and it improves productivity. To sum up, safety equipment protects workers and benefits companies."
 },
 {
  "title": "3. Commentary",
  "content": "I will comment on the structure of the argument. The writer organises his reasons with the words “First”, “Second”, “Third” and “Finally”, which makes the text easy to follow. He also supports each reason with a concrete example: hard hats protect from falling objects, and a safety harness can prevent falls from heights. The tone is serious and persuasive."
 },
 {
  "title": "4. Evaluation",
  "content": "The text is interesting from a professional and social point of view because it concerns the health of workers. I have learnt that safety equipment can even save lives and that it improves productivity. The author's opinion is that wearing it is an essential requirement. Personally, I agree with the writer because no job is worth risking one's life."
 },
 {
  "title": "5. Branching out",
  "content": "This text reminds me of workers on building sites and of motorbike riders in my city, who often do not wear helmets. After reading this text, I think that everybody should respect safety rules."
 }
]$j$::jsonb
where title = $t$SAFETY EQUIPMENT AND USE$t$ and owner_id is null;

update public.texts set analysis = $j$[
 {
  "title": "1. Introduction",
  "content": "The text entitled “Genetics” is an article. Its author is not mentioned, and its source and date of publication are not given. In terms of genre, the text is explanatory. It deals with genetics, that is, how characteristics pass from parents to children. The writer's intention is to explain to the reader how heredity works."
 },
 {
  "title": "2. Summary",
  "content": "The text can be divided into four parts. The first part, the first paragraph, defines genetics as the study of heredity. The second part, from the second to the fourth paragraph, explains that genes are carried by chromosomes made of DNA, that humans have 23 pairs of chromosomes, and that the X and Y chromosomes determine whether a baby is a boy or a girl. The third part, the fifth and sixth paragraphs, deals with dominant genes, with the example of cheek dimples, and explains why children of the same parents can be different. The fourth and last part, the final paragraph, says that a gene which does not work properly can cause a defect or a disease, such as albinism. To sum up, genes explain why children resemble their parents but are not identical to them."
 },
 {
  "title": "3. Commentary",
  "content": "I will comment on the way the writer explains a difficult subject. He uses simple words and everyday examples, like hair colour, height and cheek dimples, to make science easy to understand. He also repeats definitions with “or”, as in “offspring, or young”. The text is built on a contrast between parents and children, who resemble each other but are not the same. The tone is simple and educational."
 },
 {
  "title": "4. Evaluation",
  "content": "The text is interesting from a scientific and educational point of view. I have learnt that a sperm cell carries either an X or a Y chromosome and that this decides the sex of the baby. The author's opinion is that heredity explains both resemblance and difference. Personally, I agree with the writer because I look like my parents but I am not exactly like them."
 },
 {
  "title": "5. Branching out",
  "content": "This text reminds me of my own family, where I have my mother's smile and my father's height. After reading this text, I think of how amazing it is that such tiny genes shape who we are."
 }
]$j$::jsonb
where title = $t$GENETICS$t$ and owner_id is null;
