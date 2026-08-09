"use strict";

/* =========================
   Korvo Customer Dashboard
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     Page Elements
     ========================= */

  const mobileMenuButton = document.getElementById(
    "mobileMenuButton"
  );

  const mobileNav = document.getElementById(
    "mobileNav"
  );

  const notificationButton = document.getElementById(
    "notificationButton"
  );

  const customerProfileButton = document.getElementById(
    "customerProfileButton"
  );

  const customerMenu = document.getElementById(
    "customerMenu"
  );

  const markAllReadButton = document.getElementById(
    "markAllReadButton"
  );

  const notificationsList = document.getElementById(
    "notificationsList"
  );

  const acceptQuoteModal = document.getElementById(
    "acceptQuoteModal"
  );

  const closeAcceptQuoteModal = document.getElementById(
    "closeAcceptQuoteModal"
  );

  const cancelAcceptQuoteButton = document.getElementById(
    "cancelAcceptQuoteButton"
  );

  const confirmAcceptQuoteButton = document.getElementById(
    "confirmAcceptQuoteButton"
  );

  const selectedProfessionalName = document.getElementById(
    "selectedProfessionalName"
  );

  const savedProfessionalsGrid = document.getElementById(
    "savedProfessionalsGrid"
  );

  const savedProsCount = document.getElementById(
    "savedProsCount"
  );

  const jobsList = document.getElementById(
    "jobsList"
  );

  const activeJobsCount = document.getElementById(
    "activeJobsCount"
  );

  const quotesCount = document.getElementById(
    "quotesCount"
  );

  const completedJobsCount = document.getElementById(
    "completedJobsCount"
  );

  const currentYear = document.getElementById(
    "currentYear"
  );

  let pendingProfessional = "";

  /* =========================
     Utility Functions
     ========================= */

  function safelyReadLocalStorage(key, fallbackValue) {
    try {
      const storedValue = localStorage.getItem(key);

      if (!storedValue) {
        return fallbackValue;
      }

      return JSON.parse(storedValue);
    } catch (error) {
      console.error(
        `Unable to read ${key} from localStorage:`,
        error
      );

      return fallbackValue;
    }
  }

  function safelyWriteLocalStorage(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error(
        `Unable to save ${key} to localStorage:`,
        error
      );
    }
  }

  function showDemoMessage(message) {
    alert(message);
  }

  /* =========================
     Mobile Navigation
     ========================= */

  if (mobileMenuButton && mobileNav) {
    mobileMenuButton.addEventListener("click", () => {
      mobileNav.classList.toggle("open");

      const isOpen =
        mobileNav.classList.contains("open");

      mobileMenuButton.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      mobileMenuButton.textContent =
        isOpen ? "×" : "☰";
    });

    mobileNav
      .querySelectorAll("a")
      .forEach((link) => {
        link.addEventListener("click", () => {
          mobileNav.classList.remove("open");

          mobileMenuButton.setAttribute(
            "aria-expanded",
            "false"
          );

          mobileMenuButton.textContent = "☰";
        });
      });
  }

  /* =========================
     Customer Menu
     ========================= */

  customerProfileButton?.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      customerMenu?.classList.toggle("hidden");
    }
  );

  customerMenu?.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();
    }
  );

  document.addEventListener("click", () => {
    customerMenu?.classList.add("hidden");
  });

  /* =========================
     Notifications
     ========================= */

  notificationButton?.addEventListener(
    "click",
    () => {
      notificationsList?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  );

  markAllReadButton?.addEventListener(
    "click",
    () => {
      const unreadNotifications =
        document.querySelectorAll(
          ".notification-item.unread"
        );

      unreadNotifications.forEach(
        (notification) => {
          notification.classList.remove("unread");

          const unreadDot =
            notification.querySelector(".unread-dot");

          unreadDot?.remove();
        }
      );

      const notificationCount =
        document.querySelector(
          ".notification-count"
        );

      if (notificationCount) {
        notificationCount.textContent = "0";
        notificationCount.classList.add("hidden");
      }

      safelyWriteLocalStorage(
        "korvoNotificationsRead",
        true
      );
    }
  );

  function loadNotificationState() {
    const notificationsRead =
      safelyReadLocalStorage(
        "korvoNotificationsRead",
        false
      );

    if (!notificationsRead) {
      return;
    }

    document
      .querySelectorAll(".notification-item.unread")
      .forEach((notification) => {
        notification.classList.remove("unread");

        notification
          .querySelector(".unread-dot")
          ?.remove();
      });

    const notificationCount =
      document.querySelector(
        ".notification-count"
      );

    if (notificationCount) {
      notificationCount.textContent = "0";
      notificationCount.classList.add("hidden");
    }
  }

  /* =========================
     Accept Quote Modal
     ========================= */

  function openAcceptQuoteModal(
    professionalName
  ) {
    pendingProfessional = professionalName;

    if (selectedProfessionalName) {
      selectedProfessionalName.textContent =
        professionalName;
    }

    acceptQuoteModal?.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  function closeAcceptModal() {
    acceptQuoteModal?.classList.add("hidden");
    document.body.classList.remove("modal-open");

    pendingProfessional = "";
  }

  document
    .querySelectorAll(".accept-quote-button")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const professionalName =
          button.dataset.professional ||
          "this professional";

        openAcceptQuoteModal(
          professionalName
        );
      });
    });

  closeAcceptQuoteModal?.addEventListener(
    "click",
    closeAcceptModal
  );

  cancelAcceptQuoteButton?.addEventListener(
    "click",
    closeAcceptModal
  );

  acceptQuoteModal?.addEventListener(
    "click",
    (event) => {
      if (event.target === acceptQuoteModal) {
        closeAcceptModal();
      }
    }
  );

  confirmAcceptQuoteButton?.addEventListener(
    "click",
    () => {
      if (!pendingProfessional) {
        return;
      }

      const acceptedQuotes =
        safelyReadLocalStorage(
          "korvoAcceptedQuotes",
          []
        );

      acceptedQuotes.push({
        professional: pendingProfessional,
        acceptedAt: new Date().toISOString(),
        status: "accepted"
      });

      safelyWriteLocalStorage(
        "korvoAcceptedQuotes",
        acceptedQuotes
      );

      showDemoMessage(
        `Quote from ${pendingProfessional} accepted in the Korvo demo.`
      );

      closeAcceptModal();
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        acceptQuoteModal &&
        !acceptQuoteModal.classList.contains(
          "hidden"
        )
      ) {
        closeAcceptModal();
      }
    }
  );

  /* =========================
     Message Buttons
     ========================= */

  document
    .querySelectorAll(
      ".message-professional-button"
    )
    .forEach((button) => {
      button.addEventListener("click", () => {
        const professionalName =
          button.dataset.professional ||
          "this professional";

        showDemoMessage(
          `Messaging with ${professionalName} is coming next.`
        );
      });
    });

  document
    .querySelectorAll(
      "[data-message-professional]"
    )
    .forEach((button) => {
      button.addEventListener("click", () => {
        const professionalName =
          button.dataset.messageProfessional ||
          "this professional";

        showDemoMessage(
          `Opening the conversation with ${professionalName} will be added on the messaging page.`
        );
      });
    });

  [
    "messagesQuickAction",
    "menuMessagesButton",
    "viewMessagesButton"
  ].forEach((elementId) => {
    document
      .getElementById(elementId)
      ?.addEventListener("click", () => {
        showDemoMessage(
          "The Korvo inbox and messaging page will be built next."
        );
      });
  });

  [
    "settingsQuickAction",
    "menuSettingsButton"
  ].forEach((elementId) => {
    document
      .getElementById(elementId)
      ?.addEventListener("click", () => {
        showDemoMessage(
          "Customer account settings are coming soon."
        );
      });
  });

  /* =========================
     Job Buttons
     ========================= */

  document
    .querySelectorAll("[data-job-action]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const action =
          button.dataset.jobAction;

        const actionMessages = {
          view:
            "A full job-details page will be added later.",

          quotes:
            "The complete quote comparison screen will be added later.",

          review:
            "The customer review form will be built after messaging."
        };

        showDemoMessage(
          actionMessages[action] ||
          "This job feature is coming soon."
        );
      });
    });

  document
    .querySelectorAll(".more-button")
    .forEach((button) => {
      button.addEventListener("click", () => {
        showDemoMessage(
          "Job options such as edit, close and delete will be added later."
        );
      });
    });

  document
    .getElementById("viewAllJobsButton")
    ?.addEventListener("click", () => {
      showDemoMessage(
        "The full My Jobs page is coming soon."
      );
    });

  document
    .getElementById("viewAllQuotesButton")
    ?.addEventListener("click", () => {
      showDemoMessage(
        "The full quote comparison page is coming soon."
      );
    });

  /* =========================
     Saved Professionals
     ========================= */

  function updateSavedCount() {
    if (!savedProfessionalsGrid || !savedProsCount) {
      return;
    }

    const visibleSavedCards =
      savedProfessionalsGrid.querySelectorAll(
        ".saved-professional-card:not(.hidden)"
      );

    savedProsCount.textContent =
      String(visibleSavedCards.length);
  }

  function loadSavedProfessionals() {
    const savedProfessionals =
      safelyReadLocalStorage(
        "korvoSavedProfessionals",
        []
      );

    if (
      !Array.isArray(savedProfessionals) ||
      savedProfessionals.length === 0
    ) {
      updateSavedCount();
      return;
    }

    document
      .querySelectorAll(
        ".saved-professional-card"
      )
      .forEach((card) => {
        const professionalName =
          card.dataset.professionalName;

        const isSaved =
          savedProfessionals.includes(
            professionalName
          );

        card.classList.toggle(
          "hidden",
          !isSaved
        );
      });

    updateSavedCount();
  }

  document
    .querySelectorAll(".favorite-button")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest(
          ".saved-professional-card"
        );

        const professionalName =
          card?.dataset.professionalName;

        if (!card || !professionalName) {
          return;
        }

        const savedProfessionals =
          safelyReadLocalStorage(
            "korvoSavedProfessionals",
            []
          );

        const updatedSavedProfessionals =
          savedProfessionals.filter(
            (savedProfessional) =>
              savedProfessional !==
              professionalName
          );

        safelyWriteLocalStorage(
          "korvoSavedProfessionals",
          updatedSavedProfessionals
        );

        card.classList.add("hidden");

        updateSavedCount();
      });
    });

  /* =========================
     Posted Jobs from Form
     ========================= */

  function getSubmittedJobs() {
  const jobs =
    safelyReadLocalStorage(
      "korvoCustomerJobs",
      []
    );

  if (Array.isArray(jobs)) {
    return jobs;
  }

  return [];
}

  function formatPostedDate(dateValue) {
    if (!dateValue) {
      return "Recently posted";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Recently posted";
    }

    return date.toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    );
  }

  function getJobIcon(serviceName) {
    const normalizedService =
      String(serviceName || "")
        .toLowerCase();

    if (
      normalizedService.includes("clean")
    ) {
      return "🧹";
    }

    if (
      normalizedService.includes("paint")
    ) {
      return "🎨";
    }

    if (
      normalizedService.includes("electric")
    ) {
      return "⚡";
    }

    if (
      normalizedService.includes("lawn") ||
      normalizedService.includes(
        "landscap"
      )
    ) {
      return "🌿";
    }

    if (
      normalizedService.includes("moving")
    ) {
      return "📦";
    }

    if (
      normalizedService.includes("drapery") ||
      normalizedService.includes("shade") ||
      normalizedService.includes("blind")
    ) {
      return "🪟";
    }

    return "🛠️";
  }

  function createSubmittedJobCard(job) {
    const article =
      document.createElement("article");

    article.className = "job-item";

    const service =
      job.service ||
      job.category ||
      "Local Service";

    const jobTitle =
      job.jobTitle ||
      job.title ||
      `${service} Project`;

    const city =
      job.city ||
      "Atlanta";

    const state =
      job.state ||
      "GA";

    const description =
      job.jobDescription ||
      job.description ||
      "Customer project submitted through Korvo.";

    const budget =
      job.budget ||
      "Budget not specified";
      const timeframe =
  job.timeframe ||
  "Flexible";

const reference =
  job.reference ||
  job.jobReference ||
  "KRV-000000";

const customer =
  job.customerName ||
  "Customer";

    const submittedAt =
      job.submittedAt ||
      job.createdAt ||
      job.date;

    article.innerHTML = `
      <div class="job-icon">
        ${getJobIcon(service)}
      </div>

      <div class="job-main">

        <div class="job-title-row">

          <div>
            <h3>${jobTitle}</h3>

            <p>
              ${city}, ${state} ·
              Posted ${formatPostedDate(
                submittedAt
              )}
            </p>
          </div>

          <span class="status-badge waiting">
            Waiting for quotes
          </span>

        </div>

        <p class="job-description">
          ${description}
        </p>

        <div class="job-footer">

    <span>
        💰 ${budget}
    </span>

    <span>
        📅 ${timeframe}
    </span>

    <span>
        🆔 ${reference}
    </span>

</div>

<p class="job-customer">
    Posted by ${customer}
</p>

      <div class="job-actions">

        <button
          type="button"
          class="small-secondary-button generated-job-button"
        >
          View Job
        </button>

        <button
          type="button"
          class="more-button generated-more-button"
          aria-label="More job options"
        >
          •••
        </button>

      </div>
    `;

    article
      .querySelector(
        ".generated-job-button"
      )
      ?.addEventListener("click", () => {
        showDemoMessage(
          "The full job-details page will be added later."
        );
      });

    article
      .querySelector(
        ".generated-more-button"
      )
      ?.addEventListener("click", () => {
        showDemoMessage(
          "Editing and deleting submitted jobs will be added later."
        );
      });

    return article;
  }

  function loadSubmittedJobs() {
    const submittedJobs =
      getSubmittedJobs();

    if (
      !jobsList ||
      submittedJobs.length === 0
    ) {
      return;
    }

    submittedJobs
      .slice()
      .reverse()
      .forEach((job) => {
        const jobCard =
          createSubmittedJobCard(job);

        jobsList.prepend(jobCard);
      });

    if (activeJobsCount) {
      const currentCount =
        Number(activeJobsCount.textContent) ||
        0;

      activeJobsCount.textContent =
        String(
          currentCount +
          submittedJobs.length
        );
    }
  }

  /* =========================
     Stats from Local Storage
     ========================= */

  function loadDashboardStats() {
    const quoteRequests =
      safelyReadLocalStorage(
        "korvoQuoteRequests",
        []
      );

    if (
      quotesCount &&
      Array.isArray(quoteRequests)
    ) {
      quotesCount.textContent =
        String(
          Math.max(
            7,
            quoteRequests.length
          )
        );
    }

    const acceptedQuotes =
      safelyReadLocalStorage(
        "korvoAcceptedQuotes",
        []
      );

    if (
      completedJobsCount &&
      Array.isArray(acceptedQuotes)
    ) {
      completedJobsCount.textContent =
        String(
          18 + acceptedQuotes.length
        );
    }
  }

  /* =========================
     Initial Page Load
     ========================= */

  if (currentYear) {
    currentYear.textContent =
      String(new Date().getFullYear());
  }

  loadNotificationState();
  loadSavedProfessionals();
  loadSubmittedJobs();
  loadDashboardStats();
});