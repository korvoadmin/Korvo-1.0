"use strict";

document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     Elements
     ========================= */

  const currentYear = document.getElementById("currentYear");

  const profileButton =
    document.getElementById("professionalProfileButton");

  const professionalMenu =
    document.getElementById("professionalMenu");

  const mobileMenuButton =
    document.getElementById("mobileMenuButton");

  const mobileNav =
    document.getElementById("mobileNav");

  const notificationButton =
    document.getElementById("notificationButton");

  const notificationCount =
    document.getElementById("notificationCount");

  const notificationsSection =
    document.getElementById("notificationsSection");

  const notificationsList =
    document.getElementById("notificationsList");

  const markAllReadButton =
    document.getElementById("markAllReadButton");

  const availableJobsList =
    document.getElementById("availableJobsList");

  const submittedQuotesList =
    document.getElementById("submittedQuotesList");

  const availableJobsCount =
    document.getElementById("availableJobsCount");

  const submittedQuotesCount =
    document.getElementById("submittedQuotesCount");

  const jobsWonCount =
    document.getElementById("jobsWonCount");

  const serviceFilter =
    document.getElementById("serviceFilter");

  const quoteModal =
    document.getElementById("quoteModal");

  const closeQuoteModalButton =
    document.getElementById("closeQuoteModalButton");

  const cancelQuoteButton =
    document.getElementById("cancelQuoteButton");

  const quoteForm =
    document.getElementById("quoteForm");

  const selectedJobTitle =
    document.getElementById("selectedJobTitle");

  const selectedJobReference =
    document.getElementById("selectedJobReference");

  const quoteAmount =
    document.getElementById("quoteAmount");

  const quoteTimeframe =
    document.getElementById("quoteTimeframe");

  const quoteMessage =
    document.getElementById("quoteMessage");

  const quoteMessageCount =
    document.getElementById("quoteMessageCount");

  const messagesButton =
    document.getElementById("messagesButton");

  const availabilityButton =
    document.getElementById("availabilityButton");

  const servicesButton =
    document.getElementById("servicesButton");

  const accountSettingsButton =
    document.getElementById("accountSettingsButton");

  const logoutButton =
    document.getElementById("logoutButton");

  const infoModal =
    document.getElementById("infoModal");

  const infoModalCard =
    infoModal
      ? infoModal.querySelector(".info-modal-card")
      : null;

  const infoModalEyebrow =
    document.getElementById("infoModalEyebrow");

  const infoModalTitle =
    document.getElementById("infoModalTitle");

  const infoModalMessage =
    document.getElementById("infoModalMessage");

  const infoModalDetails =
    document.getElementById("infoModalDetails");

  const closeInfoModalButton =
    document.getElementById("closeInfoModalButton");

  const infoModalDoneButton =
    document.getElementById("infoModalDoneButton");


  /* =========================
     Current Professional
     ========================= */

  const professionalProfile = {
    name: "Chris Custom Installations",
    type: "Window Treatment Specialist",
    profile: "chris-profile.html",
    initials: "CC",
    rating: "5.0"
  };


  /* =========================
     Current Year
     ========================= */

  if (currentYear) {
    currentYear.textContent =
      String(new Date().getFullYear());
  }


  /* =========================
     Sample Jobs
     ========================= */

  const sampleJobs = [
    {
      id: "job-001",
      reference: "KRV-1001",
      title: "Motorized Shade Installation",
      category: "window treatments",
      location: "Buckhead, Atlanta",
      budget: "$450 - $650",
      date: "August 10",
      description:
        "Customer needs six motorized roller shades installed and programmed.",
      customer: "Sarah M."
    },

    {
      id: "job-002",
      reference: "KRV-1003",
      title: "Interior Painting",
      category: "painting",
      location: "Brookhaven, GA",
      budget: "$900 - $1,300",
      date: "August 14",
      description:
        "Paint living room, hallway, and two bedrooms in a residential home.",
      customer: "Michael R."
    },

    {
      id: "job-003",
      reference: "KRV-1004",
      title: "Move Apartment Furniture",
      category: "moving",
      location: "Midtown Atlanta",
      budget: "$300 - $450",
      date: "August 12",
      description:
        "Help move furniture from a one-bedroom apartment into a nearby apartment.",
      customer: "Jessica L."
    },

    {
      id: "job-004",
      reference: "KRV-1002",
      title: "Deep Home Cleaning",
      category: "cleaning",
      location: "Sandy Springs, GA",
      budget: "$250 - $400",
      date: "August 11",
      description:
        "Deep cleaning needed for a four-bedroom home before guests arrive.",
      customer: "Amanda P."
    },

    {
      id: "job-005",
      reference: "KRV-1005",
      title: "Landscape Cleanup",
      category: "landscaping",
      location: "Dunwoody, GA",
      budget: "$275 - $500",
      date: "August 16",
      description:
        "Trim shrubs, remove leaves, clean flower beds, and haul away debris.",
      customer: "Daniel K."
    }
  ];


  /* =========================
     HTML Safety
     ========================= */

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  /* =========================
     Korvo Information Modal
     ========================= */

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
      infoModalEyebrow.textContent = eyebrow;
    }

    if (infoModalTitle) {
      infoModalTitle.textContent = title;
    }

    if (infoModalMessage) {
      infoModalMessage.textContent = message;
    }

    if (infoModalDetails) {
      infoModalDetails.innerHTML = "";
    }

    if (infoModalCard) {
      infoModalCard.classList.toggle(
        "success-modal",
        success
      );
    }

    if (success && infoModalDetails) {
      const successIcon =
        document.createElement("div");

      successIcon.className =
        "info-success-icon";

      successIcon.textContent = "✓";

      infoModalDetails.appendChild(
        successIcon
      );
    }

    if (infoModalDetails) {
      details.forEach((detail) => {
        const row =
          document.createElement("div");

        row.className =
          "info-detail-row";

        row.innerHTML = `
          <span class="info-detail-label">
            ${escapeHTML(detail.label)}
          </span>

          <span class="info-detail-value">
            ${escapeHTML(detail.value)}
          </span>
        `;

        infoModalDetails.appendChild(row);
      });
    }

    infoModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }


  function closeInfoModal() {
    if (!infoModal) {
      return;
    }

    infoModal.classList.add("hidden");
    document.body.style.overflow = "";
  }


  closeInfoModalButton?.addEventListener(
    "click",
    closeInfoModal
  );

  infoModalDoneButton?.addEventListener(
    "click",
    closeInfoModal
  );

  infoModal?.addEventListener(
    "click",
    (event) => {
      if (event.target === infoModal) {
        closeInfoModal();
      }
    }
  );


  /* =========================
     Local Storage
     ========================= */

  function getCustomerJobs() {
    try {
      const savedJobs =
        JSON.parse(
          localStorage.getItem(
            "korvoCustomerJobs"
          )
        );

      if (
        Array.isArray(savedJobs) &&
        savedJobs.length > 0
      ) {
        return savedJobs.map(
          (job, index) => ({
            ...job,

            id:
              job.id ||
              job.jobId ||
              `customer-job-${index + 1}`,

            reference:
              job.reference ||
              job.jobReference ||
              job.id ||
              job.jobId ||
              `KRV-${String(
                index + 1
              ).padStart(4, "0")}`
          })
        );
      }

      return sampleJobs;
    } catch (error) {
      console.error(
        "Could not load customer jobs:",
        error
      );

      return sampleJobs;
    }
  }


  function getSubmittedQuotes() {
    try {
      const quotes =
        JSON.parse(
          localStorage.getItem(
            "korvoProfessionalQuotes"
          )
        );

      return Array.isArray(quotes)
        ? quotes
        : [];
    } catch (error) {
      console.error(
        "Could not load submitted quotes:",
        error
      );

      return [];
    }
  }


  function saveSubmittedQuotes(quotes) {
    try {
      localStorage.setItem(
        "korvoProfessionalQuotes",
        JSON.stringify(quotes)
      );
    } catch (error) {
      console.error(
        "Could not save submitted quotes:",
        error
      );
    }
  }


  let customerJobs =
    getCustomerJobs();

  let submittedQuotes =
    getSubmittedQuotes();


  /* =========================
     Job Helpers
     ========================= */

  function getJobId(job) {
    return String(
      job.id ||
      job.jobId ||
      job.reference ||
      job.jobReference ||
      ""
    );
  }


  function getJobReference(job) {
    return String(
      job.reference ||
      job.jobReference ||
      job.id ||
      job.jobId ||
      "KRV-UNASSIGNED"
    );
  }


  function getJobLocation(job) {
    if (job.location) {
      return job.location;
    }

    const city =
      job.city || "Atlanta";

    const state =
      job.state || "GA";

    return `${city}, ${state}`;
  }


  function findJobById(jobId) {
    return customerJobs.find(
      (job) =>
        getJobId(job) === String(jobId)
    );
  }


  /* =========================
     Render Available Jobs
     ========================= */

  function renderJobs(
    selectedCategory = "all"
  ) {
    if (!availableJobsList) {
      return;
    }

    availableJobsList.innerHTML = "";

    const filteredJobs =
      selectedCategory === "all"
        ? customerJobs
        : customerJobs.filter(
            (job) =>
              String(
                job.category ||
                job.service ||
                ""
              ).toLowerCase() ===
              selectedCategory.toLowerCase()
          );

    if (filteredJobs.length === 0) {
      availableJobsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            🛠️
          </div>

          <h3>No jobs found</h3>

          <p>
            There are currently no jobs
            available in this category.
          </p>
        </div>
      `;

      if (availableJobsCount) {
        availableJobsCount.textContent =
          "0";
      }

      return;
    }


    filteredJobs.forEach((job) => {
      const jobCard =
        document.createElement("article");

      jobCard.className = "job-card";

      const title =
        job.title ||
        job.jobTitle ||
        "Customer Project";

      const location =
        getJobLocation(job);

      const budget =
        job.budget ||
        job.budgetRange ||
        "Budget not listed";

      const date =
        job.date ||
        job.preferredDate ||
        job.timeframe ||
        "Flexible";

      const description =
        job.description ||
        job.jobDescription ||
        "Customer has not added a description.";

      const customer =
        job.customer ||
        job.customerName ||
        "Korvo Customer";

      const id =
        getJobId(job);

      const reference =
        getJobReference(job);

      jobCard.innerHTML = `
        <div class="job-card-header">
          <div>

            <p class="eyebrow">
              ${escapeHTML(
                String(
                  job.category ||
                  job.service ||
                  "Local Service"
                )
              )}
            </p>

            <h3>
              ${escapeHTML(title)}
            </h3>

            <p>
              ${escapeHTML(location)}
            </p>

          </div>

          <strong>
            ${escapeHTML(budget)}
          </strong>
        </div>


        <p style="margin-top: 14px;">
          ${escapeHTML(description)}
        </p>


        <div class="job-meta">

          <span>
            👤 ${escapeHTML(customer)}
          </span>

          <span>
            📍 ${escapeHTML(location)}
          </span>

          <span>
            📅 ${escapeHTML(date)}
          </span>

          <span>
            🆔 ${escapeHTML(reference)}
          </span>

        </div>


        <div class="job-actions">

          <button
            type="button"
            class="primary-button submit-quote-button"
            data-job-id="${escapeHTML(id)}"
          >
            Submit Quote
          </button>

          <button
            type="button"
            class="secondary-button view-job-button"
            data-job-id="${escapeHTML(id)}"
          >
            View Details
          </button>

        </div>
      `;

      availableJobsList.appendChild(
        jobCard
      );
    });


    if (availableJobsCount) {
      availableJobsCount.textContent =
        String(filteredJobs.length);
    }

    addJobButtonListeners();
  }


  /* =========================
     Job Button Events
     ========================= */

  function addJobButtonListeners() {

    document
      .querySelectorAll(
        ".submit-quote-button"
      )
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            openQuoteModal(
              button.dataset.jobId
            );

          }
        );

      });


    document
      .querySelectorAll(
        ".view-job-button"
      )
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            const job =
              findJobById(
                button.dataset.jobId
              );

            if (!job) {
              return;
            }

            const title =
              job.title ||
              job.jobTitle ||
              "Customer Project";

            const description =
              job.description ||
              job.jobDescription ||
              "No description provided.";

            const location =
              getJobLocation(job);

            const budget =
              job.budget ||
              job.budgetRange ||
              "Not listed";

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
                    getJobReference(job)
                },

                {
                  label:
                    "Location",

                  value:
                    location
                },

                {
                  label:
                    "Budget",

                  value:
                    budget
                },

                {
                  label:
                    "Preferred Date",

                  value:
                    job.date ||
                    job.preferredDate ||
                    job.timeframe ||
                    "Flexible"
                },

                {
                  label:
                    "Customer",

                  value:
                    job.customer ||
                    job.customerName ||
                    "Korvo Customer"
                }
              ]
            });

          }
        );

      });

  }


  /* =========================
     Quote Modal
     ========================= */

  function openQuoteModal(jobId) {

    const job =
      findJobById(jobId);

    if (!job || !quoteModal) {
      return;
    }

    if (selectedJobReference) {
      selectedJobReference.value =
        getJobId(job);
    }

    if (selectedJobTitle) {
      selectedJobTitle.textContent =
        job.title ||
        job.jobTitle ||
        "this customer project";
    }

    quoteModal.classList.remove(
      "hidden"
    );

    document.body.style.overflow =
      "hidden";

    setTimeout(() => {
      quoteAmount?.focus();
    }, 100);

  }


  function closeQuoteModal() {

    if (!quoteModal) {
      return;
    }

    quoteModal.classList.add(
      "hidden"
    );

    document.body.style.overflow =
      "";

    quoteForm?.reset();

    if (quoteMessageCount) {
      quoteMessageCount.textContent =
        "0";
    }

  }


  closeQuoteModalButton?.addEventListener(
    "click",
    closeQuoteModal
  );

  cancelQuoteButton?.addEventListener(
    "click",
    closeQuoteModal
  );

  quoteModal?.addEventListener(
    "click",
    (event) => {

      if (event.target === quoteModal) {
        closeQuoteModal();
      }

    }
  );


  document.addEventListener(
    "keydown",
    (event) => {

      if (event.key !== "Escape") {
        return;
      }

      if (
        quoteModal &&
        !quoteModal.classList.contains(
          "hidden"
        )
      ) {
        closeQuoteModal();
      }

      if (
        infoModal &&
        !infoModal.classList.contains(
          "hidden"
        )
      ) {
        closeInfoModal();
      }

    }
  );


  /* =========================
     Character Counter
     ========================= */

  quoteMessage?.addEventListener(
    "input",
    () => {

      if (quoteMessageCount) {
        quoteMessageCount.textContent =
          String(
            quoteMessage.value.length
          );
      }

    }
  );


  /* =========================
     Submit Quote
     ========================= */

  quoteForm?.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();

      const jobId =
        selectedJobReference?.value ||
        "";

      const job =
        findJobById(jobId);


      if (!job) {

        openInfoModal({
          eyebrow:
            "QUOTE ERROR",

          title:
            "Job Not Found",

          message:
            "Korvo could not find this job. Refresh the dashboard and try again."
        });

        return;
      }


      const amount =
        Number(
          quoteAmount?.value
        );


      if (!amount || amount <= 0) {

        openInfoModal({
          eyebrow:
            "QUOTE ERROR",

          title:
            "Enter a Valid Amount",

          message:
            "Your quote amount must be greater than $0."
        });

        quoteAmount?.focus();

        return;
      }


      const existingQuote =
        submittedQuotes.find(
          (quote) =>
            String(quote.jobId) ===
            String(jobId)
        );


      if (existingQuote) {

        openInfoModal({
          eyebrow:
            "QUOTE ALREADY SENT",

          title:
            "Quote Already Submitted",

          message:
            "You already submitted a quote for this job.",

          details: [
            {
              label:
                "Job",

              value:
                existingQuote.jobTitle ||
                "Customer Project"
            },

            {
              label:
                "Status",

              value:
                existingQuote.status ||
                "Pending"
            }
          ]
        });

        return;
      }


      const quote = {

        id:
          `quote-${Date.now()}`,

        jobId,

        jobReference:
          getJobReference(job),

        jobTitle:
          job.title ||
          job.jobTitle ||
          "Customer Project",

        customer:
          job.customer ||
          job.customerName ||
          "Korvo Customer",

        location:
          getJobLocation(job),

        professional:
          professionalProfile.name,

        professionalType:
          professionalProfile.type,

        professionalProfile:
          professionalProfile.profile,

        professionalInitials:
          professionalProfile.initials,

        professionalRating:
          professionalProfile.rating,

        amount,

        timeframe:
          quoteTimeframe?.value ||
          "Flexible",

        message:
          quoteMessage?.value.trim() ||
          "",

        status:
          "Pending",

        createdAt:
          new Date().toISOString()

      };


      submittedQuotes.unshift(
        quote
      );


      saveSubmittedQuotes(
        submittedQuotes
      );


      renderSubmittedQuotes();

      updateDashboardCounters();


      addNotification(
        `Quote submitted for ${quote.jobTitle}.`
      );


      closeQuoteModal();


      openInfoModal({
        eyebrow:
          "QUOTE SENT",

        title:
          "Quote Submitted!",

        message:
          "Your quote has been sent to the customer and is now being tracked in Submitted Quotes.",

        success:
          true,

        details: [
          {
            label:
              "Job",

            value:
              quote.jobTitle
          },

          {
            label:
              "Reference",

            value:
              quote.jobReference
          },

          {
            label:
              "Customer",

            value:
              quote.customer
          },

          {
            label:
              "Your Quote",

            value:
              `$${amount.toLocaleString()}`
          },

          {
            label:
              "Timeframe",

            value:
              quote.timeframe
          },

          {
            label:
              "Status",

            value:
              quote.status
          }
        ]
      });

    }
  );


  /* =========================
     Render Submitted Quotes
     ========================= */

  function renderSubmittedQuotes() {

    if (!submittedQuotesList) {
      return;
    }

    submittedQuotesList.innerHTML =
      "";


    if (
      submittedQuotes.length === 0
    ) {

      submittedQuotesList.innerHTML = `
        <div class="empty-state compact">

          <div class="empty-state-icon">
            📄
          </div>

          <h3>
            No quotes submitted
          </h3>

          <p>
            Your submitted quotes will
            appear here.
          </p>

        </div>
      `;

      return;
    }


    submittedQuotes.forEach(
      (quote) => {

        const quoteCard =
          document.createElement(
            "article"
          );

        quoteCard.className =
          "quote-card";


        const createdDate =
          new Date(
            quote.createdAt
          );


        const formattedDate =
          Number.isNaN(
            createdDate.getTime()
          )
            ? "Recently"
            : createdDate
                .toLocaleDateString(
                  "en-US",
                  {
                    month:
                      "short",

                    day:
                      "numeric",

                    year:
                      "numeric"
                  }
                );


        quoteCard.innerHTML = `
          <div class="quote-card-header">

            <div>

              <p class="eyebrow">
                ${escapeHTML(
                  quote.status ||
                  "Pending"
                )}
              </p>

              <h3>
                ${escapeHTML(
                  quote.jobTitle ||
                  "Customer Project"
                )}
              </h3>

              <p>
                ${escapeHTML(
                  quote.customer ||
                  "Korvo Customer"
                )}
                ·
                ${escapeHTML(
                  quote.location ||
                  "Atlanta, GA"
                )}
              </p>

            </div>

            <strong>
              $${Number(
                quote.amount ||
                0
              ).toLocaleString()}
            </strong>

          </div>


          <div class="job-meta">

            <span>
              🆔
              ${escapeHTML(
                quote.jobReference ||
                quote.jobId ||
                "Not assigned"
              )}
            </span>

            <span>
              ⏱
              ${escapeHTML(
                quote.timeframe ||
                "Flexible"
              )}
            </span>

            <span>
              📅
              ${escapeHTML(
                formattedDate
              )}
            </span>

            <span>
              Status:
              ${escapeHTML(
                quote.status ||
                "Pending"
              )}
            </span>

          </div>


          <p style="margin-top: 14px;">
            ${escapeHTML(
              quote.message ||
              "No message included."
            )}
          </p>
        `;


        submittedQuotesList.appendChild(
          quoteCard
        );

      }
    );

  }


  /* =========================
     Dashboard Counters
     ========================= */

  function updateDashboardCounters() {

    if (availableJobsCount) {
      availableJobsCount.textContent =
        String(
          customerJobs.length
        );
    }


    if (submittedQuotesCount) {
      submittedQuotesCount.textContent =
        String(
          submittedQuotes.length
        );
    }


    if (jobsWonCount) {

      const wonQuotes =
        submittedQuotes.filter(
          (quote) =>
            String(
              quote.status
            ).toLowerCase() ===
            "accepted"
        );

      jobsWonCount.textContent =
        String(
          wonQuotes.length
        );

    }

  }


  /* =========================
     Service Filter
     ========================= */

  serviceFilter?.addEventListener(
    "change",
    () => {

      renderJobs(
        serviceFilter.value
      );

    }
  );


  /* =========================
     Profile Menu
     ========================= */

  if (
    profileButton &&
    professionalMenu
  ) {

    profileButton.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        professionalMenu.classList.toggle(
          "hidden"
        );

        const menuIsOpen =
          !professionalMenu.classList.contains(
            "hidden"
          );

        profileButton.setAttribute(
          "aria-expanded",
          String(menuIsOpen)
        );

      }
    );


    document.addEventListener(
      "click",
      (event) => {

        if (
          !professionalMenu.contains(
            event.target
          ) &&
          !profileButton.contains(
            event.target
          )
        ) {

          professionalMenu.classList.add(
            "hidden"
          );

          profileButton.setAttribute(
            "aria-expanded",
            "false"
          );

        }

      }
    );

  }


  /* =========================
     Mobile Navigation
     ========================= */

  if (
    mobileMenuButton &&
    mobileNav
  ) {

    mobileMenuButton.addEventListener(
      "click",
      () => {

        mobileNav.classList.toggle(
          "open"
        );

        const navOpen =
          mobileNav.classList.contains(
            "open"
          );

        mobileMenuButton.setAttribute(
          "aria-expanded",
          String(navOpen)
        );

      }
    );

  }


  /* =========================
     Notifications
     ========================= */

  function addNotification(message) {

    if (!notificationsList) {
      return;
    }

    const notification =
      document.createElement(
        "article"
      );

    notification.className =
      "notification-item unread";

    notification.innerHTML = `
      <span class="notification-icon">
        💼
      </span>

      <div>

        <p>
          ${escapeHTML(message)}
        </p>

        <span>
          Just now
        </span>

      </div>

      <span class="unread-dot"></span>
    `;

    notificationsList.prepend(
      notification
    );

    updateNotificationCount();

  }


  function updateNotificationCount() {

    if (!notificationCount) {
      return;
    }

    const unread =
      document.querySelectorAll(
        ".notification-item.unread"
      ).length;

    notificationCount.textContent =
      String(unread);

  }


  if (
    notificationButton &&
    notificationsSection
  ) {

    notificationButton.addEventListener(
      "click",
      () => {

        notificationsSection
          .scrollIntoView({
            behavior:
              "smooth",

            block:
              "center"
          });

      }
    );

  }


  markAllReadButton?.addEventListener(
    "click",
    () => {

      document
        .querySelectorAll(
          ".notification-item.unread"
        )
        .forEach(
          (notification) => {

            notification.classList.remove(
              "unread"
            );

            notification
              .querySelector(
                ".unread-dot"
              )
              ?.remove();

          }
        );

      updateNotificationCount();

    }
  );


  /* =========================
     Quick Actions
     ========================= */

  messagesButton?.addEventListener(
    "click",
    () => {

      localStorage.setItem(
        "korvoMessagingRole",
        "professional"
      );

      window.location.href =
        "messages.html";

    }
  );


  availabilityButton?.addEventListener(
    "click",
    () => {

      openInfoModal({
        eyebrow:
          "AVAILABILITY",

        title:
          "Availability Settings",

        message:
          "Soon you will be able to control when customers can request or book your services.",

        details: [
          {
            label:
              "Weekly Schedule",

            value:
              "Coming soon"
          },

          {
            label:
              "Unavailable Dates",

            value:
              "Coming soon"
          },

          {
            label:
              "Booking Preferences",

            value:
              "Coming soon"
          }
        ]
      });

    }
  );


  servicesButton?.addEventListener(
    "click",
    () => {

      openInfoModal({
        eyebrow:
          "SERVICES",

        title:
          "Manage Services",

        message:
          "Soon you will be able to choose the services you offer and control what kinds of jobs appear in your dashboard.",

        details: [
          {
            label:
              "Service Categories",

            value:
              "Coming soon"
          },

          {
            label:
              "Job Matching",

            value:
              "Based on your services"
          },

          {
            label:
              "Service Area",

            value:
              "Coming soon"
          }
        ]
      });

    }
  );


  accountSettingsButton?.addEventListener(
    "click",
    () => {

      openInfoModal({
        eyebrow:
          "ACCOUNT SETTINGS",

        title:
          "Account Settings",

        message:
          "Soon you will be able to manage your Korvo account, security, and professional preferences here.",

        details: [
          {
            label:
              "Login & Security",

            value:
              "Coming soon"
          },

          {
            label:
              "Notifications",

            value:
              "Coming soon"
          },

          {
            label:
              "Language",

            value:
              "English / Español"
          },

          {
            label:
              "Account Type",

            value:
              "Professional"
          }
        ]
      });

    }
  );


  logoutButton?.addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Log out of your Korvo professional account?"
        );

      if (confirmed) {
        window.location.href =
          "index.html";
      }

    }
  );


  /* =========================
     Initialize Dashboard
     ========================= */

  renderJobs();

  renderSubmittedQuotes();

  updateDashboardCounters();

  updateNotificationCount();

});