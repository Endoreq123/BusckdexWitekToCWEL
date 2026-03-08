/* ============================================================
   BuseDex Kielce — config.js
   ============================================================
   SUPABASE (opcjonalny — ranking globalny):
   1. Załóż darmowe konto na https://supabase.com
   2. Utwórz tabelę "user_progress":
        user_id    text PRIMARY KEY
        username   text
        color      text
        caught     int
        badges     int
        updated_at timestamptz default now()
   3. Ustaw Row Level Security:
        CREATE POLICY "public read"  ON user_progress FOR SELECT USING (true);
        CREATE POLICY "public write" ON user_progress FOR INSERT WITH CHECK (true);
        CREATE POLICY "public upd"   ON user_progress FOR UPDATE USING (true);
   4. Skopiuj URL i klucz anon z Settings → API.

   Bez Supabase aplikacja działa w pełni lokalnie.
   ============================================================ */

var CONFIG = {

  /* ── Supabase (zostaw puste jeśli nie używasz) ─────────── */
  supabaseUrl: "",   // np. "https://abcxyz.supabase.co"
  supabaseKey: "",   // klucz anon

};
