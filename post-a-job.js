/* ========================================
   KORVO POST-A-JOB PAGE
======================================== */

document.addEventListener("DOMContentLoaded", () => {
  const jobForm = document.getElementById("jobForm");
  const formSteps = document.querySelectorAll(".form-step");
  const stepIndicators = document.querySelectorAll(".step-indicator");

  const nextButton = document.getElementById("nextButton");
  const backButton = document.getElementById("backButton");
  const submitButton = document.getElementById("submitButton");

  const progressText = document.getElementById("progressText");
  const progressPercent = document.getElementById("progressPercent");
  const progressFill = document.getElementById("progressFill");

  const mobileMenuButton = document.getElementById(
    "mobileMenuButton"
  );

  const mobileNav = document.getElementById("mobileNav");

  const serviceSearch = document.getElementById("serviceSearch");
  const serviceCards = document.querySelectorAll(".service-card");
  const serviceInputs = document.querySelectorAll(
    'input[name="service"]'
  );

  const jobTitle = document.getElementById("jobTitle");
  const jobDescription = document.getElementById(
    "jobDescription"
  );

  const jobTitleCount = document.getElementById(
    "jobTitleCount"
  );

  const descriptionCount = document.getElementById(
    "descriptionCount"
  );

  const uploadArea = document.getElementById("uploadArea");
  const uploadButton = document.getElementById("uploadButton");
  const projectPhotos = document.getElementById(
    "projectPhotos"
  );

  const imagePreviewGrid = document.getElementById(
    "imagePreviewGrid"
  );

  const preferredDateGroup = document.getElementById(
    "preferredDateGroup"
  );

  const preferredDate = document.getElementById(
    "preferredDate"
  );

  const timeframeInputs = document.querySelectorAll(
    'input[name="timeframe"]'
  );

  const successModal = document.getElementById(
    "successModal"
  );

  const jobReference = document.getElementById(
    "jobReference"
  );

  const postAnotherButton = document.getElementById(
    "postAnotherButton"
  );

  const currentYear = document.getElementById(
    "currentYear"
  );

  let currentStep = 1;
  let selectedPhotoFiles = [];

  const totalSteps = formSteps.length;


  /* ========================================
     CURRENT YEAR
  ======================================== */

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }


  /* ========================================
     MOBILE MENU
  ======================================== */

  if (mobileMenuButton && mobileNav) {
    mobileMenuButton.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("open");

      mobileMenuButton.setAttribute(
        "aria-expanded",
        String(isOpen)
      );
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("open");

        mobileMenuButton.setAttribute(
          "aria-expanded",
          "false"
        );
      });
    });
  }


  /* ========================================
     SET MINIMUM PROJECT DATE
  ======================================== */

  if (preferredDate) {
    const today = new Date();
    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    preferredDate.min = `${year}-${month}-${day}`;
  }


  /* ========================================
     FORM STEP DISPLAY
  ======================================== */

  function showStep(stepNumber) {
    currentStep = stepNumber;

    formSteps.forEach((step) => {
      const stepValue = Number(step.dataset.step);

      step.classList.toggle(
        "active",
        stepValue === currentStep
      );
    });

    stepIndicators.forEach((indicator) => {
      const indicatorValue = Number(
        indicator.dataset.indicator
      );

      indicator.classList.toggle(
        "active",
        indicatorValue === currentStep
      );

      indicator.classList.toggle(
        "completed",
        indicatorValue < currentStep
      );
    });

    const progress = Math.round(
      (currentStep / totalSteps) * 100
    );

    progressText.textContent =
      `Step ${currentStep} of ${totalSteps}`;

    progressPercent.textContent =
      `${progress}% complete`;

    progressFill.style.width = `${progress}%`;

    backButton.classList.toggle(
      "hidden-button",
      currentStep === 1
    );

    nextButton.classList.toggle(
      "hidden-button",
      currentStep === totalSteps
    );

    submitButton.classList.toggle(
      "hidden-button",
      currentStep !== totalSteps
    );

    if (currentStep === totalSteps) {
      updateReview();
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  /* ========================================
     ERROR HELPERS
  ======================================== */

  function showError(input, errorElement) {
    if (input) {
      input.classList.add("input-error");
    }

    if (errorElement) {
      errorElement.classList.add("show");
    }
  }

  function clearError(input, errorElement) {
    if (input) {
      input.classList.remove("input-error");
    }

    if (errorElement) {
      errorElement.classList.remove("show");
    }
  }

  function clearRadioError(errorElement) {
    if (errorElement) {
      errorElement.classList.remove("show");
    }
  }

  function isValidEmail(emailValue) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      emailValue
    );
  }

  function isValidPhone(phoneValue) {
    const digits = phoneValue.replace(/\D/g, "");

    return digits.length >= 10;
  }


  /* ========================================
     STEP VALIDATION
  ======================================== */

  function validateStepOne() {
    const selectedService = document.querySelector(
      'input[name="service"]:checked'
    );

    const serviceError = document.getElementById(
      "serviceError"
    );

    if (!selectedService) {
      serviceError.classList.add("show");
      return false;
    }

    serviceError.classList.remove("show");
    return true;
  }

  function validateStepTwo() {
    let isValid = true;

    const jobTitleError = document.getElementById(
      "jobTitleError"
    );

    const descriptionError = document.getElementById(
      "descriptionError"
    );

    if (jobTitle.value.trim().length < 5) {
      showError(jobTitle, jobTitleError);
      isValid = false;
    } else {
      clearError(jobTitle, jobTitleError);
    }

    if (jobDescription.value.trim().length < 20) {
      showError(
        jobDescription,
        descriptionError
      );

      isValid = false;
    } else {
      clearError(
        jobDescription,
        descriptionError
      );
    }

    return isValid;
  }

  function validateStepThree() {
    let isValid = true;

    const city = document.getElementById("city");
    const zipCode = document.getElementById("zipCode");
    const budget = document.getElementById("budget");

    const cityError = document.getElementById(
      "cityError"
    );

    const zipError = document.getElementById(
      "zipError"
    );

    const timeframeError = document.getElementById(
      "timeframeError"
    );

    const budgetError = document.getElementById(
      "budgetError"
    );

    const selectedTimeframe = document.querySelector(
      'input[name="timeframe"]:checked'
    );

    if (city.value.trim().length < 2) {
      showError(city, cityError);
      isValid = false;
    } else {
      clearError(city, cityError);
    }

    if (!/^\d{5}$/.test(zipCode.value.trim())) {
      showError(zipCode, zipError);
      isValid = false;
    } else {
      clearError(zipCode, zipError);
    }

    if (!selectedTimeframe) {
      timeframeError.classList.add("show");
      isValid = false;
    } else {
      timeframeError.classList.remove("show");
    }

    if (
      selectedTimeframe &&
      selectedTimeframe.value === "Specific date" &&
      !preferredDate.value
    ) {
      showError(preferredDate, timeframeError);
      isValid = false;
    } else {
      clearError(preferredDate, null);
    }

    if (!budget.value) {
      showError(budget, budgetError);
      isValid = false;
    } else {
      clearError(budget, budgetError);
    }

    return isValid;
  }

  function validateStepFour() {
    let isValid = true;

    const firstName = document.getElementById(
      "firstName"
    );

    const lastName = document.getElementById(
      "lastName"
    );

    const email = document.getElementById("email");
    const phone = document.getElementById("phone");

    const termsAgreement = document.getElementById(
      "termsAgreement"
    );

    const firstNameError = document.getElementById(
      "firstNameError"
    );

    const lastNameError = document.getElementById(
      "lastNameError"
    );

    const emailError = document.getElementById(
      "emailError"
    );

    const phoneError = document.getElementById(
      "phoneError"
    );

    const termsError = document.getElementById(
      "termsError"
    );

    if (firstName.value.trim().length < 2) {
      showError(firstName, firstNameError);
      isValid = false;
    } else {
      clearError(firstName, firstNameError);
    }

    if (lastName.value.trim().length < 2) {
      showError(lastName, lastNameError);
      isValid = false;
    } else {
      clearError(lastName, lastNameError);
    }

    if (!isValidEmail(email.value.trim())) {
      showError(email, emailError);
      isValid = false;
    } else {
      clearError(email, emailError);
    }

    if (!isValidPhone(phone.value.trim())) {
      showError(phone, phoneError);
      isValid = false;
    } else {
      clearError(phone, phoneError);
    }

    if (!termsAgreement.checked) {
      termsError.classList.add("show");
      isValid = false;
    } else {
      termsError.classList.remove("show");
    }

    return isValid;
  }

  function validateCurrentStep() {
    switch (currentStep) {
      case 1:
        return validateStepOne();

      case 2:
        return validateStepTwo();

      case 3:
        return validateStepThree();

      case 4:
        return validateStepFour();

      default:
        return true;
    }
  }


  /* ========================================
     NEXT AND BACK BUTTONS
  ======================================== */

  nextButton.addEventListener("click", () => {
    const isValid = validateCurrentStep();

    if (!isValid) {
      const firstError = document.querySelector(
        ".form-step.active .input-error, " +
        ".form-step.active .field-error.show"
      );

      if (firstError) {
        firstError.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }

      return;
    }

    if (currentStep < totalSteps) {
      showStep(currentStep + 1);
    }
  });

  backButton.addEventListener("click", () => {
    if (currentStep > 1) {
      showStep(currentStep - 1);
    }
  });


  /* ========================================
     SERVICE SELECTION
  ======================================== */

  serviceInputs.forEach((input) => {
    input.addEventListener("change", () => {
      serviceCards.forEach((card) => {
        const radio = card.querySelector(
          'input[name="service"]'
        );

        card.classList.toggle(
          "selected",
          radio.checked
        );
      });

      clearRadioError(
        document.getElementById("serviceError")
      );
    });
  });


  /* ========================================
     SERVICE SEARCH
  ======================================== */

  serviceSearch.addEventListener("input", () => {
    const searchTerm = serviceSearch.value
      .trim()
      .toLowerCase();

    serviceCards.forEach((card) => {
      const serviceName = card.dataset.serviceName
        .toLowerCase();

      const serviceText = card.textContent
        .toLowerCase();

      const isMatch =
        serviceName.includes(searchTerm) ||
        serviceText.includes(searchTerm);

      card.classList.toggle(
        "hidden-service",
        !isMatch
      );
    });
  });


  /* ========================================
     TEXT COUNTERS
  ======================================== */

  function updateCharacterCount(
    input,
    countElement,
    maximum
  ) {
    countElement.textContent =
      `${input.value.length} / ${maximum}`;
  }

  jobTitle.addEventListener("input", () => {
    updateCharacterCount(
      jobTitle,
      jobTitleCount,
      80
    );

    if (jobTitle.value.trim().length >= 5) {
      clearError(
        jobTitle,
        document.getElementById("jobTitleError")
      );
    }
  });

  jobDescription.addEventListener("input", () => {
    updateCharacterCount(
      jobDescription,
      descriptionCount,
      1200
    );

    if (jobDescription.value.trim().length >= 20) {
      clearError(
        jobDescription,
        document.getElementById(
          "descriptionError"
        )
      );
    }
  });


  /* ========================================
     LIVE FIELD ERROR CLEARING
  ======================================== */

  const fieldsWithErrors = [
    {
      input: document.getElementById("city"),
      error: document.getElementById("cityError")
    },
    {
      input: document.getElementById("zipCode"),
      error: document.getElementById("zipError")
    },
    {
      input: document.getElementById("budget"),
      error: document.getElementById("budgetError")
    },
    {
      input: document.getElementById("firstName"),
      error: document.getElementById(
        "firstNameError"
      )
    },
    {
      input: document.getElementById("lastName"),
      error: document.getElementById(
        "lastNameError"
      )
    },
    {
      input: document.getElementById("email"),
      error: document.getElementById(
        "emailError"
      )
    },
    {
      input: document.getElementById("phone"),
      error: document.getElementById(
        "phoneError"
      )
    }
  ];

  fieldsWithErrors.forEach(({ input, error }) => {
    if (!input) {
      return;
    }

    input.addEventListener("input", () => {
      clearError(input, error);
    });

    input.addEventListener("change", () => {
      clearError(input, error);
    });
  });


  /* ========================================
     PHONE NUMBER FORMATTING
  ======================================== */

  const phoneInput = document.getElementById("phone");

  phoneInput.addEventListener("input", () => {
    let digits = phoneInput.value.replace(/\D/g, "");

    digits = digits.slice(0, 10);

    if (digits.length >= 7) {
      phoneInput.value =
        `(${digits.slice(0, 3)}) ` +
        `${digits.slice(3, 6)}-` +
        `${digits.slice(6)}`;
    } else if (digits.length >= 4) {
      phoneInput.value =
        `(${digits.slice(0, 3)}) ` +
        `${digits.slice(3)}`;
    } else if (digits.length > 0) {
      phoneInput.value = `(${digits}`;
    }
  });


  /* ========================================
     ZIP CODE FORMATTING
  ======================================== */

  const zipCodeInput = document.getElementById(
    "zipCode"
  );

  zipCodeInput.addEventListener("input", () => {
    zipCodeInput.value = zipCodeInput.value
      .replace(/\D/g, "")
      .slice(0, 5);
  });


  /* ========================================
     TIMEFRAME SELECTION
  ======================================== */

  timeframeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      const showDate =
        input.checked &&
        input.value === "Specific date";

      preferredDateGroup.classList.toggle(
        "show",
        showDate
      );

      if (!showDate) {
        preferredDate.value = "";
      }

      clearRadioError(
        document.getElementById(
          "timeframeError"
        )
      );
    });
  });


  /* ========================================
     PHOTO UPLOAD
  ======================================== */

  uploadButton.addEventListener("click", () => {
    projectPhotos.click();
  });

  uploadArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadArea.classList.add("dragging");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragging");
  });

  uploadArea.addEventListener("drop", (event) => {
    event.preventDefault();

    uploadArea.classList.remove("dragging");

    const droppedFiles = Array.from(
      event.dataTransfer.files
    );

    addPhotoFiles(droppedFiles);
  });

  projectPhotos.addEventListener("change", () => {
    const uploadedFiles = Array.from(
      projectPhotos.files
    );

    addPhotoFiles(uploadedFiles);
  });

  function addPhotoFiles(files) {
    const imageFiles = files.filter((file) => {
      return file.type.startsWith("image/");
    });

    const availableSlots =
      5 - selectedPhotoFiles.length;

    const filesToAdd = imageFiles.slice(
      0,
      availableSlots
    );

    selectedPhotoFiles = [
      ...selectedPhotoFiles,
      ...filesToAdd
    ];

    renderPhotoPreviews();

    projectPhotos.value = "";
  }

  function renderPhotoPreviews() {
    imagePreviewGrid.innerHTML = "";

    selectedPhotoFiles.forEach((file, index) => {
      const preview = document.createElement("div");
      preview.className = "image-preview";

      const image = document.createElement("img");

      image.alt =
        `Project upload preview ${index + 1}`;

      const removeButton =
        document.createElement("button");

      removeButton.type = "button";
      removeButton.className =
        "remove-image-button";

      removeButton.setAttribute(
        "aria-label",
        `Remove photo ${index + 1}`
      );

      removeButton.textContent = "×";

      const reader = new FileReader();

      reader.addEventListener("load", () => {
        image.src = reader.result;
      });

      reader.readAsDataURL(file);

      removeButton.addEventListener(
        "click",
        () => {
          selectedPhotoFiles.splice(index, 1);
          renderPhotoPreviews();
        }
      );

      preview.append(image, removeButton);
      imagePreviewGrid.appendChild(preview);
    });
  }


  /* ========================================
     EDIT BUTTONS ON REVIEW PAGE
  ======================================== */

  const editStepButtons = document.querySelectorAll(
    ".edit-step-button"
  );

  editStepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetStep = Number(
        button.dataset.editStep
      );

      showStep(targetStep);
    });
  });


  /* ========================================
     REVIEW PAGE
  ======================================== */

  function getSelectedValue(name) {
    const selected = document.querySelector(
      `input[name="${name}"]:checked`
    );

    return selected ? selected.value : "";
  }

  function setReviewText(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
      element.textContent =
        value && value.trim()
          ? value
          : "Not provided";
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return "";
    }

    const date = new Date(`${dateValue}T12:00:00`);

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  function updateReview() {
    const service = getSelectedValue("service");
    const timeframe = getSelectedValue("timeframe");

    const propertyType = document.getElementById(
      "propertyType"
    ).value;

    const jobSize = document.getElementById(
      "jobSize"
    ).value;

    const city = document.getElementById("city").value;
    const zipCode = document.getElementById(
      "zipCode"
    ).value;

    const budget = document.getElementById(
      "budget"
    ).value;

    const materialsProvided = document.getElementById(
      "materialsProvided"
    ).checked;

    const firstName = document.getElementById(
      "firstName"
    ).value;

    const lastName = document.getElementById(
      "lastName"
    ).value;

    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;

    const contactPreference = getSelectedValue(
      "contactPreference"
    );

    let displayedTimeframe = timeframe;

    if (
      timeframe === "Specific date" &&
      preferredDate.value
    ) {
      displayedTimeframe =
        `Specific date — ${formatDate(
          preferredDate.value
        )}`;
    }

    setReviewText("reviewService", service);

    setReviewText(
      "reviewJobTitle",
      jobTitle.value.trim()
    );

    setReviewText(
      "reviewDescription",
      jobDescription.value.trim()
    );

    setReviewText(
      "reviewProperty",
      propertyType
    );

    setReviewText("reviewSize", jobSize);

    setReviewText(
      "reviewLocation",
      `${city.trim()}, GA ${zipCode.trim()}`
    );

    setReviewText(
      "reviewTimeframe",
      displayedTimeframe
    );

    setReviewText("reviewBudget", budget);

    setReviewText(
      "reviewMaterials",
      materialsProvided
        ? "Customer has some or all materials"
        : "Professional may need to provide materials"
    );

    setReviewText(
      "reviewName",
      `${firstName.trim()} ${lastName.trim()}`
    );

    setReviewText(
      "reviewEmail",
      email.trim()
    );

    setReviewText(
      "reviewPhone",
      phone.trim()
    );

    setReviewText(
      "reviewContactPreference",
      contactPreference
    );
  }


  /* ========================================
     SAVE JOB TO LOCAL STORAGE
  ======================================== */

  function createJobData() {
    const jobId =
      `KORVO-${Date.now().toString().slice(-6)}`;

    return {
      id: jobId,

      createdAt: new Date().toISOString(),

      status: "Open",

      service: getSelectedValue("service"),

      title: jobTitle.value.trim(),

      description: jobDescription.value.trim(),

      propertyType:
        document.getElementById("propertyType").value,

      jobSize:
        document.getElementById("jobSize").value,

      city:
        document.getElementById("city").value.trim(),

      zipCode:
        document.getElementById("zipCode").value.trim(),

      timeframe:
        getSelectedValue("timeframe"),

      preferredDate: preferredDate.value,

      budget:
        document.getElementById("budget").value,

      materialsProvided:
        document.getElementById(
          "materialsProvided"
        ).checked,

      customer: {
        firstName:
          document.getElementById(
            "firstName"
          ).value.trim(),

        lastName:
          document.getElementById(
            "lastName"
          ).value.trim(),

        email:
          document.getElementById(
            "email"
          ).value.trim(),

        phone:
          document.getElementById(
            "phone"
          ).value.trim(),

        contactPreference:
          getSelectedValue(
            "contactPreference"
          )
      },

      photoCount: selectedPhotoFiles.length,

      interestedProfessionals: 0,

      messages: 0
    };
  }

  function saveJob(jobData) {
    let savedJobs = [];

    try {
      const existingJobs =
        localStorage.getItem("korvoJobs");

      savedJobs = existingJobs
        ? JSON.parse(existingJobs)
        : [];

      if (!Array.isArray(savedJobs)) {
        savedJobs = [];
      }
    } catch (error) {
      console.error(
        "Korvo could not read saved jobs:",
        error
      );

      savedJobs = [];
    }

    savedJobs.unshift(jobData);

    try {
      localStorage.setItem(
        "korvoJobs",
        JSON.stringify(savedJobs)
      );

      localStorage.setItem(
        "korvoLatestJob",
        JSON.stringify(jobData)
      );

      return true;
    } catch (error) {
      console.error(
        "Korvo could not save the job:",
        error
      );

      return false;
    }
  }


  /* ========================================
     FORM SUBMISSION
  ======================================== */

  jobForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const jobData = createJobData();
    const savedSuccessfully = saveJob(jobData);

    if (!savedSuccessfully) {
      alert(
        "Korvo could not save this job in your browser. " +
        "Please check your browser storage settings."
      );

      return;
    }

    jobReference.textContent = jobData.id;

    successModal.classList.add("open");

    successModal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add("modal-open");
  });


  /* ========================================
     POST ANOTHER JOB
  ======================================== */

  postAnotherButton.addEventListener("click", () => {
    successModal.classList.remove("open");

    successModal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove("modal-open");

    jobForm.reset();

    selectedPhotoFiles = [];

    imagePreviewGrid.innerHTML = "";

    serviceCards.forEach((card) => {
      card.classList.remove(
        "selected",
        "hidden-service"
      );
    });

    serviceSearch.value = "";

    preferredDateGroup.classList.remove("show");

    document
      .querySelectorAll(".field-error")
      .forEach((error) => {
        error.classList.remove("show");
      });

    document
      .querySelectorAll(".input-error")
      .forEach((input) => {
        input.classList.remove("input-error");
      });

    updateCharacterCount(
      jobTitle,
      jobTitleCount,
      80
    );

    updateCharacterCount(
      jobDescription,
      descriptionCount,
      1200
    );

    showStep(1);
  });


  /* ========================================
     CLOSE MODAL WITH ESCAPE KEY
  ======================================== */

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      successModal.classList.contains("open")
    ) {
      successModal.classList.remove("open");

      successModal.setAttribute(
        "aria-hidden",
        "true"
      );

      document.body.classList.remove("modal-open");
    }
  });


  /* ========================================
     LOAD SERVICE FROM URL
  ======================================== */

  function loadServiceFromURL() {
    const params = new URLSearchParams(
      window.location.search
    );

    const requestedService = params.get("service");

    if (!requestedService) {
      return;
    }

    serviceInputs.forEach((input) => {
      const isMatch =
        input.value.toLowerCase() ===
        requestedService.toLowerCase();

      if (isMatch) {
        input.checked = true;

        input
          .closest(".service-card")
          .classList.add("selected");
      }
    });
  }


  /* ========================================
     INITIAL PAGE SETUP
  ======================================== */

  loadServiceFromURL();

  updateCharacterCount(
    jobTitle,
    jobTitleCount,
    80
  );

  updateCharacterCount(
    jobDescription,
    descriptionCount,
    1200
  );

  showStep(1);
});