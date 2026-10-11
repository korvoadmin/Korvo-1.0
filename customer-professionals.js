"use strict";

window.createKorvoCustomerProfessionals = function ({ client, escapeHTML, refreshJobs, viewQuote }) {
  const section = document.getElementById("customerProfessionalsSection");
  const select = document.getElementById("recommendationsJob");
  const refresh = document.getElementById("refreshCustomerProfessionals");
  const status = document.getElementById("customerProfessionalsStatus");
  const list = document.getElementById("customerRecommendationsList");
  const activity = document.getElementById("customerOpportunityActivity");
  let jobs = [];
  let snapshot = null;
  let version = 0;
  let busy = false;
  let sending = false;
  const count = value => Math.max(0, Number(value) || 0);
  const date = value => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString() : "";

  function setBusy(value) {
    busy = value;
    refresh.disabled = value;
    select.disabled = sending || !jobs.length;
    list.setAttribute("aria-busy", String(value));
    section.querySelectorAll("button[data-professional-id],button[data-quote-id]").forEach(button => {
      button.disabled = value || button.dataset.unavailable === "true";
    });
  }

  function invitationState(pro, data) {
    const response = data.activity.find(row => row.professional_id === pro.professional_id);
    if (pro.has_quote || response?.status === "quoted") return "Quote submitted";
    if (response?.status === "passed") return "Passed on this job";
    if (response?.status === "closed" || data.job.status !== "open") return "Job closed";
    if (response?.invited_at) return "Invited";
    if (!data.can_invite || !pro.can_quote) return "Currently unavailable";
    if (count(data.invitations_used) >= count(data.invitation_limit)) return "Invitation limit reached";
    return "Invite to Quote";
  }

  function render(data) {
    list.innerHTML = "";
    activity.innerHTML = "";
    const open = data.job.status === "open";
    status.textContent = open
      ? `${count(data.invitations_used)} of ${count(data.invitation_limit)} invitations used for this job. Refresh to check for new responses.`
      : "This job is closed to new invitations. Your response history is below.";
    if (open && !data.can_invite) status.textContent = "Invitations are currently unavailable for your account. Your response history is below.";
    if (!data.recommendations.length) {
      list.innerHTML = `<p class="recommendations-description">${open ? "No matching professionals are available yet. Check back as more professionals join Korvo." : "Recommendations are available while a job is open."}</p>`;
    }
    for (const pro of data.recommendations) {
      const card = document.createElement("article");
      card.className = "customer-professional-card";
      const label = invitationState(pro, data);
      const services = Array.isArray(pro.services) ? pro.services : [];
      const verification = ["Verified", "Partially Verified"].includes(pro.verification_status) ? pro.verification_status : "Not Verified";
      const rating = Number(pro.average_rating);
      const ratingText = pro.average_rating != null && count(pro.review_count) > 0 && Number.isFinite(rating)
        ? `${rating.toFixed(1)} / 5 · ${count(pro.review_count)} ${count(pro.review_count) === 1 ? "review" : "reviews"}` : "No reviews yet";
      card.innerHTML = `<h3>${escapeHTML(pro.business_name || "Korvo Professional")}</h3>
        <p>Service match for ${escapeHTML(data.job.category || "your job")}</p>
        ${services.length ? `<p>${escapeHTML(services.slice(0, 3).join(" · "))}${services.length > 3 ? ` · +${services.length - 3} more services` : ""}</p>` : ""}
        <div class="customer-professional-facts"><span>${escapeHTML(ratingText)}</span>
          <span>${count(pro.completed_jobs)} completed Korvo jobs</span><span>Verification: ${verification}</span>
          ${pro.preferred_area_match ? "<span>Your area is a preferred service area</span>" : ""}</div>
        <button type="button" class="primary-button" data-professional-id="${escapeHTML(pro.professional_id)}" data-unavailable="${label !== "Invite to Quote"}" ${label !== "Invite to Quote" ? "disabled" : ""}>${label}</button>`;
      list.appendChild(card);
    }
    if (data.recommendations.length === 25) list.insertAdjacentHTML("beforeend", '<p class="recommendations-description">Showing up to 25 recommended professionals for this job.</p>');
    if (!data.activity.length) activity.innerHTML = '<p class="recommendations-description">No match alerts or invitations recorded for this job yet.</p>';
    for (const row of data.activity) {
      const article = document.createElement("article");
      article.className = "customer-opportunity-row";
      const response = ({ viewed: "Viewed", passed: "Passed", quoted: "Quoted", closed: "Closed" })[row.status]
        || (row.invited_at ? "Invited · Awaiting response" : "Matched · Awaiting response");
      const events = [["Match alert", row.matched_at], ["Invited", row.invited_at], ["Viewed", row.viewed_at],
        ["Passed", row.passed_at], ["Quoted", row.quoted_at], ["Closed", row.closed_at]]
        .filter(([, value]) => date(value)).map(([label, value]) => `${label}: ${date(value)}`);
      article.innerHTML = `<h4>${escapeHTML(row.business_name || "Professional no longer listed")}</h4>
        <p><strong>${response}</strong></p><p>${events.map(escapeHTML).join("<br>")}</p>
        ${row.quote_id && row.status === "quoted" ? `<button type="button" class="text-link button-link" data-quote-id="${escapeHTML(row.quote_id)}">View Quote</button>` : ""}`;
      activity.appendChild(article);
    }
    setBusy(busy);
  }

  async function read(jobId) {
    const { data, error } = await client.rpc("customer_job_professionals", { p_job_id: jobId });
    if (error) throw error;
    if (!data || data.job?.id !== jobId || !Array.isArray(data.recommendations) || !Array.isArray(data.activity)) throw new Error("Invalid job response");
    return data;
  }

  async function load() {
    const request = ++version;
    const jobId = select.value;
    snapshot = null;
    list.innerHTML = "";
    activity.innerHTML = "";
    if (!jobId) {
      status.textContent = "Post a job to see matching professionals and send invitations.";
      setBusy(false);
      return;
    }
    setBusy(true);
    status.textContent = "Loading recommendations and responses…";
    try {
      const data = await read(jobId);
      if (request !== version) return;
      snapshot = data;
      render(data);
    } catch (error) {
      if (request !== version) return;
      console.error("Could not load customer professionals:", error);
      status.textContent = "Recommendations and responses could not be loaded. Select Refresh to try again.";
    } finally {
      if (request === version) setBusy(false);
    }
  }

  async function setJobs(updatedJobs) {
    const previous = select.value;
    jobs = updatedJobs;
    select.replaceChildren();
    if (!jobs.length) select.add(new Option("No posted jobs yet", ""));
    for (const job of jobs) select.add(new Option(`${job.title || "Customer job"} · ${job.status === "open" ? "Open" : "Closed"}`, job.id));
    select.value = jobs.some(job => job.id === previous) ? previous : (jobs.find(job => job.status === "open") || jobs[0])?.id || "";
    await load();
  }

  function jobLoadError() {
    ++version;
    jobs = [];
    snapshot = null;
    select.replaceChildren(new Option("Jobs unavailable", ""));
    list.innerHTML = "";
    activity.innerHTML = "";
    status.textContent = "Your jobs could not be loaded. Select Refresh to try again.";
    setBusy(false);
  }

  async function invite(professionalId) {
    if (busy || sending || !snapshot) return;
    const jobId = select.value;
    const request = ++version;
    sending = true;
    setBusy(true);
    let sent = false;
    try {
      const fresh = await read(jobId);
      if (request !== version) return;
      snapshot = fresh;
      const professional = fresh.recommendations.find(pro => pro.professional_id === professionalId);
      if (!professional || invitationState(professional, fresh) !== "Invite to Quote") {
        render(fresh);
        status.textContent = "This professional cannot receive a new invitation for this job. The latest status is shown below.";
        return;
      }
      const { data, error } = await client.rpc("invite_professional_to_job", { p_job_id: jobId, p_professional_id: professionalId });
      if (error) throw error;
      if (!data?.invited) throw new Error("Invitation was not confirmed");
      sent = true;
      const latest = await read(jobId);
      if (request !== version) return;
      snapshot = latest;
      render(latest);
      status.textContent = `${data.already_invited ? "This professional was already invited." : "Invitation sent."} ${count(latest.invitations_used)} of ${count(latest.invitation_limit)} invitations used. You have not booked or paid for this job.`;
    } catch (error) {
      if (request !== version) return;
      console.error("Customer invitation failed:", error);
      // A network failure may follow a committed invitation. Do not assert failure
      // or let stale controls send more requests until the customer refreshes.
      snapshot = null;
      list.innerHTML = "";
      const messages = {
        "Invitation limit reached for this job": "This job has reached its invitation limit.",
        "This professional cannot receive another invitation right now": "This professional has reached their alert limit. Try again later.",
        "This job is no longer open": "This job is no longer open for invitations.",
        "This professional is not currently eligible for an invitation": "This professional is no longer available for an invitation.",
        "This account cannot send job invitations": "Invitations are currently unavailable for your account.",
        "This professional has already quoted on the job": "This professional has already submitted a quote."
      };
      status.textContent = sent ? "Invitation sent, but the updated list could not be loaded. Select Refresh to check its status."
        : (messages[error?.message] || "We could not confirm the invitation. Select Refresh to check its status before trying again.");
    } finally {
      sending = false;
      if (request === version) { setBusy(false); refresh.focus(); }
      else setBusy(busy);
    }
  }

  select.addEventListener("change", load);
  refresh.addEventListener("click", async () => { if (busy) return; setBusy(true); await refreshJobs(); });
  list.addEventListener("click", event => {
    const button = event.target.closest("button[data-professional-id]");
    if (button && !button.disabled) invite(button.dataset.professionalId);
  });
  activity.addEventListener("click", async event => {
    const button = event.target.closest("button[data-quote-id]");
    if (!button || button.disabled) return;
    button.disabled = true;
    try { await viewQuote(button.dataset.quoteId); }
    catch (error) { console.error("Could not open quote:", error); status.textContent = "The quote could not be loaded. Refresh and try again."; }
    finally { button.disabled = false; }
  });
  return { setJobs, jobLoadError, selectJob: async (jobId) => {
    if (sending || !jobs.some(job => job.id === jobId)) return;
    select.value = jobId;
    await load();
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    select.focus();
  } };
};
