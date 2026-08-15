"use strict";

/* =========================
   Korvo Customer Dashboard
   ========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     Page Elements
     ========================= */

  const mobileMenuButton =
    document.getElementById("mobileMenuButton");

  const mobileNav =
    document.getElementById("mobileNav");

  const notificationButton =
    document.getElementById("notificationButton");

  const customerProfileButton =
    document.getElementById(
      "customerProfileButton"
    );

  const customerMenu =
    document.getElementById(
      "customerMenu"
    );

  const markAllReadButton =
    document.getElementById(
      "markAllReadButton"
    );

  const notificationsList =
    document.getElementById(
      "notificationsList"
    );

  const quotesList =
    document.getElementById(
      "quotesList"
    );

  const acceptQuoteModal =
    document.getElementById(
      "acceptQuoteModal"
    );

  const closeAcceptQuoteModal =
    document.getElementById(
      "closeAcceptQuoteModal"
    );

  const cancelAcceptQuoteButton =
    document.getElementById(
      "cancelAcceptQuoteButton"
    );

  const confirmAcceptQuoteButton =
    document.getElementById(
      "confirmAcceptQuoteButton"
    );

  const selectedProfessionalName =
    document.getElementById(
      "selectedProfessionalName"
    );

  const savedProfessionalsGrid =
    document.getElementById(
      "savedProfessionalsGrid"
    );

  const savedProsCount =
    document.getElementById(
      "savedProsCount"
    );

  const jobsList =
    document.getElementById(
      "jobsList"
    );

  const activeJobsCount =
    document.getElementById(
      "activeJobsCount"
    );

  const quotesCount =
    document.getElementById(
      "quotesCount"
    );

  const completedJobsCount =
    document.getElementById(
      "completedJobsCount"
    );

  const currentYear =
    document.getElementById(
      "currentYear"
    );


  /* =========================
     Quote Selection State
     ========================= */

  let pendingProfessional = "";
  let pendingQuoteId = "";


  /* =========================
     Local Storage Helpers
     ========================= */

  function safelyReadLocalStorage(
    key,
    fallbackValue
  ) {
    try {
      const storedValue =
        localStorage.getItem(key);

      if (!storedValue) {
        return fallbackValue;
      }

      return JSON.parse(
        storedValue
      );
    } catch (error) {
      console.error(
        `Unable to read ${key}:`,
        error
      );

      return fallbackValue;
    }
  }


  function safelyWriteLocalStorage(
    key,
    value
  ) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error(
        `Unable to save ${key}:`,
        error
      );
    }
  }


  /* =========================
     HTML Safety
     ========================= */

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll(
        "'",
        "&#039;"
      );
  }


  /* =========================
     Korvo Information Modal
     ========================= */

  const infoModal =
    document.getElementById(
      "infoModal"
    );

  const infoModalCard =
    infoModal
      ? infoModal.querySelector(
          ".info-modal-card"
        )
      : null;

  const infoModalEyebrow =
    document.getElementById(
      "infoModalEyebrow"
    );

  const infoModalTitle =
    document.getElementById(
      "infoModalTitle"
    );

  const infoModalMessage =
    document.getElementById(
      "infoModalMessage"
    );

  const infoModalDetails =
    document.getElementById(
      "infoModalDetails"
    );

  const closeInfoModalButton =
    document.getElementById(
      "closeInfoModalButton"
    );

  const infoModalDoneButton =
    document.getElementById(
      "infoModalDoneButton"
    );

  const infoModalIcon =
    document.getElementById(
      "infoModalIcon"
    );


  function openInfoModal({
    eyebrow = "KORVO",
    title = "Information",
    message = "",
    details = [],
    success = false
  }) {
    if (!infoModal) {
      return;
    }

    if (infoModalEyebrow) {
      infoModalEyebrow.textContent =
        eyebrow;
    }

    if (infoModalTitle) {
      infoModalTitle.textContent =
        title;
    }

    if (infoModalMessage) {
      infoModalMessage.textContent =
        message;
    }

    if (infoModalDetails) {
      infoModalDetails.innerHTML =
        "";
    }

    if (infoModalCard) {
      infoModalCard.classList.toggle(
        "success-modal",
        success
      );
    }

    if (infoModalIcon) {
      infoModalIcon.textContent =
        success ? "✓" : "i";
    }

    if (infoModalDetails) {
      details.forEach(
        (detail) => {
          const row =
            document.createElement(
              "div"
            );

          row.className =
            "info-detail-row";

          row.innerHTML = `
            <span class="info-detail-label">
              ${escapeHTML(
                detail.label
              )}
            </span>

            <span class="info-detail-value">
              ${escapeHTML(
                detail.value
              )}
            </span>
          `;

          infoModalDetails
            .appendChild(row);
        }
      );
    }

    infoModal.classList.remove(
      "hidden"
    );

    document.body.classList.add(
      "modal-open"
    );
  }


  function closeInfoModal() {
    if (!infoModal) {
      return;
    }

    infoModal.classList.add(
      "hidden"
    );

    document.body.classList.remove(
      "modal-open"
    );
  }


  function showDemoMessage(message) {
    openInfoModal({
      eyebrow: "KORVO",
      title: "Coming Soon",
      message,
      details: []
    });
  }


  closeInfoModalButton
    ?.addEventListener(
      "click",
      closeInfoModal
    );

  infoModalDoneButton
    ?.addEventListener(
      "click",
      closeInfoModal
    );

  infoModal?.addEventListener(
    "click",
    (event) => {
      if (
        event.target === infoModal
      ) {
        closeInfoModal();
      }
    }
  );


  /* =========================
     Mobile Navigation
     ========================= */

  if (
    mobileMenuButton &&
    mobileNav
  ) {
    mobileMenuButton
      .addEventListener(
        "click",
        () => {
          mobileNav.classList.toggle(
            "open"
          );

          const isOpen =
            mobileNav.classList.contains(
              "open"
            );

          mobileMenuButton
            .setAttribute(
              "aria-expanded",
              String(isOpen)
            );

          mobileMenuButton.textContent =
            isOpen
              ? "×"
              : "☰";
        }
      );

    mobileNav
      .querySelectorAll("a")
      .forEach((link) => {
        link.addEventListener(
          "click",
          () => {
            mobileNav.classList.remove(
              "open"
            );

            mobileMenuButton
              .setAttribute(
                "aria-expanded",
                "false"
              );

            mobileMenuButton.textContent =
              "☰";
          }
        );
      });
  }


  /* =========================
     Customer Menu
     ========================= */

  customerProfileButton
    ?.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();

        customerMenu
          ?.classList.toggle(
            "hidden"
          );
      }
    );

  customerMenu?.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();
    }
  );

  document.addEventListener(
    "click",
    () => {
      customerMenu
        ?.classList.add(
          "hidden"
        );
    }
  );


  /* =========================
     Notifications
     ========================= */

  notificationButton
    ?.addEventListener(
      "click",
      () => {
        notificationsList
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
      }
    );


  markAllReadButton
    ?.addEventListener(
      "click",
      () => {
        document
          .querySelectorAll(
            ".notification-item.unread"
          )
          .forEach(
            (notification) => {
              notification
                .classList.remove(
                  "unread"
                );

              notification
                .querySelector(
                  ".unread-dot"
                )
                ?.remove();
            }
          );

        const count =
          document.querySelector(
            ".notification-count"
          );

        if (count) {
          count.textContent = "0";

          count.classList.add(
            "hidden"
          );
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
      .querySelectorAll(
        ".notification-item.unread"
      )
      .forEach(
        (notification) => {
          notification
            .classList.remove(
              "unread"
            );

          notification
            .querySelector(
              ".unread-dot"
            )
            ?.remove();
        }
      );

    const count =
      document.querySelector(
        ".notification-count"
      );

    if (count) {
      count.textContent = "0";

      count.classList.add(
        "hidden"
      );
    }
  }


  /* =========================
     Professional Quotes
     ========================= */

  function getProfessionalQuotes() {
    const quotes =
      safelyReadLocalStorage(
        "korvoProfessionalQuotes",
        []
      );

    return Array.isArray(quotes)
      ? quotes
      : [];
  }


  function saveProfessionalQuotes(
    quotes
  ) {
    safelyWriteLocalStorage(
      "korvoProfessionalQuotes",
      quotes
    );
  }


  function formatQuoteDate(
    dateValue
  ) {
    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Recently";
    }

    return date.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric"
      }
    );
  }


  function getInitials(name) {
    return String(
      name || "Korvo Pro"
    )
      .split(" ")
      .map(
        (word) =>
          word.charAt(0)
      )
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }


  /* =========================
     Quote Status Helpers
     ========================= */

  function getQuoteStatus(
    quote
  ) {
    const status =
      String(
        quote.status ||
        "Pending"
      ).toLowerCase();

    if (status === "accepted") {
      return "Accepted";
    }

    if (status === "declined") {
      return "Declined";
    }

    return "Pending";
  }


  function updateQuoteStatus(
    quoteId,
    newStatus
  ) {
    const quotes =
      getProfessionalQuotes();

    const updatedQuotes =
      quotes.map(
        (quote) => {
          if (
            String(quote.id) ===
            String(quoteId)
          ) {
            return {
              ...quote,

              status:
                newStatus,

              statusUpdatedAt:
                new Date()
                  .toISOString()
            };
          }

          return quote;
        }
      );

    saveProfessionalQuotes(
      updatedQuotes
    );
  }


  /* =========================
     Dynamic Quote Cards
     ========================= */

  function createProfessionalQuoteCard(
    quote
  ) {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "quote-item generated-quote-item";

    article.dataset.quoteId =
      quote.id || "";


    const professionalName =
      quote.professional ||
      "Korvo Professional";

    const professionalType =
      quote.professionalType ||
      "Local Professional";

    const initials =
      quote.professionalInitials ||
      getInitials(
        professionalName
      );

    const rating =
      quote.professionalRating ||
      "5.0";

    const profile =
      quote.professionalProfile ||
      "browse.html";

    const amount =
      Number(
        quote.amount || 0
      );

    const timeframe =
      quote.timeframe ||
      "Flexible";

    const message =
      quote.message ||
      "No message included.";

    const status =
      getQuoteStatus(
        quote
      );

    const statusClass =
      status.toLowerCase();

    const jobTitle =
      quote.jobTitle ||
      "Customer Project";

    const reference =
      quote.jobReference ||
      quote.jobId ||
      "Not assigned";

    const createdDate =
      formatQuoteDate(
        quote.createdAt
      );

    const quoteAccepted =
      status === "Accepted";

    const quoteDeclined =
      status === "Declined";

    const quotePending =
      status === "Pending";


    article.innerHTML = `

      <div
        class="quote-status ${escapeHTML(
          statusClass
        )}"
      >
        ${escapeHTML(
          status
        )}
      </div>


      <div class="quote-professional">

        <div class="professional-avatar">
          ${escapeHTML(
            initials
          )}
        </div>

        <div>

          <div class="professional-name-row">

            <h3>
              ${escapeHTML(
                professionalName
              )}
            </h3>

            <span class="verified-check">
              ✓
            </span>

          </div>

          <p>
            ${escapeHTML(
              professionalType
            )}
          </p>

          <div class="rating-row">

            <span class="stars">
              ★★★★★
            </span>

            <strong>
              ${escapeHTML(
                rating
              )}
            </strong>

            <span>
              Verified Korvo Pro
            </span>

          </div>

        </div>

      </div>


      <div class="quote-details">

        <div>

          <span class="quote-label">
            Quote amount
          </span>

          <strong class="quote-price">
            $${amount.toLocaleString()}
          </strong>

        </div>


        <div>

          <span class="quote-label">
            Availability
          </span>

          <strong class="quote-availability">
            ${escapeHTML(
              timeframe
            )}
          </strong>

        </div>

      </div>


      <p class="quote-message">
        “${escapeHTML(
          message
        )}”
      </p>


      <div class="job-footer">

        <span>
          🛠️
          ${escapeHTML(
            jobTitle
          )}
        </span>

        <span>
          🆔
          ${escapeHTML(
            reference
          )}
        </span>

        <span>
          📅
          ${escapeHTML(
            createdDate
          )}
        </span>

      </div>


      <div class="quote-actions">

        <button
          type="button"
          class="primary-button generated-accept-quote-button"
          data-professional="${escapeHTML(
            professionalName
          )}"
          data-quote-id="${escapeHTML(
            quote.id || ""
          )}"
          ${quotePending
            ? ""
            : "disabled"}
        >
          ${
            quoteAccepted
              ? "Quote Accepted"
              : quoteDeclined
                ? "Quote Declined"
                : "Accept Quote"
          }
        </button>


        <button
          type="button"
          class="secondary-button generated-decline-quote-button"
          data-professional="${escapeHTML(
            professionalName
          )}"
          data-quote-id="${escapeHTML(
            quote.id || ""
          )}"
          ${quotePending
            ? ""
            : "disabled"}
        >
          ${
            quoteDeclined
              ? "Declined"
              : "Decline Quote"
          }
        </button>


        <button
          type="button"
          class="secondary-button generated-message-button"
          data-professional="${escapeHTML(
            professionalName
          )}"
        >
          Message
        </button>


        <a
          href="${escapeHTML(
            profile
          )}"
          class="profile-text-link"
        >
          View Profile
        </a>

      </div>
    `;


    /* Accept Quote */

    article
      .querySelector(
        ".generated-accept-quote-button"
      )
      ?.addEventListener(
        "click",
        (event) => {
          const button =
            event.currentTarget;

          if (button.disabled) {
            return;
          }

          openAcceptQuoteModal(
            button.dataset.professional,
            button.dataset.quoteId
          );
        }
      );


    /* Decline Quote */

    article
      .querySelector(
        ".generated-decline-quote-button"
      )
      ?.addEventListener(
        "click",
        (event) => {
          const button =
            event.currentTarget;

          if (button.disabled) {
            return;
          }

          const quoteId =
            button.dataset.quoteId;

          const professional =
            button.dataset.professional ||
            "this professional";


          updateQuoteStatus(
            quoteId,
            "Declined"
          );


          renderProfessionalQuotes();

          loadDashboardStats();


          openInfoModal({
            eyebrow:
              "QUOTE DECLINED",

            title:
              "Quote Declined",

            message:
              "This quote has been declined and the professional-side status has been updated.",

            details: [
              {
                label:
                  "Professional",

                value:
                  professional
              },

              {
                label:
                  "Status",

                value:
                  "Declined"
              },

              {
                label:
                  "Next Step",

                value:
                  "You can review another quote"
              }
            ]
          });
        }
      );


    /* Message Professional */

    article
      .querySelector(
        ".generated-message-button"
      )
      ?.addEventListener(
        "click",
        (event) => {
          const professional =
            event.currentTarget
              .dataset.professional ||
            "";

          openProfessionalConversation(
            professional
          );
        }
      );


    return article;
  }


  function renderProfessionalQuotes() {
    if (!quotesList) {
      return;
    }

    quotesList
      .querySelectorAll(
        ".generated-quote-item"
      )
      .forEach(
        (item) =>
          item.remove()
      );

    const quotes =
      getProfessionalQuotes();


    quotes
      .slice()
      .reverse()
      .forEach(
        (quote) => {
          const card =
            createProfessionalQuoteCard(
              quote
            );

          quotesList.prepend(
            card
          );
        }
      );
  }


  /* =========================
     Accept Quote Modal
     ========================= */

  function openAcceptQuoteModal(
    professionalName,
    quoteId = ""
  ) {
    pendingProfessional =
      professionalName;

    pendingQuoteId =
      quoteId;

    if (
      selectedProfessionalName
    ) {
      selectedProfessionalName
        .textContent =
          professionalName;
    }

    acceptQuoteModal
      ?.classList.remove(
        "hidden"
      );

    document.body.classList.add(
      "modal-open"
    );
  }


  function closeAcceptModal() {
    acceptQuoteModal
      ?.classList.add(
        "hidden"
      );

    document.body.classList.remove(
      "modal-open"
    );

    pendingProfessional = "";
    pendingQuoteId = "";
  }


  /* Static demo quote buttons */

  document
    .querySelectorAll(
      ".accept-quote-button"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          openAcceptQuoteModal(
            button.dataset.professional ||
            "this professional",
            ""
          );
        }
      );
    });


  closeAcceptQuoteModal
    ?.addEventListener(
      "click",
      closeAcceptModal
    );


  cancelAcceptQuoteButton
    ?.addEventListener(
      "click",
      closeAcceptModal
    );


  acceptQuoteModal
    ?.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          acceptQuoteModal
        ) {
          closeAcceptModal();
        }
      }
    );


  confirmAcceptQuoteButton
    ?.addEventListener(
      "click",
      () => {

        if (
          !pendingProfessional
        ) {
          return;
        }


        const acceptedProfessional =
          pendingProfessional;

        const acceptedQuoteId =
          pendingQuoteId;


        const acceptedQuotes =
          safelyReadLocalStorage(
            "korvoAcceptedQuotes",
            []
          );


        acceptedQuotes.push({
          quoteId:
            acceptedQuoteId,

          professional:
            acceptedProfessional,

          acceptedAt:
            new Date()
              .toISOString(),

          status:
            "accepted"
        });


        safelyWriteLocalStorage(
          "korvoAcceptedQuotes",
          acceptedQuotes
        );


        if (acceptedQuoteId) {
          updateQuoteStatus(
            acceptedQuoteId,
            "Accepted"
          );
        }


        closeAcceptModal();

        renderProfessionalQuotes();

        loadDashboardStats();


        openInfoModal({
          eyebrow:
            "QUOTE ACCEPTED",

          title:
            "Professional Selected!",

          message:
            "Your Korvo quote has been accepted and saved.",

          success:
            true,

          details: [
            {
              label:
                "Professional",

              value:
                acceptedProfessional
            },

            {
              label:
                "Status",

              value:
                "Accepted"
            },

            {
              label:
                "Next Step",

              value:
                "Continue the conversation in Korvo Messages"
            }
          ]
        });

      }
    );


  /* =========================
     Escape Key
     ========================= */

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !== "Escape"
      ) {
        return;
      }


      if (
        acceptQuoteModal &&
        !acceptQuoteModal
          .classList.contains(
            "hidden"
          )
      ) {
        closeAcceptModal();
      }


      if (
        infoModal &&
        !infoModal
          .classList.contains(
            "hidden"
          )
      ) {
        closeInfoModal();
      }

    }
  );


  /* =========================
     Messaging
     ========================= */

  function openProfessionalConversation(
    professionalName = ""
  ) {
    localStorage.setItem(
      "korvoMessagingRole",
      "customer"
    );


    if (professionalName) {
      localStorage.setItem(
        "korvoOpenConversation",
        professionalName
      );
    } else {
      localStorage.removeItem(
        "korvoOpenConversation"
      );
    }


    window.location.href =
      "messages.html";
  }


  document
    .querySelectorAll(
      ".message-professional-button"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          openProfessionalConversation(
            button.dataset
              .professional ||
            ""
          );
        }
      );
    });


  document
    .querySelectorAll(
      "[data-message-professional]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          openProfessionalConversation(
            button.dataset
              .messageProfessional ||
            ""
          );
        }
      );
    });


  [
    "messagesQuickAction",
    "menuMessagesButton",
    "viewMessagesButton"
  ].forEach(
    (elementId) => {
      document
        .getElementById(
          elementId
        )
        ?.addEventListener(
          "click",
          () => {
            openProfessionalConversation();
          }
        );
    }
  );


  /* =========================
     Settings
     ========================= */

  [
    "settingsQuickAction",
    "menuSettingsButton"
  ].forEach(
    (elementId) => {
      document
        .getElementById(
          elementId
        )
        ?.addEventListener(
          "click",
          () => {
            showDemoMessage(
              "Customer account settings are coming soon."
            );
          }
        );
    }
  );


  /* =========================
     Job Buttons
     ========================= */

  document
    .querySelectorAll(
      "[data-job-action]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {

          const action =
            button.dataset
              .jobAction;

          const messages = {
            view:
              "A full job-details page will be added later.",

            quotes:
              "The complete quote comparison screen will be added later.",

            review:
              "The customer review form will be built after messaging."
          };

          showDemoMessage(
            messages[action] ||
            "This job feature is coming soon."
          );

        }
      );
    });


  document
    .querySelectorAll(
      ".more-button"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          showDemoMessage(
            "Job options such as edit, close and delete will be added later."
          );
        }
      );
    });


  document
    .getElementById(
      "viewAllJobsButton"
    )
    ?.addEventListener(
      "click",
      () => {
        showDemoMessage(
          "The full My Jobs page is coming soon."
        );
      }
    );


  document
    .getElementById(
      "viewAllQuotesButton"
    )
    ?.addEventListener(
      "click",
      () => {
        showDemoMessage(
          "The full quote comparison page is coming soon."
        );
      }
    );


  /* =========================
     Saved Professionals
     ========================= */

  function updateSavedCount() {
    if (
      !savedProfessionalsGrid ||
      !savedProsCount
    ) {
      return;
    }

    const visibleCards =
      savedProfessionalsGrid
        .querySelectorAll(
          ".saved-professional-card:not(.hidden)"
        );

    savedProsCount.textContent =
      String(
        visibleCards.length
      );
  }


  function loadSavedProfessionals() {
    const savedProfessionals =
      safelyReadLocalStorage(
        "korvoSavedProfessionals",
        []
      );

    if (
      !Array.isArray(
        savedProfessionals
      ) ||
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

        const name =
          card.dataset
            .professionalName;

        card.classList.toggle(
          "hidden",
          !savedProfessionals
            .includes(name)
        );

      });

    updateSavedCount();
  }


  document
    .querySelectorAll(
      ".favorite-button"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {

          const card =
            button.closest(
              ".saved-professional-card"
            );

          const name =
            card?.dataset
              .professionalName;

          if (
            !card ||
            !name
          ) {
            return;
          }

          const saved =
            safelyReadLocalStorage(
              "korvoSavedProfessionals",
              []
            );

          const updated =
            saved.filter(
              (professional) =>
                professional !== name
            );

          safelyWriteLocalStorage(
            "korvoSavedProfessionals",
            updated
          );

          card.classList.add(
            "hidden"
          );

          updateSavedCount();

        }
      );
    });


  /* =========================
     Submitted Customer Jobs
     ========================= */

  function getSubmittedJobs() {
    const jobs =
      safelyReadLocalStorage(
        "korvoCustomerJobs",
        []
      );

    return Array.isArray(jobs)
      ? jobs
      : [];
  }


  function formatPostedDate(
    dateValue
  ) {
    if (!dateValue) {
      return "Recently posted";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
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


  function getJobIcon(
    serviceName
  ) {
    const service =
      String(
        serviceName || ""
      ).toLowerCase();

    if (
      service.includes(
        "clean"
      )
    ) {
      return "🧹";
    }

    if (
      service.includes(
        "paint"
      )
    ) {
      return "🎨";
    }

    if (
      service.includes(
        "electric"
      )
    ) {
      return "⚡";
    }

    if (
      service.includes("lawn") ||
      service.includes(
        "landscap"
      )
    ) {
      return "🌿";
    }

    if (
      service.includes(
        "moving"
      )
    ) {
      return "📦";
    }

    if (
      service.includes(
        "drapery"
      ) ||
      service.includes(
        "shade"
      ) ||
      service.includes(
        "blind"
      )
    ) {
      return "🪟";
    }

    return "🛠️";
  }


  function createSubmittedJobCard(
    job
  ) {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "job-item";


    const service =
      job.service ||
      job.category ||
      "Local Service";

    const title =
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
      job.id ||
      "KRV-000000";

    const customer =
      job.customerName ||
      job.customer ||
      "Customer";

    const submittedAt =
      job.submittedAt ||
      job.createdAt ||
      job.date;


    article.innerHTML = `
      <div class="job-icon">
        ${getJobIcon(
          service
        )}
      </div>


      <div class="job-main">

        <div class="job-title-row">

          <div>

            <h3>
              ${escapeHTML(
                title
              )}
            </h3>

            <p>
              ${escapeHTML(
                `${city}, ${state}`
              )}
              · Posted
              ${escapeHTML(
                formatPostedDate(
                  submittedAt
                )
              )}
            </p>

          </div>

          <span class="status-badge waiting">
            Waiting for quotes
          </span>

        </div>


        <p class="job-description">
          ${escapeHTML(
            description
          )}
        </p>


        <div class="job-footer">

          <span>
            💰
            ${escapeHTML(
              budget
            )}
          </span>

          <span>
            📅
            ${escapeHTML(
              timeframe
            )}
          </span>

          <span>
            🆔
            ${escapeHTML(
              reference
            )}
          </span>

        </div>


        <p class="job-customer">
          Posted by
          ${escapeHTML(
            customer
          )}
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

      </div>
    `;


    article
      .querySelector(
        ".generated-job-button"
      )
      ?.addEventListener(
        "click",
        () => {
          openInfoModal({
            eyebrow:
              "JOB DETAILS",

            title,

            message:
              description,

            details: [
              {
                label:
                  "Reference",

                value:
                  reference
              },

              {
                label:
                  "Budget",

                value:
                  budget
              },

              {
                label:
                  "Timeframe",

                value:
                  timeframe
              },

              {
                label:
                  "Customer",

                value:
                  customer
              }
            ]
          });
        }
      );


    article
      .querySelector(
        ".generated-more-button"
      )
      ?.addEventListener(
        "click",
        () => {
          showDemoMessage(
            "Editing and deleting submitted jobs will be added later."
          );
        }
      );


    return article;
  }


  function loadSubmittedJobs() {
    const jobs =
      getSubmittedJobs();

    if (
      !jobsList ||
      jobs.length === 0
    ) {
      return;
    }

    jobs
      .slice()
      .reverse()
      .forEach((job) => {
        jobsList.prepend(
          createSubmittedJobCard(
            job
          )
        );
      });
  }


  /* =========================
     Dashboard Stats
     ========================= */

  function loadDashboardStats() {
    const submittedJobs =
      getSubmittedJobs();

    const professionalQuotes =
      getProfessionalQuotes();

    const acceptedQuotes =
      safelyReadLocalStorage(
        "korvoAcceptedQuotes",
        []
      );


    if (activeJobsCount) {
      activeJobsCount.textContent =
        String(
          3 +
          submittedJobs.length
        );
    }


    if (quotesCount) {
      quotesCount.textContent =
        String(
          2 +
          professionalQuotes.length
        );
    }


    if (
      completedJobsCount &&
      Array.isArray(
        acceptedQuotes
      )
    ) {
      completedJobsCount.textContent =
        String(
          18 +
          acceptedQuotes.length
        );
    }
  }


  /* =========================
     Current Year
     ========================= */

  if (currentYear) {
    currentYear.textContent =
      String(
        new Date()
          .getFullYear()
      );
  }


  /* =========================
     Initialize
     ========================= */

  loadNotificationState();

  loadSavedProfessionals();

  loadSubmittedJobs();

  renderProfessionalQuotes();

  loadDashboardStats();

});