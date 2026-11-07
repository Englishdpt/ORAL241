# 🎤 RealRecorder: MIKOLONGO Voice Trainer (Supabase + Netlify edition)

Open-source rebuild of the Base44 app. English reading and pronunciation trainer for Terminale students in Gabon.

**Stack (all free tiers):** React + Vite · Supabase (Postgres, Auth, Realtime, Edge Functions) · Netlify (hosting) · browser Web Speech API · Tesseract.js (in-browser OCR).

## What is built

| Feature | How |
|---|---|
| Student profile without email | First name + last name + class code + personal code. Edge Function `student-auth` creates a hidden auth user, so Row Level Security works normally. The code is never stored; it is turned into a password with a server secret (HMAC). 5 wrong attempts lock the account for 15 min |
| Class and series | Teacher creates a class (name + series). Its 6-character **class code** puts the student in the right class and series |
| Read and repeat | Text cut into short sentences → listen → repeat → word-by-word score (pass at 70 %) → progress saved, resumes where the student stopped |
| Repeat the analysis | Model analysis in the 5-step Terminale method (Introduction, Summary, Commentary, Evaluation, Branching out), shown with a reference card. The student reads it, then repeats it sentence by sentence (`texts.analysis`), tab **Analyse** |
| Vocabulary, grammar | Word lists, grammar tips and quizzes per text, results saved |
| Premium (WhatsApp credits) | Photo → free in-browser OCR → student corrects the text → **1 credit** is spent atomically (`add_uploaded_text`) → read-and-repeat. The student pays by WhatsApp (`wa.me` link), the teacher adds credits in one tap |
| Teacher tracking | Live ranking (Realtime): validated sentences, average score, quiz average, steadfastness over 14 days, last activity, credits. Click a student for per-text detail, add credits, or reset a forgotten code |

## Setup (about 30 minutes)

### 1. Supabase
1. Create a project at supabase.com.
2. SQL Editor → run, in this order: `supabase/migrations/0001_init.sql`, then `supabase/import_v1_texts.sql` (your 9 texts), then `supabase/analyses_v1_texts.sql` (their model analyses). `supabase/seed.sql` is an optional sample with quizzes.
3. Authentication → Providers → Email: **turn off "Allow new users to sign up"** (students are created by the Edge Function only).
4. Install the CLI, then:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase secrets set STUDENT_PEPPER=$(openssl rand -hex 32)
   supabase functions deploy student-auth
   ```
   Keep `STUDENT_PEPPER` safe. If you change it, every student code stops working.
5. Create your teacher account: Authentication → Users → Add user (email + password, auto-confirm). Copy its UUID and run:
   ```sql
   insert into public.profiles (id, role, first_name, last_name)
   values ('<UUID>', 'teacher', 'Your first name', 'Your last name');
   ```

### 2. Run locally
```bash
cp .env.example .env     # fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_WHATSAPP_NUMBER
npm install
npm run dev
```
Log in via **Espace enseignant**, create a class, give the class code to your students.

### 3. Deploy on Netlify
Push to GitHub → Netlify → Add new site → Import from GitHub. Build settings are in `netlify.toml`. Add the same three `VITE_` variables under Site settings → Environment variables.

## Adding your texts and analyses

Each text is one row in `public.texts`. The analysis follows the 5-step Terminale method, fully described in [`docs/ANALYSIS_METHOD.md`](docs/ANALYSIS_METHOD.md); `supabase/seed.sql` contains a complete model.

- `body`: the English text
- `analysis`: `[{"title": "1. Introduction", "content": "…"}, {"title": "2. Summary", …}, … "5. Branching out"]`, written in the order of the method
- `vocabulary`: `[{"word", "meaning", "example"}]`
- `grammar_tips`: `[{"title", "content"}]`
- `series`: `['A2','B']` to restrict to some series, empty = all
- quizzes go in `public.exercises` (`kind` = `vocab` or `grammar`, `items` = `[{"q","choices":[…],"answer":0,"explain":"…"}]`)

You do not need SQL for this: log in as teacher → **Gérer les textes**. The editor has one box per analysis step, plus vocabulary, grammar tips and quizzes (one line per item, format explained on screen).

The model analyses in `supabase/analyses_v1_texts.sql` say that the author, source and date are not given, because the supplied texts do not mention them. Edit that sentence in the editor once you know the real source.

## Security notes
- All data access is protected by Row Level Security (see the migration). Students only see their own attempts and credits; teachers only see their own classes.
- Credits can only change through the `grant_credits` (teacher) and `add_uploaded_text` (student, 1 credit) functions.
- The class code works like a shared secret: do not post it publicly.
- Chrome and Edge send speech audio to a cloud service for recognition. Tell students and parents.
- Free Supabase projects may be paused after a period of inactivity. Check the current plan limits, and open the app once a week during holidays.

## Not built yet
- Vocabulary lists and quizzes for the 9 original texts (the editor is ready for them)
- Numbered lines next to the text (analyses currently refer to paragraphs)
- PWA/offline mode, CSV export of progress, parent reports
- Automatic mobile-money payments (today: WhatsApp + manual credit)
- Importing your existing Base44 data (needs an export from Base44)
