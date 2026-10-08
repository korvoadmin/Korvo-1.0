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

  const customerLogoutButton =
    document.getElementById(
    "customerLogoutButton"
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
  let submittedJobsCache = [];
  let professionalQuotesCache = [];
  let activeJobsCache = [];
  let reviewsCache = [];


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
  /* =========================
   Review Modal Elements
   ========================= */

const reviewModal =
  document.getElementById(
    "reviewModal"
  );

const closeReviewModalButton =
  document.getElementById(
    "closeReviewModalButton"
  );

const cancelReviewButton =
  document.getElementById(
    "cancelReviewButton"
  );

const submitReviewButton =
  document.getElementById(
    "submitReviewButton"
  );

const reviewProfessionalText =
  document.getElementById(
    "reviewProfessionalText"
  );

const reviewComment =
  document.getElementById(
    "reviewComment"
  );

const reviewStars =
  document.querySelectorAll(
    ".review-star"
  );

let selectedReviewRating = 0;

let shouldOpenReviewAfterInfo = false;

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
  /* =========================
   Review Modal Functions
   ========================= */

async function fetchCustomerReviews() {

  if (
    typeof korvoSupabase ===
    "undefined"
  ) {
    throw new Error(
      "Supabase is not available."
    );
  }


  const {
    data: userData,
    error: userError
  } =
    await korvoSupabase.auth.getUser();


  if (
    userError ||
    !userData?.user
  ) {
    throw (
      userError ||
      new Error(
        "Customer authentication is required."
      )
    );
  }


  const {
    data,
    error
  } =
    await korvoSupabase
      .from("reviews")
      .select(`
        id,
        active_job_id,
        job_id,
        customer_id,
        professional_id,
        rating,
        comment,
        job_title,
        job_reference,
        professional_name,
        created_at
      `)
      .eq(
        "customer_id",
        userData.user.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }


  reviewsCache =
    Array.isArray(data)
      ? data
      : [];


  return reviewsCache;
}


function hasReviewForJob(
  jobId
) {

  return reviewsCache.some(
    (review) =>
      String(
        review.job_id ||
        ""
      ) ===
      String(
        jobId ||
        ""
      )
  );

}


async function submitJobReview(
  jobId,
  rating,
  comment
) {

  const {
    data,
    error
  } =
    await korvoSupabase.rpc(
      "submit_job_review",
      {
        p_job_id:
          jobId,

        p_rating:
          rating,

        p_comment:
          comment
      }
    );


  if (error) {
    throw error;
  }


  return data;
}


function openReviewModal() {
  if (!reviewModal) {
    return;
  }

  const pendingReview =
    safelyReadLocalStorage(
      "korvoPendingReview",
      null
    );

  if (!pendingReview) {
    openInfoModal({
      eyebrow: "REVIEW",
      title: "No Review Pending",
      message:
        "There is no completed job waiting for a review right now."
    });

    return;
  }

  selectedReviewRating = 0;

  reviewStars.forEach(
    (star) => {
      star.classList.remove(
        "active"
      );
    }
  );

  if (reviewComment) {
    reviewComment.value = "";
  }

  if (reviewProfessionalText) {
    reviewProfessionalText.textContent =
      `How was your experience with ${pendingReview.professional} on "${pendingReview.jobTitle}"?`;
  }

  reviewModal.classList.remove(
    "hidden"
  );

  document.body.classList.add(
    "modal-open"
  );
}


function closeReviewModal() {
  if (!reviewModal) {
    return;
  }

  reviewModal.classList.add(
    "hidden"
  );

  document.body.classList.remove(
    "modal-open"
  );
}


reviewStars.forEach(
  (star) => {
    star.addEventListener(
      "click",
      () => {

        selectedReviewRating =
          Number(
            star.dataset.rating || 0
          );

        reviewStars.forEach(
          (reviewStar) => {
            const rating =
              Number(
                reviewStar.dataset.rating || 0
              );

            reviewStar.classList.toggle(
              "active",
              rating <=
              selectedReviewRating
            );
          }
        );

      }
    );
  }
);


closeReviewModalButton
  ?.addEventListener(
    "click",
    closeReviewModal
  );


cancelReviewButton
  ?.addEventListener(
    "click",
    closeReviewModal
  );


reviewModal
  ?.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        reviewModal
      ) {
        closeReviewModal();
      }
    }
  );
  submitReviewButton
  ?.addEventListener(
    "click",
    async () => {

      if (
        selectedReviewRating === 0
      ) {
        alert(
          "Please choose a star rating before submitting your review."
        );

        return;
      }


      const pendingReview =
        safelyReadLocalStorage(
          "korvoPendingReview",
          null
        );


      if (
        !pendingReview ||
        !pendingReview.jobId
      ) {

        closeReviewModal();


        openInfoModal({
          eyebrow:
            "REVIEW ERROR",

          title:
            "Review Not Found",

          message:
            "Korvo could not find the completed job connected to this review."
        });


        return;
      }


      const reviewedProfessional =
        pendingReview.professional ||
        "this professional";


      submitReviewButton.disabled =
        true;

      submitReviewButton.textContent =
        "Submitting...";


      try {

        await submitJobReview(
          pendingReview.jobId,
          selectedReviewRating,
          reviewComment
            ? reviewComment.value.trim()
            : ""
        );


        await fetchCustomerReviews();


        localStorage.removeItem(
          "korvoPendingReview"
        );


        closeReviewModal();


        await loadSubmittedJobs();

        loadDashboardStats();


        openInfoModal({
          eyebrow:
            "REVIEW SUBMITTED",

          title:
            "Thank You!",

          message:
            `Your review for ${reviewedProfessional} has been securely saved to Korvo.`,

          success:
            true,

          details: [
            {
              label:
                "Rating",

              value:
                `${selectedReviewRating} out of 5 stars`
            },

            {
              label:
                "Professional",

              value:
                reviewedProfessional
            },

            {
              label:
                "Status",

              value:
                "Review submitted"
            }
          ]
        });


      } catch (error) {

        console.error(
          "Review submission failed:",
          error
        );


        openInfoModal({
          eyebrow:
            "REVIEW ERROR",

          title:
            "Could Not Submit Review",

          message:
            error?.message ||
            "Korvo could not save your review. Please try again."
        });


      } finally {

        submitReviewButton.disabled =
          false;

        submitReviewButton.textContent =
          "Submit Review";

      }

    }
  );


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
    () => {
      shouldOpenReviewAfterInfo =
        false;

      closeInfoModal();
    }
  );

  infoModalDoneButton
  ?.addEventListener(
    "click",
    () => {
      closeInfoModal();

      if (
        shouldOpenReviewAfterInfo
      ) {
        shouldOpenReviewAfterInfo =
          false;

        openReviewModal();
      }
    }
  );

  infoModal?.addEventListener(
  "click",
  (event) => {
    if (
      event.target === infoModal
    ) {
      shouldOpenReviewAfterInfo =
        false;

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

  customerLogoutButton
  ?.addEventListener(
    "click",
    async (event) => {

      event.preventDefault();

      const confirmed =
        confirm(
          "Sign out of your Korvo account?"
        );

      if (!confirmed) {
        return;
      }

      try {

        if (
          typeof korvoSupabase ===
          "undefined"
        ) {
          throw new Error(
            "Supabase is not available."
          );
        }

        const { error } =
          await korvoSupabase
            .auth
            .signOut();

        if (error) {
          throw error;
        }

        localStorage.removeItem(
          "korvoMessagingRole"
        );

        localStorage.removeItem(
          "korvoOpenConversation"
        );

        window.location.href =
          "index.html";

      } catch (error) {

        console.error(
          "Customer sign out failed:",
          error
        );

        alert(
          "Korvo could not sign you out. Please try again."
        );
      }
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
    return professionalQuotesCache;
  }


  async function fetchProfessionalQuotes() {

    if (
      typeof korvoSupabase ===
      "undefined"
    ) {
      throw new Error(
        "Supabase is not available."
      );
    }


    const {
      data: authData,
      error: authError
    } =
      await korvoSupabase.auth.getUser();


    if (
      authError ||
      !authData?.user
    ) {
      throw (
        authError ||
        new Error(
          "Customer authentication is required."
        )
      );
    }


    const {
      data,
      error
    } =
      await korvoSupabase
        .from("quotes")
        .select(`
          id,
          job_id,
          customer_id,
          professional_id,
          amount,
          timeframe,
          message,
          status,
          job_title,
          job_reference,
          job_city,
          job_state,
          professional_name,
          created_at
        `)
        .eq(
          "customer_id",
          authData.user.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    professionalQuotesCache =
      Array.isArray(data)
        ? data
        : [];


    return professionalQuotesCache;
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


  async function respondToQuote(
    quoteId,
    action
  ) {

    if (
      typeof korvoSupabase ===
      "undefined"
    ) {
      throw new Error(
        "Supabase is not available."
      );
    }


    const {
      data,
      error
    } =
      await korvoSupabase.rpc(
        "respond_to_quote",
        {
          p_quote_id:
            quoteId,

          p_action:
            action
        }
      );


    if (error) {
      throw error;
    }


    return data;
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
      quote.professional_name ||
      quote.professional ||
      "Korvo Professional";

    const professionalType =
      quote.professionalType ||
      "Korvo Professional";

    const initials =
      quote.professionalInitials ||
      getInitials(
        professionalName
      );

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
      quote.job_title ||
      quote.jobTitle ||
      "Customer Project";

    const reference =
      quote.job_reference ||
      quote.jobReference ||
      quote.job_id ||
      quote.jobId ||
      "Not assigned";

    const createdDate =
      formatQuoteDate(
        quote.created_at ||
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

          </div>

          <p>
            ${escapeHTML(
              professionalType
            )}
          </p>

          <div class="rating-row">

            <span>
              Korvo professional
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
              : quoteAccepted
                ? "Quote Accepted"
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


    article
      .querySelector(
        ".generated-decline-quote-button"
      )
      ?.addEventListener(
        "click",
        async (event) => {

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


          const confirmed =
            confirm(
              `Decline the quote from ${professional}?`
            );


          if (!confirmed) {
            return;
          }


          button.disabled =
            true;

          button.textContent =
            "Declining...";


          try {

            await respondToQuote(
              quoteId,
              "decline"
            );


            await fetchProfessionalQuotes();

            renderProfessionalQuotes();

            await loadSubmittedJobs();

            loadDashboardStats();


            openInfoModal({
              eyebrow:
                "QUOTE DECLINED",

              title:
                "Quote Declined",

              message:
                "The quote was declined and the professional-side status is now updated in Korvo.",

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

          } catch (error) {

            console.error(
              "Could not decline quote:",
              error
            );


            openInfoModal({
              eyebrow:
                "QUOTE ERROR",

              title:
                "Could Not Decline Quote",

              message:
                error?.message ||
                "Korvo could not update this quote. Please refresh and try again."
            });


            await fetchProfessionalQuotes()
              .catch(() => {});

            renderProfessionalQuotes();

          }

        }
      );


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


    quotesList.innerHTML =
      "";


    const quotes =
      getProfessionalQuotes();


    if (
      quotes.length ===
      0
    ) {

      const emptyState =
        document.createElement(
          "div"
        );


      emptyState.className =
        "dashboard-empty-state";


      emptyState.innerHTML = `
        <p>
          You have not received any quotes yet.
        </p>
      `;


      quotesList.appendChild(
        emptyState
      );


      return;
    }


    quotes.forEach(
      (quote) => {

        quotesList.appendChild(
          createProfessionalQuoteCard(
            quote
          )
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
      async () => {

        if (
          !pendingProfessional ||
          !pendingQuoteId
        ) {
          return;
        }


        const acceptedProfessional =
          pendingProfessional;

        const acceptedQuoteId =
          pendingQuoteId;


        confirmAcceptQuoteButton.disabled =
          true;

        confirmAcceptQuoteButton.textContent =
          "Accepting...";


        try {

          await respondToQuote(
            acceptedQuoteId,
            "accept"
          );


          await fetchProfessionalQuotes();

          renderProfessionalQuotes();


          await loadSubmittedJobs();

          loadDashboardStats();


          closeAcceptModal();


          openInfoModal({
            eyebrow:
              "QUOTE ACCEPTED",

            title:
              "Professional Selected!",

            message:
              "Your quote has been accepted and Korvo created an active job for this professional.",

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
                  "Job",

                value:
                  "Active"
              },

              {
                label:
                  "Next Step",

                value:
                  "Continue the conversation in Korvo Messages"
              }
            ]
          });

        } catch (error) {

          console.error(
            "Could not accept quote:",
            error
          );


          closeAcceptModal();


          openInfoModal({
            eyebrow:
              "QUOTE ERROR",

            title:
              "Could Not Accept Quote",

            message:
              error?.message ||
              "Korvo could not accept this quote. Refresh the dashboard and try again."
          });


          await fetchProfessionalQuotes()
            .catch(() => {});

          renderProfessionalQuotes();

        } finally {

          confirmAcceptQuoteButton.disabled =
            false;

          confirmAcceptQuoteButton.textContent =
            "Confirm Quote";

        }

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
      reviewModal &&
      !reviewModal
        .classList.contains(
          "hidden"
        )
    ) {
      closeReviewModal();
    }


    if (
      infoModal &&
      !infoModal
        .classList.contains(
          "hidden"
        )
    ) {
      shouldOpenReviewAfterInfo =
        false;

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

if (action === "review") {
  openReviewModal();
  return;
}

const messages = {
  view:
    "A full job-details page will be added later.",

  quotes:
    "The complete quote comparison screen will be added later."
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
  return submittedJobsCache;
}


async function fetchSubmittedJobs() {

  if (
    typeof korvoSupabase ===
    "undefined"
  ) {
    throw new Error(
      "Supabase is not available."
    );
  }


  const {
    data: userData,
    error: userError
  } =
    await korvoSupabase
      .auth
      .getUser();


  if (userError) {
    throw userError;
  }


  const user =
    userData?.user;


  if (!user) {

    window.location.href =
      "login.html";

    return [];
  }


  const {
    data,
    error
  } =
    await korvoSupabase
      .from("jobs")
      .select(`
        id,
        customer_id,
        title,
        description,
        category,
        city,
        state,
        budget_min,
        budget_max,
        preferred_date,
        timeframe,
        status,
        reference,
        created_at
      `)
      .eq(
        "customer_id",
        user.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }


  submittedJobsCache =
    Array.isArray(data)
      ? data
      : [];


  return submittedJobsCache;
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
function formatJobBudget(
  job
) {

  const minimum =
    job.budget_min === null ||
    job.budget_min === undefined
      ? null
      : Number(
          job.budget_min
        );

  const maximum =
    job.budget_max === null ||
    job.budget_max === undefined
      ? null
      : Number(
          job.budget_max
        );


  if (
    minimum === null &&
    maximum === null
  ) {
    return "Professional estimate requested";
  }


  if (
    minimum === 0 &&
    maximum !== null
  ) {
    return (
      `Under $${(
        maximum + 1
      ).toLocaleString()}`
    );
  }


  if (
    minimum !== null &&
    maximum === null
  ) {
    return (
      `$${minimum.toLocaleString()} or more`
    );
  }


  if (
    minimum !== null &&
    maximum !== null
  ) {
    return (
      `$${minimum.toLocaleString()} – ` +
      `$${maximum.toLocaleString()}`
    );
  }


  return "Budget not specified";
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
  "job-item generated-submitted-job";


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
  formatJobBudget(
    job
  );

    const timeframe =
  job.timeframe ||
  "Flexible";

const reference =
  job.reference ||
  job.jobReference ||
  job.id ||
  "KRV-000000";

    const customer =
  "You";

    const submittedAt =
  job.created_at ||
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

  async function fetchCustomerActiveJobs() {

    if (
      typeof korvoSupabase ===
      "undefined"
    ) {
      throw new Error(
        "Supabase is not available."
      );
    }


    const {
      data: userData,
      error: userError
    } =
      await korvoSupabase.auth.getUser();


    if (
      userError ||
      !userData?.user
    ) {
      throw (
        userError ||
        new Error(
          "Customer authentication is required."
        )
      );
    }


    const {
      data,
      error
    } =
      await korvoSupabase
        .from("active_jobs")
        .select(`
          id,
          job_id,
          quote_id,
          customer_id,
          professional_id,
          amount,
          timeframe,
          status,
          job_title,
          job_reference,
          job_city,
          job_state,
          professional_name,
          accepted_at,
          professional_completed_at,
          completed_at
        `)
        .eq(
          "customer_id",
          userData.user.id
        )
        .order(
          "accepted_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    activeJobsCache =
      Array.isArray(data)
        ? data
        : [];


    return activeJobsCache;
  }


  async function confirmCustomerJobCompletion(
    activeJobId
  ) {

    if (
      typeof korvoSupabase ===
      "undefined"
    ) {
      throw new Error(
        "Supabase is not available."
      );
    }


    const {
      data,
      error
    } =
      await korvoSupabase.rpc(
        "customer_confirm_job_completion",
        {
          p_active_job_id:
            activeJobId
        }
      );


    if (error) {
      throw error;
    }


    return data;
  }


  function createActiveJobCard(
    job
  ) {

    const article =
      document.createElement(
        "article"
      );


    article.className =
      "job-item active-job-item";


    const title =
      job.job_title ||
      job.jobTitle ||
      "Active Korvo Job";


    const location =
      [
        job.job_city,
        job.job_state
      ]
        .filter(Boolean)
        .join(", ") ||
      job.location ||
      "Atlanta, GA";


    const professional =
      job.professional_name ||
      job.professional ||
      "Korvo Professional";


    const amount =
      Number(
        job.amount || 0
      );


    const reference =
      job.job_reference ||
      job.jobReference ||
      job.job_id ||
      job.jobId ||
      "KRV-000000";


    const timeframe =
      job.timeframe ||
      "Flexible";


    const rawStatus =
      String(
        job.status ||
        "active"
      ).toLowerCase();


    const statusLabel =
      rawStatus ===
      "pending_confirmation"
        ? "Completion Requested"
        : rawStatus ===
          "completed"
          ? "Completed"
          : rawStatus ===
            "cancelled"
            ? "Cancelled"
            : "Active";


    const isPendingConfirmation =
      rawStatus ===
      "pending_confirmation";


    const isCompleted =
      rawStatus ===
      "completed";


    const reviewAlreadySubmitted =
      isCompleted &&
      hasReviewForJob(
        job.job_id ||
        job.jobId ||
        ""
      );


    article.innerHTML = `
      <div class="job-icon">
        ✅
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
                location
              )}
            </p>

          </div>


          <span class="status-badge ${
            rawStatus ===
            "pending_confirmation"
              ? "waiting"
              : "completed"
          }">
            ${escapeHTML(
              statusLabel
            )}
          </span>

        </div>


        <p class="job-description">
          ${
            isPendingConfirmation
              ? `${escapeHTML(
                  professional
                )} marked this job complete. Review the work and confirm completion.`
              : `Assigned to <strong>${escapeHTML(
                  professional
                )}</strong>`
          }
        </p>


        <div class="job-footer">

          <span>
            💰 $${amount.toLocaleString()}
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


        <div class="job-actions">

          ${
            isPendingConfirmation
              ? `
                <button
                  type="button"
                  class="small-primary-button confirm-completion-button"
                >
                  ✓ Confirm Completion
                </button>
              `
              : ""
          }

          ${
            isCompleted
              ? reviewAlreadySubmitted
                ? `
                  <button
                    type="button"
                    class="small-secondary-button"
                    disabled
                  >
                    ★ Review Submitted
                  </button>
                `
                : `
                  <button
                    type="button"
                    class="small-primary-button leave-review-button"
                  >
                    ★ Leave Review
                  </button>
                `
              : ""
          }

          <button
            type="button"
            class="small-primary-button active-job-message-button"
            data-professional="${escapeHTML(
              professional
            )}"
          >
            Message Professional
          </button>


          <button
            type="button"
            class="small-secondary-button active-job-view-button"
          >
            View Job
          </button>

        </div>

      </div>
    `;


    article
      .querySelector(
        ".leave-review-button"
      )
      ?.addEventListener(
        "click",
        () => {

          safelyWriteLocalStorage(
            "korvoPendingReview",
            {
              jobId:
                job.job_id ||
                job.jobId ||
                "",

              jobReference:
                reference,

              jobTitle:
                title,

              professional,

              completedAt:
                job.completed_at ||
                new Date()
                  .toISOString()
            }
          );


          openReviewModal();

        }
      );


    article
      .querySelector(
        ".active-job-message-button"
      )
      ?.addEventListener(
        "click",
        (event) => {

          openProfessionalConversation(
            event.currentTarget
              .dataset.professional ||
            ""
          );

        }
      );


    article
      .querySelector(
        ".confirm-completion-button"
      )
      ?.addEventListener(
        "click",
        async (event) => {

          const confirmed =
            confirm(
              `Confirm that "${title}" has been completed by ${professional}?`
            );


          if (!confirmed) {
            return;
          }


          const button =
            event.currentTarget;


          button.disabled =
            true;

          button.textContent =
            "Confirming...";


          try {

            await confirmCustomerJobCompletion(
              job.id
            );


            safelyWriteLocalStorage(
              "korvoPendingReview",
              {
                jobId:
                  job.job_id ||
                  "",

                jobReference:
                  reference,

                jobTitle:
                  title,

                professional,

                completedAt:
                  new Date()
                    .toISOString()
              }
            );


            await loadSubmittedJobs();

            loadDashboardStats();


            shouldOpenReviewAfterInfo =
              true;


            openInfoModal({
              eyebrow:
                "JOB COMPLETED",

              title:
                "Completion Confirmed!",

              message:
                `${professional}'s work has been marked complete.`,

              success:
                true,

              details: [
                {
                  label:
                    "Job",

                  value:
                    title
                },

                {
                  label:
                    "Professional",

                  value:
                    professional
                },

                {
                  label:
                    "Reference",

                  value:
                    reference
                },

                {
                  label:
                    "Next Step",

                  value:
                    "Leave a review for this professional"
                }
              ]
            });

          } catch (error) {

            console.error(
              "Could not confirm job completion:",
              error
            );


            button.disabled =
              false;

            button.textContent =
              "✓ Confirm Completion";


            openInfoModal({
              eyebrow:
                "JOB ERROR",

              title:
                "Could Not Confirm Completion",

              message:
                error?.message ||
                "Korvo could not complete this job. Refresh and try again."
            });

          }

        }
      );


    article
      .querySelector(
        ".active-job-view-button"
      )
      ?.addEventListener(
        "click",
        () => {

          openInfoModal({
            eyebrow:
              "ACTIVE JOB",

            title,

            message:
              `This job is assigned to ${professional}.`,

            details: [
              {
                label:
                  "Reference",

                value:
                  reference
              },

              {
                label:
                  "Professional",

                value:
                  professional
              },

              {
                label:
                  "Amount",

                value:
                  `$${amount.toLocaleString()}`
              },

              {
                label:
                  "Timeframe",

                value:
                  timeframe
              },

              {
                label:
                  "Status",

                value:
                  statusLabel
              }
            ]
          });

        }
      );


    return article;
  }


  async function loadSubmittedJobs() {

    if (!jobsList) {
      return;
    }


    try {

      const [
        submittedJobs,
        activeJobs
      ] =
        await Promise.all([
          fetchSubmittedJobs(),
          fetchCustomerActiveJobs()
        ]);


      jobsList.innerHTML =
        "";


      const visibleActiveJobs =
        activeJobs.filter(
          (job) => {

            const status =
              String(
                job.status ||
                "active"
              ).toLowerCase();


            return (
              status !==
                "cancelled"
            );

          }
        );


      visibleActiveJobs
        .slice()
        .reverse()
        .forEach(
          (job) => {

            jobsList.prepend(
              createActiveJobCard(
                job
              )
            );

          }
        );


      submittedJobs
        .slice()
        .reverse()
        .forEach(
          (job) => {

            const isAlreadyActive =
              activeJobs.some(
                (activeJob) =>
                  String(
                    activeJob.job_id ||
                    activeJob.jobId ||
                    ""
                  ) ===
                  String(
                    job.id ||
                    ""
                  )
              );


            if (isAlreadyActive) {
              return;
            }


            jobsList.prepend(
              createSubmittedJobCard(
                job
              )
            );

          }
        );


      if (
        submittedJobs.length === 0 &&
        visibleActiveJobs.length === 0
      ) {

        const emptyState =
          document.createElement(
            "div"
          );


        emptyState.className =
          "dashboard-empty-state";


        emptyState.innerHTML = `
          <p>
            You have not posted any jobs yet.
          </p>

          <a
            href="post-a-job.html"
            class="primary-button"
          >
            Post Your First Job
          </a>
        `;


        jobsList.appendChild(
          emptyState
        );
      }


    } catch (error) {

      console.error(
        "Unable to load customer jobs:",
        error
      );


      jobsList.innerHTML =
        "";


      const errorState =
        document.createElement(
          "div"
        );


      errorState.className =
        "dashboard-empty-state";


      errorState.innerHTML = `
        <p>
          Korvo could not load your jobs.
          Please refresh the page and try again.
        </p>
      `;


      jobsList.appendChild(
        errorState
      );

    }
  }


  /* =========================
     Dashboard Stats
     ========================= */

  function loadDashboardStats() {

    const professionalQuotes =
      getProfessionalQuotes();


    const activeJobTotal =
      activeJobsCache.filter(
        (job) => {

          const status =
            String(
              job.status ||
              "active"
            ).toLowerCase();


          return (
            status !==
              "completed" &&
            status !==
              "cancelled"
          );

        }
      ).length;


    if (activeJobsCount) {
      activeJobsCount.textContent =
        String(
          activeJobTotal
        );
    }


    if (quotesCount) {
      quotesCount.textContent =
        String(
          professionalQuotes.length
        );
    }


    const completedJobTotal =
      activeJobsCache.filter(
        (job) =>
          String(
            job.status ||
            ""
          ).toLowerCase() ===
          "completed"
      ).length;


    if (completedJobsCount) {
      completedJobsCount.textContent =
        String(
          completedJobTotal
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

  async function initializeDashboard() {

  loadNotificationState();

  loadSavedProfessionals();


  /*
    Load real Supabase quotes for
    the signed-in customer before
    rendering Recent Quotes.
  */

  try {

    await fetchProfessionalQuotes();

  } catch (error) {

    console.error(
      "Unable to load customer quotes:",
      error
    );

    professionalQuotesCache = [];

  }


  renderProfessionalQuotes();


  /*
    Load real reviews before jobs
    so completed jobs can show the
    correct review action.
  */

  try {

    await fetchCustomerReviews();

  } catch (error) {

    console.error(
      "Unable to load customer reviews:",
      error
    );

    reviewsCache = [];

  }


  /*
    Load real Supabase jobs so
    dashboard statistics and cards
    use current account data.
  */

  await loadSubmittedJobs();


  loadDashboardStats();
}


initializeDashboard();

});