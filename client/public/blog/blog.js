// Shared blog JS — email capture + nav active state

async function submitSidebarLead(e, formId, successId) {
  e.preventDefault();
  const form = document.getElementById(formId);
  const input = form.querySelector('input[type="email"]');
  const email = input ? input.value.trim() : '';
  if (!email) return;
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'blog_sidebar' }),
    });
    if (res.ok) {
      form.style.display = 'none';
      const success = document.getElementById(successId);
      if (success) success.style.display = 'block';
      // GA4 event
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', { source: 'blog_sidebar', email_domain: email.split('@')[1] });
      }
    }
  } catch (err) { console.error('Lead capture error:', err); }
}
