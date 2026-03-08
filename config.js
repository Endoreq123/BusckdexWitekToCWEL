/* ============================================================
   BuseDex Kielce — config.js
   ============================================================
   EDYTUJ TEN PLIK aby skonfigurować aplikację.

   SUPABASE (globalny katalog):
   1. Załóż darmowe konto na https://supabase.com
   2. Utwórz projekt, potem w Table Editor stwórz tabelę "buses":
        id         text PRIMARY KEY
        num        text
        brand      text
        sub        text  (nullable)
        model      text
        type       text
        rare       boolean default false
        unique_bus boolean default false
        active     boolean default true
        added_at   timestamptz default now()
   3. W SQL Editor uruchom:
        ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "public read" ON buses FOR SELECT USING (true);
        CREATE POLICY "anon insert" ON buses FOR INSERT WITH CHECK (true);
   4. Skopiuj URL i klucz anon z Settings → API i wklej poniżej.

   TRYB DEWELOPERA:
   - Ustaw devUsername i uruchom aplikację
   - Przy pierwszym logowaniu hasło zostanie zaszyfrowane i zapisane
   - Możesz zmienić TYLKO wpisując nowe hasło w polu i klikając "Zmień hasło"
   ============================================================ */

var CONFIG = {

  /* ── Supabase ──────────────────────────────────────────── */
  supabaseUrl: "",   // np. "https://abcxyz.supabase.co"
  supabaseKey: "",   // klucz anon (bezpieczny do użycia w przeglądarce)

  /* ── Konto dewelopera ──────────────────────────────────── */
  devUsername: "endoreq",

  /* ── Zachowanie ────────────────────────────────────────── */
  syncOnStart:    true,   // pobierz globalny katalog przy starcie
  syncInterval:   0,      // co ile ms odświeżać katalog (0 = wyłączone)

};
