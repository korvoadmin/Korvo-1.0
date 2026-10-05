document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("jobForm");
  const steps = document.querySelectorAll(".form-step");

  const nextButton = document.getElementById("nextButton");
  const backButton = document.getElementById("backButton");
  const submitButton = document.getElementById("submitButton");

  const progressText = document.getElementById("progressText");
  const progressPercent = document.getElementById("progressPercent");
  const progressFill = document.getElementById("progressFill");

  const indicators =
    document.querySelectorAll(".step-indicator");

  const successModal =
    document.getElementById("successModal");

  const jobReference =
    document.getElementById("jobReference");

  const postAnotherButton =
    document.getElementById("postAnotherButton");

  let currentStep = 1;

  /* ======================================
     SHOW CURRENT STEP
  ====================================== */

  function showStep(stepNumber) {

    steps.forEach(function (step) {
      step.classList.remove("active");

      if (
        Number(step.dataset.step) === stepNumber
      ) {
        step.classList.add("active");
      }
    });

    indicators.forEach(function (indicator) {

      const number =
        Number(indicator.dataset.indicator);

      indicator.classList.remove(
        "active",
        "completed"
      );

      if (number === stepNumber) {
        indicator.classList.add("active");
      }

      if (number < stepNumber) {
        indicator.classList.add("completed");
      }

    });

    const percent =
      stepNumber * 20;

    if (progressText) {
      progressText.textContent =
        `Step ${stepNumber} of 5`;
    }

    if (progressPercent) {
      progressPercent.textContent =
        `${percent}% complete`;
    }

    if (progressFill) {
      progressFill.style.width =
        `${percent}%`;
    }

    if (backButton) {
      backButton.classList.toggle(
        "hidden-button",
        stepNumber === 1
      );
    }

    if (nextButton) {
      nextButton.classList.toggle(
        "hidden-button",
        stepNumber === 5
      );
    }

    if (submitButton) {
      submitButton.classList.toggle(
        "hidden-button",
        stepNumber !== 5
      );
    }
  }


  /* ======================================
     ERRORS
  ====================================== */

  function showError(id) {

    const element =
      document.getElementById(id);

    if (element) {
      element.style.display = "block";
    }
  }


  function hideError(id) {

    const element =
      document.getElementById(id);

    if (element) {
      element.style.display = "none";
    }
  }


  document
    .querySelectorAll(".field-error")
    .forEach(function (error) {
      error.style.display = "none";
    });


  /* ======================================
     VALIDATE STEP
  ====================================== */

  function validateStep(step) {

    if (step === 1) {

      const service =
        document.querySelector(
          'input[name="service"]:checked'
        );

      if (!service) {
        showError("serviceError");
        return false;
      }

      hideError("serviceError");
    }


    if (step === 2) {

      const title =
        document.getElementById("jobTitle");

      const description =
        document.getElementById(
          "jobDescription"
        );

      let valid = true;

      if (
        !title ||
        title.value.trim().length < 3
      ) {
        showError("jobTitleError");
        valid = false;
      } else {
        hideError("jobTitleError");
      }

      if (
        !description ||
        description.value.trim().length < 10
      ) {
        showError("descriptionError");
        valid = false;
      } else {
        hideError("descriptionError");
      }

      return valid;
    }


    if (step === 3) {

      const city =
        document.getElementById("city");

      const zip =
        document.getElementById("zipCode");

      const budget =
        document.getElementById("budget");

      const timeframe =
        document.querySelector(
          'input[name="timeframe"]:checked'
        );

      let valid = true;

      if (!city || !city.value.trim()) {
        showError("cityError");
        valid = false;
      } else {
        hideError("cityError");
      }


      if (
        !zip ||
        !/^\d{5}$/.test(zip.value.trim())
      ) {
        showError("zipError");
        valid = false;
      } else {
        hideError("zipError");
      }


      if (!timeframe) {
        showError("timeframeError");
        valid = false;
      } else {
        hideError("timeframeError");
      }


      if (!budget || !budget.value) {
        showError("budgetError");
        valid = false;
      } else {
        hideError("budgetError");
      }


      const preferredDate =
        document.getElementById(
          "preferredDate"
        );

      if (
        timeframe &&
        timeframe.value === "Specific date" &&
        !preferredDate.value
      ) {

        alert(
          "Please select your preferred date."
        );

        valid = false;
      }

      return valid;
    }


    if (step === 4) {

      const firstName =
        document.getElementById(
          "firstName"
        );

      const lastName =
        document.getElementById(
          "lastName"
        );

      const email =
        document.getElementById("email");

      const phone =
        document.getElementById("phone");

      const terms =
        document.getElementById(
          "termsAgreement"
        );

      let valid = true;


      if (!firstName.value.trim()) {
        showError("firstNameError");
        valid = false;
      } else {
        hideError("firstNameError");
      }


      if (!lastName.value.trim()) {
        showError("lastNameError");
        valid = false;
      } else {
        hideError("lastNameError");
      }


      const emailValid =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email.value.trim()
        );

      if (!emailValid) {
        showError("emailError");
        valid = false;
      } else {
        hideError("emailError");
      }


      const phoneNumbers =
        phone.value.replace(/\D/g, "");

      if (phoneNumbers.length < 10) {
        showError("phoneError");
        valid = false;
      } else {
        hideError("phoneError");
      }


      if (!terms.checked) {
        showError("termsError");
        valid = false;
      } else {
        hideError("termsError");
      }


      return valid;
    }


    return true;
  }


  /* ======================================
     NEXT
  ====================================== */

  nextButton.addEventListener(
    "click",
    function () {

      if (!validateStep(currentStep)) {
        return;
      }

      if (currentStep < 5) {

        currentStep++;

        if (currentStep === 5) {
          updateReview();
        }

        showStep(currentStep);
      }

    }
  );


  /* ======================================
     BACK
  ====================================== */

  backButton.addEventListener(
    "click",
    function () {

      if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
      }

    }
  );


  /* ======================================
     EDIT BUTTONS
  ====================================== */

  document
    .querySelectorAll(".edit-step-button")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        function () {

          currentStep =
            Number(
              button.dataset.editStep
            );

          showStep(currentStep);

        }
      );

    });


  /* ======================================
     SERVICE SEARCH
  ====================================== */

  const serviceSearch =
    document.getElementById(
      "serviceSearch"
    );

  if (serviceSearch) {

    serviceSearch.addEventListener(
      "input",
      function () {

        const search =
          serviceSearch.value
            .toLowerCase()
            .trim();

        document
          .querySelectorAll(".service-card")
          .forEach(function (card) {

            const serviceName =
              (
                card.dataset.serviceName ||
                ""
              ).toLowerCase();

            card.style.display =
              serviceName.includes(search)
                ? ""
                : "none";

          });

      }
    );

  }


  /* ======================================
     SPECIFIC DATE
  ====================================== */

  const timeframeInputs =
    document.querySelectorAll(
      'input[name="timeframe"]'
    );

  const preferredDateGroup =
    document.getElementById(
      "preferredDateGroup"
    );

  timeframeInputs.forEach(
    function (input) {

      input.addEventListener(
        "change",
        function () {

          if (
            input.value === "Specific date" &&
            input.checked
          ) {

            preferredDateGroup.classList.remove(
              "hidden-field"
            );

          } else if (input.checked) {

            preferredDateGroup.classList.add(
              "hidden-field"
            );

          }

        }
      );

    }
  );


  /* ======================================
     COUNTERS
  ====================================== */

  const titleInput =
    document.getElementById("jobTitle");

  const titleCount =
    document.getElementById(
      "jobTitleCount"
    );

  titleInput.addEventListener(
    "input",
    function () {

      titleCount.textContent =
        `${titleInput.value.length} / 80`;

    }
  );


  const descriptionInput =
    document.getElementById(
      "jobDescription"
    );

  const descriptionCount =
    document.getElementById(
      "descriptionCount"
    );

  descriptionInput.addEventListener(
    "input",
    function () {

      descriptionCount.textContent =
        `${descriptionInput.value.length} / 1200`;

    }
  );


  /* ======================================
     REVIEW
  ====================================== */

  function setReview(id, value) {

    const element =
      document.getElementById(id);

    if (element) {
      element.textContent =
        value || "Not provided";
    }
  }


  function updateReview() {

    const service =
      document.querySelector(
        'input[name="service"]:checked'
      )?.value;

    const timeframe =
      document.querySelector(
        'input[name="timeframe"]:checked'
      )?.value;

    const contact =
      document.querySelector(
        'input[name="contactPreference"]:checked'
      )?.value;

    const city =
      document.getElementById("city").value;

    const zip =
      document.getElementById(
        "zipCode"
      ).value;

    const materials =
      document.getElementById(
        "materialsProvided"
      ).checked;


    setReview(
      "reviewService",
      service
    );

    setReview(
      "reviewJobTitle",
      titleInput.value
    );

    setReview(
      "reviewDescription",
      descriptionInput.value
    );

    setReview(
      "reviewProperty",
      document.getElementById(
        "propertyType"
      ).value
    );

    setReview(
      "reviewSize",
      document.getElementById(
        "jobSize"
      ).value
    );

    setReview(
      "reviewLocation",
      `${city}, ${zip}`
    );

    setReview(
      "reviewTimeframe",
      timeframe
    );

    setReview(
      "reviewBudget",
      document.getElementById(
        "budget"
      ).value
    );

    setReview(
      "reviewMaterials",
      materials
        ? "Customer has materials"
        : "Materials may be needed"
    );

    setReview(
      "reviewName",
      `${
        document.getElementById(
          "firstName"
        ).value
      } ${
        document.getElementById(
          "lastName"
        ).value
      }`
    );

    setReview(
      "reviewEmail",
      document.getElementById(
        "email"
      ).value
    );

    setReview(
      "reviewPhone",
      document.getElementById(
        "phone"
      ).value
    );

    setReview(
      "reviewContactPreference",
      contact
    );

  }


    /* ======================================
     REAL SUPABASE JOB POSTING
  ====================================== */

  function normalizeCategory(service) {

    const value =
      String(service || "")
        .toLowerCase();

    if (value.includes("clean"))
      return "cleaning";

    if (value.includes("paint"))
      return "painting";

    if (value.includes("electrical"))
      return "electrical";

    if (
      value.includes("lawn") ||
      value.includes("landscape")
    ) {
      return "landscaping";
    }

    if (value.includes("moving"))
      return "moving";

    if (
      value.includes("drapery") ||
      value.includes("shade") ||
      value.includes("blind") ||
      value.includes("window")
    ) {
      return "window treatments";
    }

    if (value.includes("plumb"))
      return "plumbing";

    if (value.includes("handyman"))
      return "handyman";

    if (
      value.includes("pressure") ||
      value.includes("washing")
    ) {
      return "pressure washing";
    }

    if (
      value.includes("furniture") ||
      value.includes("assembly")
    ) {
      return "furniture assembly";
    }

    if (
      value.includes("detail")
    ) {
      return "mobile detailing";
    }

    return "other";
  }


  function parseBudgetRange(
    budgetValue
  ) {

    switch (budgetValue) {

      case "Under $100":
        return {
          budgetMin: 0,
          budgetMax: 99
        };

      case "$100 – $249":
        return {
          budgetMin: 100,
          budgetMax: 249
        };

      case "$250 – $499":
        return {
          budgetMin: 250,
          budgetMax: 499
        };

      case "$500 – $999":
        return {
          budgetMin: 500,
          budgetMax: 999
        };

      case "$1,000 – $2,499":
        return {
          budgetMin: 1000,
          budgetMax: 2499
        };

      case "$2,500 – $4,999":
        return {
          budgetMin: 2500,
          budgetMax: 4999
        };

      case "$5,000 or more":
        return {
          budgetMin: 5000,
          budgetMax: null
        };

      case "Need professional estimate":
        return {
          budgetMin: null,
          budgetMax: null
        };

      default:
        return {
          budgetMin: null,
          budgetMax: null
        };
    }
  }


  function generateJobReference() {

    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
        "function"
    ) {

      return (
        "KORVO-" +
        window.crypto
          .randomUUID()
          .replaceAll("-", "")
          .slice(0, 8)
          .toUpperCase()
      );
    }


    return (
      "KORVO-" +
      Date.now()
        .toString(36)
        .slice(-8)
        .toUpperCase()
    );
  }


  function createJob(
    customerId
  ) {

    const service =
      document.querySelector(
        'input[name="service"]:checked'
      )?.value || "";

    const timeframe =
      document.querySelector(
        'input[name="timeframe"]:checked'
      )?.value || "";

    const budgetValue =
      document.getElementById(
        "budget"
      ).value;

    const budget =
      parseBudgetRange(
        budgetValue
      );

    const preferredDate =
      document.getElementById(
        "preferredDate"
      ).value;


    return {

      customer_id:
        customerId,

      title:
        titleInput.value.trim(),

      description:
        descriptionInput.value.trim(),

      category:
        normalizeCategory(
          service
        ),

      city:
        document
          .getElementById("city")
          .value
          .trim(),

      state:
        "GA",

      budget_min:
        budget.budgetMin,

      budget_max:
        budget.budgetMax,

      preferred_date:
        timeframe ===
          "Specific date"
          ? preferredDate || null
          : null,

      timeframe:
        timeframe,

      status:
        "open",

      reference:
        generateJobReference()

    };
  }


  async function saveJob(
    job
  ) {

    /*
      The reference column is UNIQUE.
      In the extremely unlikely event
      that a reference already exists,
      Korvo tries again automatically.
    */

    let jobToSave = {
      ...job
    };


    for (
      let attempt = 0;
      attempt < 3;
      attempt++
    ) {

      const {
        data,
        error
      } =
        await korvoSupabase
          .from("jobs")
          .insert(
            jobToSave
          )
          .select()
          .single();


      if (!error) {
        return data;
      }


      if (
        error.code === "23505"
      ) {

        jobToSave = {
          ...jobToSave,

          reference:
            generateJobReference()
        };

        continue;
      }


      throw error;
    }


    throw new Error(
      "Korvo could not generate a unique job reference."
    );
  }


  /* ======================================
     POST MY JOB
  ====================================== */

  form.addEventListener(
    "submit",

    async function (event) {

      event.preventDefault();


      if (
        typeof korvoSupabase ===
        "undefined"
      ) {

        alert(
          "Korvo could not connect to the server. Please refresh and try again."
        );

        return;
      }


      const originalButtonText =
        submitButton.textContent;


      try {

        submitButton.disabled =
          true;

        submitButton.textContent =
          "Posting Job...";


        /*
          Get the real logged-in
          Supabase customer.
        */

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

          alert(
            "Please log in to your Korvo customer account before posting a job."
          );

          window.location.href =
            "login.html";

          return;
        }


        /*
          Create the database payload.
        */

        const job =
          createJob(
            user.id
          );


        /*
          Insert the job into
          public.jobs.
        */

        const savedJob =
          await saveJob(
            job
          );


        console.log(
          "Korvo job saved:",
          savedJob
        );


        if (jobReference) {

          jobReference.textContent =
            savedJob.reference;
        }


        /*
          Show success modal.
        */

        successModal.style.display =
          "flex";

        successModal.style.visibility =
          "visible";

        successModal.style.opacity =
          "1";


        successModal.setAttribute(
          "aria-hidden",
          "false"
        );


        successModal.classList.add(
          "active"
        );


        document.body.style.overflow =
          "hidden";


      } catch (error) {

        console.error(
          "Korvo job posting failed:",
          error
        );


        if (
          error.code === "42501"
        ) {

          alert(
            "Korvo could not post this job. Make sure you are signed in with a customer account."
          );

        } else {

          alert(
            "Korvo could not post your job. Please try again."
          );
        }

      } finally {

        submitButton.disabled =
          false;

        submitButton.textContent =
          originalButtonText;
      }

    }
  );

  
  /* ======================================
     POST ANOTHER
  ====================================== */

  if (postAnotherButton) {

    postAnotherButton.addEventListener(
      "click",
      function () {

        form.reset();

        successModal.style.display = "";

        successModal.style.visibility =
          "";

        successModal.style.opacity = "";

        successModal.classList.remove(
          "active"
        );

        successModal.setAttribute(
          "aria-hidden",
          "true"
        );

        document.body.style.overflow =
          "";

        currentStep = 1;

        showStep(1);

      }
    );

  }


  /* ======================================
     MOBILE MENU
  ====================================== */

  const mobileButton =
    document.getElementById(
      "mobileMenuButton"
    );

  const mobileNav =
    document.getElementById(
      "mobileNav"
    );

  if (mobileButton && mobileNav) {

    mobileButton.addEventListener(
      "click",
      function () {

        mobileNav.classList.toggle(
          "open"
        );

      }
    );

  }


  /* ======================================
     FOOTER YEAR
  ====================================== */

  const currentYear =
    document.getElementById(
      "currentYear"
    );

  if (currentYear) {

    currentYear.textContent =
      new Date().getFullYear();

  }


  /* ======================================
     START
  ====================================== */
/* ======================================
   FIX SERVICE CATEGORY SELECTION
====================================== */

const serviceCardElements =
  document.querySelectorAll(".service-card");

serviceCardElements.forEach(function (card) {

  const radio =
    card.querySelector(
      'input[type="radio"][name="service"]'
    );

  if (!radio) return;


  card.addEventListener(
    "click",
    function () {

      radio.checked = true;

      serviceCardElements.forEach(
        function (otherCard) {

          otherCard.classList.remove(
            "selected"
          );

        }
      );

      card.classList.add("selected");

      hideError("serviceError");

    }
  );


  radio.addEventListener(
    "change",
    function () {

      if (radio.checked) {

        serviceCardElements.forEach(
          function (otherCard) {

            otherCard.classList.remove(
              "selected"
            );

          }
        );

        card.classList.add("selected");

      }

    }
  );

});
  showStep(1);

  console.log(
    "Korvo Post-a-Job is ready."
  );

});