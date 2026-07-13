// finally.help — tiny frontend. No framework, no build step.
//
// Goal: send the subject to /api/explain, render the structured card,
// and (eventually) render a pre-rendered card on /[subject] for share-ability.

(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("ask");
  const card = $("card");
  const loading = $("loading");
  const error = $("error");
  const title = $("c-title");
  const big = $("c-big");
  const ana = $("c-ana");
  const terms = $("c-terms");
  const share = $("c-share");
  const go = $("go");

  function escape(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);
  }

  function renderExplanation(subject, exp) {
    title.textContent = subject;
    big.textContent = exp.big_picture;
    ana.textContent = exp.how_it_works;
    terms.innerHTML = "";
    for (const t of exp.key_words || []) {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${escape(t.term)}</strong>: ${escape(t.definition)}`;
      terms.appendChild(li);
    }
    share.textContent = `finally.help/${slug(subject)}`;
    card.hidden = false;
  }

  function slug(s) {
    return s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  }

  async function ask(subject) {
    error.hidden = true;
    card.hidden = true;
    loading.hidden = false;
    go.disabled = true;
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API ${res.status}: ${txt.slice(0, 240)}`);
      }
      const data = await res.json();
      renderExplanation(subject, data);
    } catch (e) {
      error.textContent = `Couldn't explain that one. ${e.message}`;
      error.hidden = false;
    } finally {
      loading.hidden = true;
      go.disabled = false;
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const subject = $("subject").value.trim();
    if (subject.length < 2) return;
    // Update the URL so reload/refund works, but no SPA router — just a hash.
    history.replaceState({}, "", `#${slug(subject)}`);
    ask(subject);
  });

  // If the page loads with #blockchain, try that subject.
  const preset = location.hash.replace(/^#/, "");
  if (preset) {
    $("subject").value = preset.replace(/-/g, " ");
    ask(preset.replace(/-/g, " "));
  }
})();
