/* ============================================================
   BuseDex Kielce — comments.js
   Komentarze do złapań przez Supabase.

   Tabela Supabase "comments":
     id          uuid default gen_random_uuid() PRIMARY KEY
     bus_id      text NOT NULL
     user_id     uuid references auth.users
     username    text
     body        text NOT NULL
     created_at  timestamptz default now()

   SQL:
     CREATE TABLE comments (
       id uuid default gen_random_uuid() primary key,
       bus_id text not null,
       user_id uuid references auth.users,
       username text,
       body text not null,
       created_at timestamptz default now()
     );
     ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
     CREATE POLICY "public read" ON comments FOR SELECT USING (true);
     CREATE POLICY "auth insert"  ON comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
     CREATE POLICY "own delete"   ON comments FOR DELETE USING (auth.uid() = user_id);
   ============================================================ */

var _commentsCache = {};   /* busId → [comment, ...] */

/* ── POBIERANIE ─────────────────────────────────────────────── */
async function fetchComments(busId) {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return [];
  try {
    var res = await fetch(
      CONFIG.supabaseUrl + "/rest/v1/comments?bus_id=eq." +
      encodeURIComponent(busId) + "&order=created_at.asc",
      {
        headers: {
          "apikey":        CONFIG.supabaseKey,
          "Authorization": "Bearer " + ((currentUser && currentUser.token) || CONFIG.supabaseKey)
        }
      }
    );
    if (!res.ok) return [];
    var data = await res.json();
    _commentsCache[busId] = data;
    return data;
  } catch(e) { return []; }
}

/* ── DODAWANIE ──────────────────────────────────────────────── */
async function addComment(busId, body) {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return { error: "Brak Supabase" };
  if (!currentUser) return { error: "Zaloguj się aby komentować" };
  if (!body.trim()) return { error: "Pusty komentarz" };
  try {
    var res = await fetch(CONFIG.supabaseUrl + "/rest/v1/comments", {
      method: "POST",
      headers: {
        "apikey":        CONFIG.supabaseKey,
        "Authorization": "Bearer " + currentUser.token,
        "Content-Type":  "application/json",
        "Prefer":        "return=representation"
      },
      body: JSON.stringify({
        bus_id:   busId,
        user_id:  currentUser.id,
        username: currentUser.username,
        body:     body.trim().slice(0, 280)
      })
    });
    if (!res.ok) return { error: "Błąd dodawania" };
    /* unieważnij cache */
    delete _commentsCache[busId];
    return { ok: true };
  } catch(e) { return { error: "Błąd sieci" }; }
}

/* ── USUWANIE (własny komentarz) ────────────────────────────── */
async function deleteComment(commentId, busId) {
  if (!currentUser || !CONFIG.supabaseUrl) return;
  try {
    await fetch(
      CONFIG.supabaseUrl + "/rest/v1/comments?id=eq." + commentId,
      {
        method: "DELETE",
        headers: {
          "apikey":        CONFIG.supabaseKey,
          "Authorization": "Bearer " + currentUser.token
        }
      }
    );
    delete _commentsCache[busId];
  } catch(e) {}
}

/* ── RENDER ─────────────────────────────────────────────────── */
async function renderComments(busId) {
  var wrap = document.getElementById("comments-wrap");
  if (!wrap) return;

  wrap.innerHTML = '<div style="color:var(--tx3);font-size:12px;padding:8px 0">Ładowanie komentarzy…</div>';

  if (!CONFIG.supabaseUrl) {
    wrap.innerHTML = '<div style="color:var(--tx3);font-size:11px;padding:8px 0">Komentarze wymagają konfiguracji Supabase.</div>';
    return;
  }

  var comments = await fetchComments(busId);
  var html = '<div class="comm-section">&#x1F4AC; Komentarze (' + comments.length + ')</div>';

  if (comments.length) {
    comments.forEach(function(cm) {
      var isMe = currentUser && cm.user_id === currentUser.id;
      var dt   = new Date(cm.created_at).toLocaleDateString("pl-PL");
      html +=
        '<div class="comm-row">' +
          '<div class="comm-header">' +
            '<span class="comm-user' + (isMe?" comm-me":"") + '">' +
              (isMe ? "Ty" : escHtml(cm.username || "Gracz")) +
            '</span>' +
            '<span class="comm-date">' + dt + '</span>' +
            (isMe ? '<button class="comm-del" onclick="doDeleteComment(\'' + cm.id + '\',\'' + busId + '\')">✕</button>' : '') +
          '</div>' +
          '<div class="comm-body">' + escHtml(cm.body) + '</div>' +
        '</div>';
    });
  } else {
    html += '<div style="color:var(--tx3);font-size:12px;padding:4px 0">Brak komentarzy — bądź pierwszy!</div>';
  }

  /* formularz */
  if (currentUser) {
    html +=
      '<div class="comm-form">' +
        '<input class="dev-inp" id="comm-inp-' + busId + '" type="text" placeholder="Napisz komentarz…" maxlength="280">' +
        '<button class="btns" style="margin-top:6px" onclick="doAddComment(\'' + busId + '\')">Wyślij &#x1F4AC;</button>' +
      '</div>';
  } else {
    html += '<div style="font-size:11px;color:var(--tx3);margin-top:8px;text-align:center">Zaloguj się aby komentować</div>';
  }

  wrap.innerHTML = html;
}

async function doAddComment(busId) {
  var inp = document.getElementById("comm-inp-" + busId);
  if (!inp) return;
  var body = inp.value.trim();
  inp.value = "";
  var r = await addComment(busId, body);
  if (r.ok)    renderComments(busId);
  else if (r.error) toast(r.error);
}

async function doDeleteComment(commentId, busId) {
  if (!confirm("Usunąć komentarz?")) return;
  await deleteComment(commentId, busId);
  renderComments(busId);
}

function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
