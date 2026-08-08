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


  /* =========================
     Current Year
     ========================= */

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }


  /* =========================
     Sample Jobs

     These are temporary until
     Korvo has a real backend.
     ========================= */

  const sampleJobs = [
    {
      id: "job-001",

      title:
        "Motorized Shade Installation",

      category:
        "window treatments",

      location:
        "Buckhead, Atlanta",

      budget:
        "$450 - $650",

      date:
        "August 10",

      description:
        "Customer needs six motorized roller shades installed and programmed.",

      customer:
        "Sarah M."
    },

    {
      id: "job-002",

      title:
        "Interior Painting",

      category:
        "painting",

      location:
        "Brookhaven, GA",

      budget:
        "$900 - $1,300",

      date:
        "August 14",

      description:
        "Paint living room, hallway, and two bedrooms in a residential home.",

      customer:
        "Michael R."
    },

    {
      id: "job-003",

      title:
        "Move Apartment Furniture",

      category:
        "moving",

      location:
        "Midtown Atlanta",

      budget:
        "$300 - $450",

      date:
        "August 12",

      description:
        "Help move furniture from a one-bedroom apartment into a nearby apartment.",

      customer:
        "Jessica L."
    },

    {
      id: "job-004",

      title:
        "Deep Home Cleaning",

      category:
        "cleaning",

      location:
        "Sandy Springs, GA",

      budget:
        "$250 - $400",

      date:
        "August 11",

      description:
        "Deep cleaning needed for a four-bedroom home before guests arrive.",

      customer:
        "Amanda P."
    },

    {
      id: "job-005",

      title:
        "Landscape Cleanup",

      category:
        "landscaping",

      location:
        "Dunwoody, GA",

      budget:
        "$275 - $500",

      date:
        "August 16",

      description:
        "Trim shrubs, remove leaves, clean flower beds, and haul away debris.",

      customer:
        "Daniel K."
    }
  ];


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
        return savedJobs;
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
    localStorage.setItem(
      "korvoProfessionalQuotes",
      JSON.stringify(quotes)
    );
  }


  let customerJobs =
    getCustomerJobs();

  let submittedQuotes =
    getSubmittedQuotes();


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

          <h3>
            No jobs found
          </h3>

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

      jobCard.className =
        "job-card";


      const title =
        job.title ||
        job.jobTitle ||
        "Customer Project";

      const location =
        job.location ||
        "Atlanta, GA";

      const budget =
        job.budget ||
        job.budgetRange ||
        "Budget not listed";

      const date =
        job.date ||
        job.preferredDate ||
        "Flexible";

      const description =
        job.description ||
        "Customer has not added a description.";

      const customer =
        job.customer ||
        job.customerName ||
        "Korvo Customer";

      const id =
        job.id ||
        `job-${Date.now()}-${Math.random()}`;


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
        filteredJobs.length;
    }


    addJobButtonListeners();
  }


  /* =========================
     Job Button Events
     ========================= */

  function addJobButtonListeners() {
    const quoteButtons =
      document.querySelectorAll(
        ".submit-quote-button"
      );

    const detailsButtons =
      document.querySelectorAll(
        ".view-job-button"
      );


    quoteButtons.forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const jobId =
            button.dataset.jobId;

          openQuoteModal(jobId);
        }
      );
    });


    detailsButtons.forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const job =
            customerJobs.find(
              (item) =>
                String(item.id) ===
                String(
                  button.dataset.jobId
                )
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
            "No description provided.";

          const location =
            job.location ||
            "Atlanta, GA";

          const budget =
            job.budget ||
            job.budgetRange ||
            "Not listed";


          alert(
            `${title}\n\n` +
            `${description}\n\n` +
            `Location: ${location}\n` +
            `Budget: ${budget}`
          );
        }
      );
    });
  }


  /* =========================
     Quote Modal
     ========================= */

  function openQuoteModal(jobId) {
    const job =
      customerJobs.find(
        (item) =>
          String(item.id) ===
          String(jobId)
      );


    if (!job || !quoteModal) {
      return;
    }


    selectedJobReference.value =
      jobId;


    selectedJobTitle.textContent =
      job.title ||
      job.jobTitle ||
      "this customer project";


    quoteModal.classList.remove(
      "hidden"
    );


    document.body.style.overflow =
      "hidden";


    setTimeout(() => {
      quoteAmount.focus();
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


    if (quoteForm) {
      quoteForm.reset();
    }


    if (quoteMessageCount) {
      quoteMessageCount.textContent =
        "0";
    }
  }


  if (closeQuoteModalButton) {
    closeQuoteModalButton.addEventListener(
      "click",
      closeQuoteModal
    );
  }


  if (cancelQuoteButton) {
    cancelQuoteButton.addEventListener(
      "click",
      closeQuoteModal
    );
  }


  if (quoteModal) {
    quoteModal.addEventListener(
      "click",
      (event) => {
        if (
          event.target === quoteModal
        ) {
          closeQuoteModal();
        }
      }
    );
  }


  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        quoteModal &&
        !quoteModal.classList.contains(
          "hidden"
        )
      ) {
        closeQuoteModal();
      }
    }
  );


  /* =========================
     Character Counter
     ========================= */

  if (quoteMessage) {
    quoteMessage.addEventListener(
      "input",
      () => {
        quoteMessageCount.textContent =
          quoteMessage.value.length;
      }
    );
  }


  /* =========================
     Submit Quote
     ========================= */

  if (quoteForm) {
    quoteForm.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();


        const jobId =
          selectedJobReference.value;


        const job =
          customerJobs.find(
            (item) =>
              String(item.id) ===
              String(jobId)
          );


        if (!job) {
          alert(
            "Korvo could not find this job."
          );

          return;
        }


        const amount =
          Number(quoteAmount.value);


        if (
          !amount ||
          amount <= 0
        ) {
          alert(
            "Please enter a valid quote amount."
          );

          return;
        }


        const existingQuote =
          submittedQuotes.find(
            (quote) =>
              String(quote.jobId) ===
              String(jobId)
          );


        if (existingQuote) {
          alert(
            "You already submitted a quote for this job."
          );

          return;
        }


        const quote = {
          id:
            `quote-${Date.now()}`,

          jobId,

          jobTitle:
            job.title ||
            job.jobTitle ||
            "Customer Project",

          customer:
            job.customer ||
            job.customerName ||
            "Korvo Customer",

          location:
            job.location ||
            "Atlanta, GA",

          amount,

          timeframe:
            quoteTimeframe.value,

          message:
            quoteMessage.value.trim(),

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


        alert(
          `Quote submitted successfully!\n\n$${amount.toLocaleString()} for ${quote.jobTitle}`
        );
      }
    );
  }


  /* =========================
     Render Quotes
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


        const formattedDate =
          new Date(
            quote.createdAt
          ).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              year: "numeric"
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
                  quote.jobTitle
                )}
              </h3>

              <p>
                ${escapeHTML(
                  quote.customer
                )}
                ·
                ${escapeHTML(
                  quote.location
                )}
              </p>

            </div>

            <strong>
              $${Number(
                quote.amount
              ).toLocaleString()}
            </strong>

          </div>


          <div class="job-meta">

            <span>
              ⏱
              ${escapeHTML(
                quote.timeframe
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
                quote.status
              )}
            </span>

          </div>


          <p style="margin-top: 14px;">
            ${escapeHTML(
              quote.message
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
        customerJobs.length;
    }


    if (submittedQuotesCount) {
      submittedQuotesCount.textContent =
        submittedQuotes.length;
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
        wonQuotes.length;
    }
  }


  /* =========================
     Service Filter
     ========================= */

  if (serviceFilter) {
    serviceFilter.addEventListener(
      "change",
      () => {
        renderJobs(
          serviceFilter.value
        );
      }
    );
  }


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
          menuIsOpen
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
          navOpen
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
      unread;
  }


  if (
    notificationButton &&
    notificationsSection
  ) {
    notificationButton.addEventListener(
      "click",
      () => {
        notificationsSection.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    );
  }


  if (markAllReadButton) {
    markAllReadButton.addEventListener(
      "click",
      () => {
        const unreadNotifications =
          document.querySelectorAll(
            ".notification-item.unread"
          );


        unreadNotifications.forEach(
          (notification) => {
            notification.classList.remove(
              "unread"
            );


            const dot =
              notification.querySelector(
                ".unread-dot"
              );


            if (dot) {
              dot.remove();
            }
          }
        );


        updateNotificationCount();
      }
    );
  }


  /* =========================
     Quick Actions
     ========================= */

  if (messagesButton) {
    messagesButton.addEventListener(
      "click",
      () => {
        alert(
          "Korvo Messages will be built in an upcoming step."
        );
      }
    );
  }


  if (availabilityButton) {
    availabilityButton.addEventListener(
      "click",
      () => {
        alert(
          "Professional availability settings are coming next."
        );
      }
    );
  }


  if (servicesButton) {
    servicesButton.addEventListener(
      "click",
      () => {
        alert(
          "Service management will be added to the professional profile system."
        );
      }
    );
  }


  if (accountSettingsButton) {
    accountSettingsButton.addEventListener(
      "click",
      () => {
        alert(
          "Account Settings will be added after the dashboard system is complete."
        );
      }
    );
  }


  if (logoutButton) {
    logoutButton.addEventListener(
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
  }


  /* =========================
     HTML Safety
     ========================= */

  function escapeHTML(value) {
    return String(value)
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }


  /* =========================
     Initialize Dashboard
     ========================= */

  renderJobs();

  renderSubmittedQuotes();

  updateDashboardCounters();

  updateNotificationCount();
});