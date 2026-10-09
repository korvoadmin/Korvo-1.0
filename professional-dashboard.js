"use strict";

document.addEventListener("DOMContentLoaded", async () => {

  /* =========================
     Elements
     ========================= */

  const currentYear =
    document.getElementById("currentYear");

  const profileButton =
    document.getElementById(
      "professionalProfileButton"
    );

  const professionalMenu =
    document.getElementById(
      "professionalMenu"
    );

  const mobileMenuButton =
    document.getElementById(
      "mobileMenuButton"
    );

  const mobileNav =
    document.getElementById(
      "mobileNav"
    );

  const notificationButton =
    document.getElementById(
      "notificationButton"
    );

  const notificationCount =
    document.getElementById(
      "notificationCount"
    );

  const notificationsSection =
    document.getElementById(
      "notificationsSection"
    );

  const notificationsList =
    document.getElementById(
      "notificationsList"
    );

  const markAllReadButton =
    document.getElementById(
      "markAllReadButton"
    );

  const availableJobsList =
    document.getElementById(
      "availableJobsList"
    );

  const submittedQuotesList =
    document.getElementById(
      "submittedQuotesList"
    );

  const activeWorkList =
    document.getElementById(
      "activeWorkList"
    );

  const availableJobsCount =
    document.getElementById(
      "availableJobsCount"
    );

  const submittedQuotesCount =
    document.getElementById(
      "submittedQuotesCount"
    );

  const jobsWonCount =
    document.getElementById(
      "jobsWonCount"
    );

  const serviceFilter =
    document.getElementById(
      "serviceFilter"
    );

  const quoteModal =
    document.getElementById(
      "quoteModal"
    );

  const closeQuoteModalButton =
    document.getElementById(
      "closeQuoteModalButton"
    );

  const cancelQuoteButton =
    document.getElementById(
      "cancelQuoteButton"
    );

  const quoteForm =
    document.getElementById(
      "quoteForm"
    );

  const selectedJobTitle =
    document.getElementById(
      "selectedJobTitle"
    );

  const selectedJobReference =
    document.getElementById(
      "selectedJobReference"
    );

  const quoteAmount =
    document.getElementById(
      "quoteAmount"
    );

  const quoteTimeframe =
    document.getElementById(
      "quoteTimeframe"
    );

  const quoteMessage =
    document.getElementById(
      "quoteMessage"
    );

  const quoteMessageCount =
    document.getElementById(
      "quoteMessageCount"
    );

  const messagesButton =
    document.getElementById(
      "messagesButton"
    );

  const availabilityButton =
    document.getElementById(
      "availabilityButton"
    );

  const servicesButton =
    document.getElementById(
      "servicesButton"
    );

  const accountSettingsButton =
    document.getElementById(
      "accountSettingsButton"
    );

  const logoutButton =
    document.getElementById(
      "logoutButton"
    );

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


  /* =========================
   Current Professional
   ========================= */

let professionalProfile = {
  name: "Korvo Professional",
  type: "Professional",
  profile: "profile.html",
  initials: "KP",
  rating: "New"
};

let currentProfessionalId = "";


function createInitials(
  firstName = "",
  lastName = "",
  businessName = ""
) {
  if (firstName || lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`
      .toUpperCase();
  }

  const businessWords =
    businessName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (businessWords.length >= 2) {
    return (
      businessWords[0].charAt(0) +
      businessWords[1].charAt(0)
    ).toUpperCase();
  }

  if (businessWords.length === 1) {
    return businessWords[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return "KP";
}


async function loadProfessionalProfile() {
  try {

    if (
      typeof korvoSupabase === "undefined"
    ) {
      console.error(
        "Supabase client is not available."
      );

      window.location.href =
        "login.html";

      return false;
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
      console.error(
        "Professional authentication failed:",
        authError
      );

      window.location.href =
        "login.html";

      return false;
    }


    const user =
      authData.user;

    currentProfessionalId =
      user.id;


    const {
      data: accountProfile,
      error: accountError
    } =
      await korvoSupabase
        .from("profiles")
        .select(
          "first_name, last_name, account_type, onboarding_complete"
        )
        .eq(
          "id",
          user.id
        )
        .single();


    if (accountError) {
      throw accountError;
    }


    if (
      accountProfile.account_type !==
      "professional"
    ) {
      window.location.href =
        "customer-dashboard.html";

      return false;
    }


    if (
      !accountProfile.onboarding_complete
    ) {
      window.location.href =
        "professional-onboarding.html";

      return false;
    }


    const {
      data: savedProfessionalProfile,
      error: professionalError
    } =
      await korvoSupabase
        .from("professional_profiles")
        .select(
          "business_name, services, profile_photo_url, verification_status"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();


    if (professionalError) {
      throw professionalError;
    }


    if (!savedProfessionalProfile) {
      window.location.href =
        "professional-onboarding.html";

      return false;
    }


    const firstName =
      accountProfile.first_name ||
      "";

    const lastName =
      accountProfile.last_name ||
      "";

    const fullName =
      `${firstName} ${lastName}`
        .trim();

    const businessName =
      savedProfessionalProfile
        .business_name
        ?.trim() ||
      "";

    const services =
      Array.isArray(
        savedProfessionalProfile.services
      )
        ? savedProfessionalProfile.services
        : [];


    professionalProfile = {
      name:
        businessName ||
        fullName ||
        "Korvo Professional",

      type:
        services[0] ||
        "Professional",

      profile:
        "profile.html",

      initials:
        createInitials(
          firstName,
          lastName,
          businessName
        ),

      rating:
        "New"
    };


    const profileAvatar =
      document.querySelector(
        ".profile-avatar"
      );

    const profileName =
      document.querySelector(
        ".profile-name"
      );

    const welcomeHeading =
      document.querySelector(
        ".welcome-section h1"
      );


    if (profileAvatar) {
      profileAvatar.textContent =
        professionalProfile.initials;
    }


    if (profileName) {
      profileName.textContent =
        businessName ||
        firstName ||
        professionalProfile.name;
    }


    if (welcomeHeading) {
      welcomeHeading.textContent =
        `Welcome back, ${
          firstName ||
          professionalProfile.name
        }`;
    }


    return true;

  } catch (error) {

    console.error(
      "Could not load professional profile:",
      error
    );

    return false;
  }
}


  /* =========================
     Current Year
     ========================= */

  if (currentYear) {
    currentYear.textContent =
      String(
        new Date().getFullYear()
      );
  }


  /* =========================
     Sample Jobs
     ========================= */

  const sampleJobs = [
    {
      id:
        "job-001",

      reference:
        "KRV-1001",

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
      id:
        "job-002",

      reference:
        "KRV-1003",

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
      id:
        "job-003",

      reference:
        "KRV-1004",

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
      id:
        "job-004",

      reference:
        "KRV-1002",

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
      id:
        "job-005",

      reference:
        "KRV-1005",

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
     Information Modal
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

    if (
      success &&
      infoModalDetails
    ) {
      const successIcon =
        document.createElement(
          "div"
        );

      successIcon.className =
        "info-success-icon";

      successIcon.textContent =
        "✓";

      infoModalDetails.appendChild(
        successIcon
      );
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

    document.body.style.overflow =
      "hidden";
  }


  function closeInfoModal() {
    if (!infoModal) {
      return;
    }

    infoModal.classList.add(
      "hidden"
    );

    document.body.style.overflow =
      "";
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
        event.target ===
        infoModal
      ) {
        closeInfoModal();
      }
    }
  );


  /* =========================
     Local Storage
     ========================= */

  function getCustomerJobs() {
  return customerJobs;
}

async function fetchCustomerJobs() {

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
    await korvoSupabase
      .from("jobs")
      .select(`
        id,
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
        "status",
        "open"
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


  customerJobs =
    Array.isArray(data)
      ? data
      : [];


  return customerJobs;
}
  function getSubmittedQuotes() {
    return submittedQuotes;
  }


  async function fetchSubmittedQuotes() {

    if (!currentProfessionalId) {
      throw new Error(
        "Professional account is not available."
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
          "professional_id",
          currentProfessionalId
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


    submittedQuotes =
      Array.isArray(data)
        ? data
        : [];


    return submittedQuotes;
  }


  function getActiveJobs() {
    return activeJobsCache;
  }


  async function fetchProfessionalActiveJobs() {

    if (!currentProfessionalId) {
      throw new Error(
        "Professional account is not available."
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
          "professional_id",
          currentProfessionalId
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


  async function requestJobCompletion(
    activeJobId
  ) {

    const {
      data,
      error
    } =
      await korvoSupabase.rpc(
        "professional_request_job_completion",
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


  let customerJobs = [];

  let submittedQuotes = [];

  let activeJobsCache = [];


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
      job.city ||
      "Atlanta";

    const state =
      job.state ||
      "GA";

    return `${city}, ${state}`;
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


  return "Budget not listed";
}


function getJobSchedule(
  job
) {

  if (
    job.preferred_date
  ) {

    const parts =
      String(
        job.preferred_date
      ).split("-");


    if (
      parts.length === 3
    ) {

      const date =
        new Date(
          Number(parts[0]),
          Number(parts[1]) - 1,
          Number(parts[2])
        );


      return date.toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric"
        }
      );
    }
  }


  return (
    job.timeframe ||
    "Flexible"
  );
}

  function findJobById(jobId) {
    return customerJobs.find(
      (job) =>
        getJobId(job) ===
        String(jobId)
    );
  }


  /* =========================
     Available Jobs
     ========================= */

  function renderJobs(
  selectedCategory = "all"
) {
  if (!availableJobsList) {
    return;
  }

  availableJobsList.innerHTML =
    "";

  const activeJobs =
    getActiveJobs();

  const availableCustomerJobs =
    customerJobs.filter(
      (job) => {

        const jobId =
          getJobId(job);

        const jobReference =
          getJobReference(job);

        const isAlreadyActive =
          activeJobs.some(
            (activeJob) => {

              const activeJobId =
                String(
                  activeJob.jobId ||
                  activeJob.id ||
                  ""
                );

              const activeJobReference =
                String(
                  activeJob.jobReference ||
                  activeJob.reference ||
                  ""
                );

              return (
                activeJobId ===
                  String(jobId) ||
                activeJobReference ===
                  String(jobReference)
              );
            }
          );

        return !isAlreadyActive;
      }
    );


  const filteredJobs =
    selectedCategory === "all"
      ? availableCustomerJobs
      : availableCustomerJobs.filter(
          (job) =>
            String(
              job.category ||
              job.service ||
              ""
            ).toLowerCase() ===
            selectedCategory
              .toLowerCase()
        );


  if (
    filteredJobs.length === 0
  ) {
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


  filteredJobs.forEach(
    (job) => {

      const jobCard =
        document.createElement(
          "article"
        );

      jobCard.className =
        "job-card";

      const title =
        job.title ||
        job.jobTitle ||
        "Customer Project";

      const location =
        getJobLocation(job);

      const budget =
        formatJobBudget(
      job
      );

      const date =
  getJobSchedule(
    job
  );

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

          <strong>
            ${escapeHTML(
              budget
            )}
          </strong>

        </div>


        <p style="margin-top: 14px;">
          ${escapeHTML(
            description
          )}
        </p>


        <div class="job-meta">

          <span>
            👤
            ${escapeHTML(
              customer
            )}
          </span>

          <span>
            📍
            ${escapeHTML(
              location
            )}
          </span>

          <span>
            📅
            ${escapeHTML(
              date
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

          <button
            type="button"
            class="primary-button submit-quote-button"
            data-job-id="${escapeHTML(
              id
            )}"
          >
            Submit Quote
          </button>

          <button
            type="button"
            class="secondary-button view-job-button"
            data-job-id="${escapeHTML(
              id
            )}"
          >
            View Details
          </button>

        </div>
      `;

      availableJobsList.appendChild(
        jobCard
      );

    }
  );


  if (availableJobsCount) {
    availableJobsCount.textContent =
      String(
        filteredJobs.length
      );
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
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              openQuoteModal(
                button.dataset.jobId
              );

            }
          );

        }
      );


    document
      .querySelectorAll(
        ".view-job-button"
      )
      .forEach(
        (button) => {

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
  formatJobBudget(
    job
  );


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
                      getJobReference(
                        job
                      )
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
    "Schedule",

  value:
    getJobSchedule(
      job
    )
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

        }
      );
  }


  /* =========================
     Quote Modal
     ========================= */

  function openQuoteModal(jobId) {

    const job =
      findJobById(
        jobId
      );

    if (
      !job ||
      !quoteModal
    ) {
      return;
    }


    if (
      selectedJobReference
    ) {
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


    setTimeout(
      () => {
        quoteAmount?.focus();
      },
      100
    );
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


  closeQuoteModalButton
    ?.addEventListener(
      "click",
      closeQuoteModal
    );

  cancelQuoteButton
    ?.addEventListener(
      "click",
      closeQuoteModal
    );

  quoteModal?.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        quoteModal
      ) {
        closeQuoteModal();
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
        event.key !==
        "Escape"
      ) {
        return;
      }


      if (
        quoteModal &&
        !quoteModal
          .classList.contains(
            "hidden"
          )
      ) {
        closeQuoteModal();
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
    async (event) => {

      event.preventDefault();


      const jobId =
        selectedJobReference?.value ||
        "";


      const job =
        findJobById(
          jobId
        );


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


      if (!currentProfessionalId) {

        openInfoModal({
          eyebrow:
            "QUOTE ERROR",

          title:
            "Professional Account Required",

          message:
            "Korvo could not verify your professional account. Sign in again and try again."
        });

        return;
      }


      const amount =
        Number(
          quoteAmount?.value
        );


      if (
        !amount ||
        amount <= 0
      ) {

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


      const timeframe =
        quoteTimeframe?.value ||
        "";


      if (!timeframe) {

        openInfoModal({
          eyebrow:
            "QUOTE ERROR",

          title:
            "Choose a Timeframe",

          message:
            "Select an estimated completion time before submitting your quote."
        });

        return;
      }


      const message =
        quoteMessage?.value
          .trim() ||
        "";


      if (!message) {

        openInfoModal({
          eyebrow:
            "QUOTE ERROR",

          title:
            "Add a Message",

          message:
            "Tell the customer what is included in your quote."
        });

        quoteMessage?.focus();

        return;
      }


      const existingQuote =
        submittedQuotes.find(
          (quote) =>
            String(
              quote.job_id ||
              quote.jobId ||
              ""
            ) ===
            String(
              jobId
            )
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
                existingQuote.job_title ||
                existingQuote.jobTitle ||
                "Customer Project"
            },

            {
              label:
                "Status",

              value:
                existingQuote.status ||
                "pending"
            }
          ]
        });

        return;
      }


      const submitButton =
        quoteForm.querySelector(
          'button[type="submit"]'
        );


      if (submitButton) {
        submitButton.disabled =
          true;

        submitButton.textContent =
          "Submitting...";
      }


      try {

        const {
          data: savedQuote,
          error
        } =
          await korvoSupabase
            .from("quotes")
            .insert({
              job_id:
                jobId,

              professional_id:
                currentProfessionalId,

              amount,

              timeframe,

              message
            })
            .select(`
              id,
              job_id,
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
            .single();


        if (error) {
          throw error;
        }


        submittedQuotes.unshift(
          savedQuote
        );


        renderSubmittedQuotes();

        renderActiveWork();

        updateDashboardCounters();


        addNotification(
          `Quote submitted for ${savedQuote.job_title}.`
        );


        closeQuoteModal();


        openInfoModal({
          eyebrow:
            "QUOTE SENT",

          title:
            "Quote Submitted!",

          message:
            "Your quote has been securely saved to Korvo and sent to the customer.",

          success:
            true,

          details: [
            {
              label:
                "Job",

              value:
                savedQuote.job_title
            },

            {
              label:
                "Reference",

              value:
                savedQuote.job_reference ||
                "Not assigned"
            },

            {
              label:
                "Your Quote",

              value:
                `$${Number(
                  savedQuote.amount
                ).toLocaleString()}`
            },

            {
              label:
                "Timeframe",

              value:
                savedQuote.timeframe
            },

            {
              label:
                "Status",

              value:
                "Pending"
            }
          ]
        });


      } catch (error) {

        console.error(
          "Quote submission failed:",
          error
        );


        const duplicateQuote =
          error?.code ===
          "23505";


        openInfoModal({
          eyebrow:
            "QUOTE ERROR",

          title:
            duplicateQuote
              ? "Quote Already Submitted"
              : "Could Not Submit Quote",

          message:
            duplicateQuote
              ? "You already submitted a quote for this job."
              : "Korvo could not save your quote. Please try again."
        });


      } finally {

        if (submitButton) {
          submitButton.disabled =
            false;

          submitButton.textContent =
            "Submit Quote";
        }

      }

    }
  );


  /* =========================
     Submitted Quotes
     ========================= */

  function renderSubmittedQuotes() {

    if (!submittedQuotesList) {
      return;
    }


    submittedQuotesList.innerHTML =
      "";


    if (
      submittedQuotes.length ===
      0
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
            quote.created_at ||
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


        const status =
          String(
            quote.status ||
            "pending"
          );


        const quoteStatus =
          status.charAt(0)
            .toUpperCase() +
          status.slice(1);


        const location =
          quote.location ||
          [
            quote.job_city,
            quote.job_state
          ]
            .filter(Boolean)
            .join(", ") ||
          "Atlanta, GA";


        quoteCard.innerHTML = `
          <div class="quote-card-header">

            <div>

              <p class="eyebrow">
                ${escapeHTML(
                  quoteStatus
                )}
              </p>

              <h3>
                ${escapeHTML(
                  quote.job_title ||
                  quote.jobTitle ||
                  "Customer Project"
                )}
              </h3>

              <p>
                Korvo Customer
                ·
                ${escapeHTML(
                  location
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
                quote.job_reference ||
                quote.jobReference ||
                quote.job_id ||
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
                quoteStatus
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


        submittedQuotesList
          .appendChild(
            quoteCard
          );

      }
    );

  }


  /* =========================
     Active Work
     ========================= */

  function getProfessionalJobsWon() {
    return getActiveJobs();
  }


  function getProfessionalActiveJobs() {

    /*
      The Jobs Won section should keep
      showing accepted jobs even after
      they are completed so pros can
      reopen the job and its messages.
    */

    return getProfessionalJobsWon()
      .filter(
        (job) =>
          String(
            job.status ||
            "active"
          ).toLowerCase() !==
          "cancelled"
      );

  }


  function openCustomerConversation(
    activeJobId = ""
  ) {

    localStorage.setItem(
      "korvoMessagingRole",
      "professional"
    );


    localStorage.removeItem(
      "korvoOpenConversation"
    );

    localStorage.removeItem(
      "korvoOpenQuoteId"
    );

    localStorage.removeItem(
      "korvoOpenActiveJobId"
    );


    if (activeJobId) {
      localStorage.setItem(
        "korvoOpenActiveJobId",
        activeJobId
      );
    }


    window.location.href =
      "messages.html";
  }


  function createActiveWorkCard(
    job
  ) {

    const article =
      document.createElement(
        "article"
      );


    article.className =
      "job-card active-work-card";


    const title =
      job.job_title ||
      job.jobTitle ||
      "Active Korvo Job";


    const customer =
      "Korvo Customer";


    const location =
      [
        job.job_city,
        job.job_state
      ]
        .filter(Boolean)
        .join(", ") ||
      job.location ||
      "Atlanta, GA";


    const amount =
      Number(
        job.amount ||
        0
      );


    const timeframe =
      job.timeframe ||
      "Flexible";


    const reference =
      job.job_reference ||
      job.jobReference ||
      job.job_id ||
      job.jobId ||
      "KRV-UNASSIGNED";


    const rawStatus =
      String(
        job.status ||
        "active"
      ).toLowerCase();


    const statusLabel =
      rawStatus ===
      "pending_confirmation"
        ? "Pending Customer Confirmation"
        : rawStatus ===
          "completed"
          ? "Completed"
          : rawStatus ===
            "cancelled"
            ? "Cancelled"
            : "Active";


    const isPendingCustomerConfirmation =
      rawStatus ===
      "pending_confirmation";


    const isCompleted =
      rawStatus ===
      "completed";


    const isActive =
      rawStatus ===
      "active";


    article.innerHTML = `
      <div class="job-card-header">

        <div>

          <p class="eyebrow">
            ${escapeHTML(
              statusLabel
            )}
          </p>

          <h3>
            ${escapeHTML(
              title
            )}
          </h3>

          <p>
            ${escapeHTML(
              customer
            )}
            ·
            ${escapeHTML(
              location
            )}
          </p>

        </div>

        <strong>
          $${amount.toLocaleString()}
        </strong>

      </div>


      <div class="job-meta">

        <span>
          👤
          ${escapeHTML(
            customer
          )}
        </span>

        <span>
          📍
          ${escapeHTML(
            location
          )}
        </span>

        <span>
          ⏱
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

        <button
          type="button"
          class="primary-button active-work-message-button"
        >
          Message Customer
        </button>

        <button
          type="button"
          class="secondary-button active-work-view-button"
        >
          View Job
        </button>

        ${
          isPendingCustomerConfirmation
            ? `
              <button
                type="button"
                class="secondary-button"
                disabled
              >
                ⏳ Waiting for Customer Confirmation
              </button>
            `
            : isCompleted
              ? `
                <button
                  type="button"
                  class="secondary-button"
                  disabled
                >
                  ✓ Job Completed
                </button>
              `
              : isActive
                ? `
                  <button
                    type="button"
                    class="primary-button mark-work-complete-button"
                  >
                    ✓ Mark Work Complete
                  </button>
                `
                : ""
        }

      </div>
    `;


    article
      .querySelector(
        ".active-work-message-button"
      )
      ?.addEventListener(
        "click",
        () => {

          openCustomerConversation(
            job.id || ""
          );

        }
      );


    article
      .querySelector(
        ".active-work-view-button"
      )
      ?.addEventListener(
        "click",
        () => {

          openInfoModal({
            eyebrow:
              "ACTIVE WORK",

            title,

            message:
              isCompleted
                ? "This Korvo job has been completed. You can still open the customer conversation from this job."
                : isPendingCustomerConfirmation
                  ? "You marked this job complete and it is waiting for customer confirmation."
                  : "This customer accepted your Korvo quote and the job is active.",

            details: [
              {
                label:
                  "Customer",

                value:
                  customer
              },

              {
                label:
                  "Reference",

                value:
                  reference
              },

              {
                label:
                  "Location",

                value:
                  location
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


    article
      .querySelector(
        ".mark-work-complete-button"
      )
      ?.addEventListener(
        "click",
        async (event) => {

          const confirmed =
            confirm(
              `Mark "${title}" as complete and send it to the customer for confirmation?`
            );


          if (!confirmed) {
            return;
          }


          const button =
            event.currentTarget;


          button.disabled =
            true;

          button.textContent =
            "Submitting...";


          try {

            await requestJobCompletion(
              job.id
            );


            await fetchProfessionalActiveJobs();

            renderActiveWork();

            updateDashboardCounters();


            addNotification(
              `${title} was submitted for customer confirmation.`
            );


            openInfoModal({
              eyebrow:
                "WORK SUBMITTED",

              title:
                "Sent to Customer",

              message:
                "The customer can now review and confirm that the work is complete.",

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
                    "Reference",

                  value:
                    reference
                },

                {
                  label:
                    "Status",

                  value:
                    "Pending Customer Confirmation"
                }
              ]
            });

          } catch (error) {

            console.error(
              "Could not submit job completion:",
              error
            );


            button.disabled =
              false;

            button.textContent =
              "✓ Mark Work Complete";


            openInfoModal({
              eyebrow:
                "JOB ERROR",

              title:
                "Could Not Submit Completion",

              message:
                error?.message ||
                "Korvo could not update this active job. Refresh and try again."
            });

          }

        }
      );


    return article;
  }


  function renderActiveWork() {

    if (!activeWorkList) {
      return;
    }


    const activeJobs =
      getProfessionalActiveJobs();


    activeWorkList.innerHTML =
      "";


    if (
      activeJobs.length ===
      0
    ) {

      activeWorkList.innerHTML = `
        <div class="empty-state compact">

          <div class="empty-state-icon">
            ✅
          </div>

          <h3>
            No active jobs yet
          </h3>

          <p>
            When a customer accepts one
            of your quotes, the job will
            appear here.
          </p>

        </div>
      `;


      return;
    }


    activeJobs.forEach(
      (job) => {

        activeWorkList
          .appendChild(
            createActiveWorkCard(
              job
            )
          );

      }
    );

  }


  /* =========================
     Dashboard Counters
     ========================= */

  function updateDashboardCounters() {

    customerJobs =
      getCustomerJobs();


    submittedQuotes =
      getSubmittedQuotes();


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

      jobsWonCount.textContent =
        String(
          getProfessionalJobsWon()
            .length
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

        professionalMenu
          .classList.toggle(
            "hidden"
          );


        const menuIsOpen =
          !professionalMenu
            .classList.contains(
              "hidden"
            );


        profileButton.setAttribute(
          "aria-expanded",
          String(
            menuIsOpen
          )
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
          mobileNav
            .classList.contains(
              "open"
            );


        mobileMenuButton.setAttribute(
          "aria-expanded",
          String(
            navOpen
          )
        );

      }
    );

  }


  /* =========================
     Notifications
     ========================= */

  function addNotification(
    message
  ) {

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
          ${escapeHTML(
            message
          )}
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
      String(
        unread
      );

  }


  if (
    notificationButton &&
    notificationsSection
  ) {

    notificationButton
      .addEventListener(
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

        updateNotificationCount();

      }
    );


  /* =========================
     Quick Actions
     ========================= */

  messagesButton
    ?.addEventListener(
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


  availabilityButton
    ?.addEventListener(
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


  servicesButton
    ?.addEventListener(
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


  accountSettingsButton
    ?.addEventListener(
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


  logoutButton
  ?.addEventListener(
    "click",
    async () => {

      const confirmed =
        confirm(
          "Log out of your Korvo professional account?"
        );

      if (!confirmed) {
        return;
      }

      try {

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
          "Professional sign out failed:",
          error
        );

        alert(
          "Korvo could not sign you out. Please try again."
        );
      }
    }
  );


  /* =========================
     Initialize Dashboard
     ========================= */

     const professionalLoaded =
  await loadProfessionalProfile();


if (!professionalLoaded) {
  return;
}


let customerJobsLoaded =
  true;


try {

  await fetchCustomerJobs();

} catch (error) {

  customerJobsLoaded =
    false;

  console.error(
    "Could not load open Korvo jobs:",
    error
  );

}


try {

  await fetchSubmittedQuotes();

} catch (error) {

  console.error(
    "Could not load submitted quotes:",
    error
  );

  submittedQuotes = [];

}


try {

  await fetchProfessionalActiveJobs();

} catch (error) {

  console.error(
    "Could not load active professional jobs:",
    error
  );

  activeJobsCache = [];

}


if (customerJobsLoaded) {

  renderJobs();

} else if (
  availableJobsList
) {

  availableJobsList.innerHTML = `
    <div class="empty-state">

      <div class="empty-state-icon">
        ⚠️
      </div>

      <h3>
        Jobs could not be loaded
      </h3>

      <p>
        Refresh the page and try again.
      </p>

    </div>
  `;

}


renderSubmittedQuotes();

renderActiveWork();

updateDashboardCounters();

updateNotificationCount();

});
