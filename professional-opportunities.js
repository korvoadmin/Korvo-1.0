"use strict";

// All reads and actions use the signed-in client; eligibility stays server-owned.
window.createKorvoOpportunities = function ({ client, professionalId, escapeHTML,
  formatBudget, getSchedule, showDetails, showQuote }) {
  const list = document.getElementById("matchedOpportunitiesList");
  const status = document.getElementById("opportunityStatus");
  const filter = document.getElementById("opportunityFilter");
  const refresh = document.getElementById("refreshOpportunitiesButton");
  const notificationsList = document.getElementById("notificationsList");
  const notificationCount = document.getElementById("notificationCount");
  const markAllRead = document.getElementById("markAllReadButton");
  let opportunities = [];
  let notifications = [];
  let busy = false;
  let feedAvailable = false;
  let notificationLoadVersion = 0;
  const current = (item) => ["offered", "viewed"].includes(item.opportunity_status);
  const reasonText = (code) => ({
    opportunity_passed: "You passed on this opportunity.",
    already_quoted: "Your quote has been submitted. Track it under Submitted Quotes.",
    opportunity_closed: "This opportunity is closed.",
    job_not_open: "This job is no longer accepting quotes.",
    membership_unavailable: "Your membership has no remaining job capacity.",
    professional_not_public: "Your professional profile must be visible to submit a quote.",
    onboarding_incomplete: "Complete your professional onboarding before quoting.",
    identity_verification_required: "Identity verification is required for this job.",
    background_verification_required: "Background verification is required for this job.",
    license_verification_required: "License verification is required for this job.",
    service_not_matched: "This job requires a service listed on your profile.",
    account_restricted: "Quoting is currently restricted on your account.",
    account_inactive: "Your account is currently inactive."
  }[code] || "This opportunity is currently unavailable for quoting.");

  function setBusy(value) {
    busy = value;
    refresh.disabled = value;
    filter.disabled = value;
    list.setAttribute("aria-busy", String(value));
    list.querySelectorAll("button").forEach((button) => {
      button.disabled = value || button.dataset.unavailable === "true";
    });
    notificationsList.querySelectorAll("button[data-opportunity-id]").forEach((button) => {
      button.disabled = value;
    });
  }

  function render() {
    const history = filter.value === "history";
    const visible = opportunities.filter((item) => current(item) !== history);
    // Keep the newest 100 from the API; rank actionable matches within that set.
    if (!history) visible.sort((a, b) => Number(b.can_quote) - Number(a.can_quote)
      || Number(Boolean(b.invited_at)) - Number(Boolean(a.invited_at))
      || b.match_score - a.match_score);
    list.innerHTML = "";
    if (!visible.length) {
      list.innerHTML = `<div class="empty-state compact"><h3>${history ? "No opportunity history yet" : "No current matches"}</h3>
        <p>${history ? "Passed, quoted, and closed opportunities will appear here." : "New matches and invitations will appear here. You can also browse the open jobs below."}</p></div>`;
    }
    for (const item of visible) {
      const card = document.createElement("article");
      card.className = "job-card opportunity-card";
      card.dataset.opportunityId = item.opportunity_id;
      card.tabIndex = -1;
      const state = ({ offered: "New", viewed: "Viewed", passed: "Passed", quoted: "Quoted", closed: "Closed" })[item.opportunity_status] || "Unavailable";
      card.innerHTML = `<div class="opportunity-badges">
        <span class="opportunity-badge ${item.invited_at ? "invited" : ""}">${item.invited_at ? "Customer invitation" : "Service match"}</span>
        <span class="opportunity-badge">${state}</span></div>
        <div class="job-card-header"><div><p class="eyebrow">${escapeHTML(item.category || "Local service")}</p>
          <h3>${escapeHTML(item.title || "Customer project")}</h3>
          <p>${escapeHTML([item.city, item.state].filter(Boolean).join(", ") || "Location not listed")}</p></div>
          <strong>${escapeHTML(formatBudget(item))}</strong></div>
        ${!item.can_quote ? `<p class="opportunity-reason">${escapeHTML(reasonText(item.reason_code))}</p>` : ""}
        <div class="job-actions">
          <button type="button" class="secondary-button" data-action="view">View Details</button>
          ${!history ? `<button type="button" class="primary-button" data-action="quote" data-unavailable="${!item.can_quote}" ${!item.can_quote ? "disabled" : ""}>Submit Quote</button>
          <button type="button" class="text-button" data-action="pass" data-unavailable="${item.job_status !== "open"}" ${item.job_status !== "open" ? "disabled" : ""}>Pass</button>` : ""}
        </div>`;
      list.appendChild(card);
    }
    status.textContent = `${visible.length} ${history ? "past" : "current"} ${visible.length === 1 ? "opportunity" : "opportunities"}${opportunities.length === 100 ? " · Showing your latest 100. Older opportunities are not included." : ""}`;
    setBusy(busy);
  }

  async function fetchFeed() {
    const { data, error } = await client.rpc("my_job_opportunities", { p_limit: 100 });
    if (error) throw error;
    opportunities = Array.isArray(data) ? data : [];
    feedAvailable = true;
  }

  async function loadNotifications() {
    const version = ++notificationLoadVersion;
    try {
      const [recent, unread] = await Promise.all([
        client.from("notifications").select("id,type,title,body,job_id,opportunity_id,read_at,created_at")
          .eq("user_id", professionalId).order("created_at", { ascending: false }).limit(50),
        client.from("notifications").select("id", { count: "exact", head: true })
          .eq("user_id", professionalId).is("read_at", null)
      ]);
      if (version !== notificationLoadVersion) return;
      if (recent.error || unread.error) throw recent.error || unread.error;
      notifications = recent.data || [];
      notificationCount.textContent = String(unread.count || 0);
      markAllRead.disabled = !unread.count;
      notificationsList.innerHTML = "";
      if (!notifications.length) notificationsList.innerHTML = '<p class="notification-status">No notifications yet.</p>';
      for (const item of notifications) {
        const article = document.createElement("article");
        article.className = `notification-item${item.read_at ? "" : " unread"}`;
        const opportunityAlert = item.opportunity_id && ["matched_job", "job_invitation"].includes(item.type);
        article.innerHTML = `<span class="notification-icon" aria-hidden="true">${item.type === "job_invitation" ? "✉️" : "💼"}</span>
          <div class="notification-content"><p><strong>${escapeHTML(item.title || "Korvo update")}</strong></p>
          <p>${escapeHTML(item.body || "")}</p><span>${escapeHTML(new Date(item.created_at).toLocaleString())}</span>
          ${opportunityAlert ? `<button type="button" class="text-button" data-opportunity-id="${escapeHTML(item.opportunity_id)}">View opportunity</button>` : ""}</div>
          ${item.read_at ? "" : '<span class="unread-dot" aria-label="Unread"></span>'}`;
        notificationsList.appendChild(article);
      }
      setBusy(busy);
    } catch (error) {
      if (version !== notificationLoadVersion) return;
      console.error("Could not load notifications:", error);
      notificationCount.textContent = "—";
      markAllRead.disabled = true;
      notificationsList.innerHTML = '<p class="notification-status" role="status">Notifications could not be loaded. Use Refresh in Matched for You to try again.</p>';
    }
  }

  async function reload() {
    if (busy) return;
    setBusy(true);
    status.textContent = "Loading your opportunities…";
    try {
      await fetchFeed();
      render();
    } catch (error) {
      console.error("Could not load opportunities:", error);
      feedAvailable = false;
      opportunities = [];
      list.innerHTML = "";
      status.textContent = "Opportunities could not be loaded. Select Refresh to try again.";
    } finally {
      await loadNotifications();
      setBusy(false);
    }
  }

  async function act(opportunityId, action) {
    if (busy || !["view", "pass", "quote"].includes(action)) return;
    if (action === "pass" && !window.confirm("Pass on this opportunity? It will move to History and the customer cannot invite you to this job again.")) return;
    setBusy(true);
    let responseSaved = false;
    try {
      // Recheck freshness before opening a cached card or notification.
      await fetchFeed();
      const item = opportunities.find((entry) => entry.opportunity_id === opportunityId);
      if (!item) throw new Error("This opportunity is unavailable or is outside your latest 100. Refresh to see your current opportunities.");
      if (action === "quote" && !item.can_quote) throw new Error(reasonText(item.reason_code));
      if (action === "pass" && (!current(item) || item.job_status !== "open")) throw new Error("This opportunity is no longer open for a response.");
      let job;
      if (action !== "pass") {
        const result = await client.from("jobs").select("id,title,description,category,city,state,budget_min,budget_max,preferred_date,timeframe,status,reference")
          .eq("id", item.job_id).maybeSingle();
        if (result.error) throw result.error;
        if (!result.data) throw new Error("Job details are no longer available to your account.");
        job = result.data;
        if (action === "quote" && job.status !== "open") throw new Error("This job is no longer accepting quotes.");
      }
      const { data, error } = await client.rpc("respond_to_job_opportunity", {
        p_opportunity_id: opportunityId, p_action: action === "pass" ? "pass" : "view"
      });
      if (error) throw error;
      responseSaved = true;
      item.opportunity_status = data.status;
      item.viewed_at = data.viewed_at;
      item.passed_at = data.passed_at;
      if (action === "pass") { item.can_quote = false; item.reason_code = "opportunity_passed"; }
      render();
      if (action === "pass") {
        status.textContent = "Opportunity passed. You can find it in History.";
      } else if (action === "quote") {
        // A concurrent pass/closure may have changed the response while loading details.
        if (!current(item)) throw new Error("This opportunity is no longer available for quoting. Refresh to check its status.");
        showQuote(job);
      } else {
        showDetails({ eyebrow: item.invited_at ? "CUSTOMER INVITATION" : "MATCHED JOB",
          title: job.title || "Customer project", message: job.description || "No description provided.",
          details: [
            { label: "Reference", value: job.reference || job.id },
            { label: "Location", value: [job.city, job.state].filter(Boolean).join(", ") || "Not listed" },
            { label: "Budget", value: formatBudget(job) },
            { label: "Schedule", value: getSchedule(job) }
          ] });
      }
    } catch (error) {
      console.error("Opportunity action failed:", error);
      // Never claim a response was saved until the RPC confirms it.
      if (feedAvailable) render();
      status.textContent = responseSaved ? "Your view was saved. Refresh to check the latest opportunity status." : "Could not complete this action. Refresh and try again.";
      showDetails({ eyebrow: "OPPORTUNITY UPDATE", title: "Opportunity unavailable",
        message: error instanceof Error ? error.message : "Korvo could not complete this action. Refresh and try again." });
    } finally {
      await loadNotifications();
      setBusy(false);
      if (action === "pass" && responseSaved) filter.focus();
    }
  }

  refresh.addEventListener("click", reload);
  filter.addEventListener("change", render);
  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (button && !button.disabled) act(button.closest("[data-opportunity-id]").dataset.opportunityId, button.dataset.action);
  });
  notificationsList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-opportunity-id]");
    if (button && !button.disabled) act(button.dataset.opportunityId, "view");
  });
  markAllRead.addEventListener("click", async () => {
    markAllRead.disabled = true;
    try {
      const { error } = await client.from("notifications").update({ read_at: new Date().toISOString() })
        .eq("user_id", professionalId).is("read_at", null);
      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error("Could not mark notifications read:", error);
      markAllRead.disabled = false;
      showDetails({ eyebrow: "NOTIFICATIONS", title: "Could not mark notifications read", message: "Please try again. Your saved read status has not been changed on this screen." });
    }
  });
  document.getElementById("notificationButton").addEventListener("click", () => {
    document.getElementById("notificationsSection").scrollIntoView({ behavior: "smooth", block: "center" });
    loadNotifications();
  });

  return { reload, refreshNotifications: loadNotifications };
};
