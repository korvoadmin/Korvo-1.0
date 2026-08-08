document.addEventListener("DOMContentLoaded", () => {
  /* =====================================================
     KORVO — POST A JOB
     Complete JavaScript
     ===================================================== */

  const STORAGE_KEY = "korvoCustomerJobs";

  let currentStep = 1;
  const totalSteps = 5;
  let selectedPhotos = [];

  /* =====================================================
     ELEMENTS
     ===================================================== */

  const jobForm = document.getElementById("jobForm");

  const formSteps =
    document.querySelectorAll(".form-step");

  const nextButton =
    document.getElementById("nextButton");

  const backButton =
    document.getElementById("backButton");

  const submitButton =
    document.getElementById("submitButton");

  const progressText =
    document.getElementById("progressText");

  const progressPercent =
    document.getElementById("progressPercent");

  const progressFill =
    document.getElementById("progressFill");

  const stepIndicators =
    document.querySelectorAll(".step-indicator");


  /* =====================================================
     HEADER / MOBILE MENU
     ===================================================== */

  const mobileMenuButton =
    document.getElementById("mobileMenuButton");

  const mobileNav =
    document.getElementById("mobileNav");

  if (mobileMenuButton && mobileNav) {
    mobileMenuButton.addEventListener("click", () => {
      mobileNav.classList.toggle("open");

      const isOpen =
        mobileNav.classList.contains("open");

      mobileMenuButton.setAttribute(
        "aria-expanded",
        String(isOpen)
      );
    });
  }


  /* =====================================================
     CURRENT YEAR
     ===================================================== */

  const currentYear =
    document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }


  /* =====================================================
     SERVICE SEARCH
     ===================================================== */

  const serviceSearch =
    document.getElementById("serviceSearch");

  const serviceCards =
    document.querySelectorAll(".service-card");

  if (serviceSearch) {
    serviceSearch.addEventListener("input", () => {
      const searchValue =
        serviceSearch.value
          .trim()
          .toLowerCase();

      serviceCards.forEach((card) => {
        const serviceName =
          card.dataset.serviceName
            ?.toLowerCase() || "";

        const matches =
          serviceName.includes(searchValue);

        card.style.display =
          matches ? "" : "none";
      });
    });
  }


  /* =====================================================
     SERVICE CARD SELECTION
     ===================================================== */

  const serviceRadios =
    document.querySelectorAll(
      'input[name="service"]'
    );

  serviceRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      serviceCards.forEach((card) => {
        card.classList.remove("selected");
      });

      const selectedCard =
        radio.closest(".service-card");

      if (selectedCard) {
        selectedCard.classList.add("selected");
      }

      hideError("serviceError");
    });
  });


  /* =====================================================
     OPTION CARD SELECTION
     ===================================================== */

  const optionRadios =
    document.querySelectorAll(
      ".option-card input[type='radio']"
    );

  optionRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      const name = radio.name;

      document
        .querySelectorAll(
          `.option-card input[name="${name}"]`
        )
        .forEach((item) => {
          const card =
            item.closest(".option-card");

          if (card) {
            card.classList.toggle(
              "selected",
              item.checked
            );
          }
        });
    });
  });


  /* =====================================================
     CHARACTER COUNTERS
     ===================================================== */

  const jobTitle =
    document.getElementById("jobTitle");

  const jobTitleCount =
    document.getElementById("jobTitleCount");

  const jobDescription =
    document.getElementById("jobDescription");

  const descriptionCount =
    document.getElementById("descriptionCount");


  if (jobTitle && jobTitleCount) {
    jobTitle.addEventListener("input", () => {
      jobTitleCount.textContent =
        `${jobTitle.value.length} / 80`;

      hideError("jobTitleError");
    });
  }


  if (jobDescription && descriptionCount) {
    jobDescription.addEventListener(
      "input",
      () => {
        descriptionCount.textContent =
          `${jobDescription.value.length} / 1200`;

        hideError("descriptionError");
      }
    );
  }


  /* =====================================================
     SPECIFIC DATE
     ===================================================== */

  const timeframeRadios =
    document.querySelectorAll(
      'input[name="timeframe"]'
    );

  const preferredDateGroup =
    document.getElementById(
      "preferredDateGroup"
    );

  const preferredDate =
    document.getElementById("preferredDate");


  timeframeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      hideError("timeframeError");

      if (
        radio.checked &&
        radio.value === "Specific date"
      ) {
        preferredDateGroup?.classList.remove(
          "hidden-field"
        );

        if (preferredDate) {
          preferredDate.required = true;
        }
      } else if (radio.checked) {
        preferredDateGroup?.classList.add(
          "hidden-field"
        );

        if (preferredDate) {
          preferredDate.required = false;
          preferredDate.value = "";
        }
      }
    });
  });


  /* =====================================================
     PREVENT PAST DATES
     ===================================================== */

  if (preferredDate) {
    const today =
      new Date().toISOString().split("T")[0];

    preferredDate.min = today;
  }


  /* =====================================================
     PHOTO UPLOAD
     ===================================================== */

  const projectPhotos =
    document.getElementById("projectPhotos");

  const uploadButton =
    document.getElementById("uploadButton");

  const imagePreviewGrid =
    document.getElementById(
      "imagePreviewGrid"
    );


  if (uploadButton && projectPhotos) {
    uploadButton.addEventListener("click", () => {
      projectPhotos.click();
    });
  }


  if (projectPhotos) {
    projectPhotos.addEventListener(
      "change",
      (event) => {
        const files =
          Array.from(event.target.files);

        const validFiles =
          files.filter((file) => {
            return [
              "image/jpeg",
              "image/png",
              "image/webp"
            ].includes(file.type);
          });

        selectedPhotos = validFiles.slice(0, 5);

        renderPhotoPreviews();
      }
    );
  }


  function renderPhotoPreviews() {
    if (!imagePreviewGrid) return;

    imagePreviewGrid.innerHTML = "";

    selectedPhotos.forEach(
      (file, index) => {
        const reader = new FileReader();

        reader.onload = (event) => {
          const preview =
            document.createElement("div");

          preview.className =
            "image-preview";

          preview.innerHTML = `
            <img
              src="${event.target.result}"
              alt="Project photo ${index + 1}"
            >

            <button
              type="button"
              class="remove-photo-button"
              data-index="${index}"
              aria-label="Remove photo"
            >
              ×
            </button>
          `;

          imagePreviewGrid.appendChild(
            preview
          );

          const removeButton =
            preview.querySelector(
              ".remove-photo-button"
            );

          removeButton.addEventListener(
            "click",
            () => {
              removePhoto(index);
            }
          );
        };

        reader.readAsDataURL(file);
      }
    );
  }


  function removePhoto(index) {
    selectedPhotos.splice(index, 1);

    renderPhotoPreviews();
  }


  /* =====================================================
     FORM NAVIGATION
     ===================================================== */

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (!validateStep(currentStep)) {
        return;
      }

      if (currentStep < totalSteps) {
        currentStep++;

        if (currentStep === 5) {
          updateReview();
        }

        showStep(currentStep);
      }
    });
  }


  if (backButton) {
    backButton.addEventListener("click", () => {
      if (currentStep > 1) {
        currentStep--;

        showStep(currentStep);
      }
    });
  }


  document
    .querySelectorAll(".edit-step-button")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const step =
          Number(button.dataset.editStep);

        if (step >= 1 && step <= 5) {
          currentStep = step;

          showStep(currentStep);
        }
      });
    });


  /* =====================================================
     SHOW STEP
     ===================================================== */

  function showStep(step) {
    formSteps.forEach((section) => {
      const sectionStep =
        Number(section.dataset.step);

      section.classList.toggle(
        "active",
        sectionStep === step
      );
    });


    stepIndicators.forEach((indicator) => {
      const indicatorNumber =
        Number(indicator.dataset.indicator);

      indicator.classList.toggle(
        "active",
        indicatorNumber === step
      );

      indicator.classList.toggle(
        "completed",
        indicatorNumber < step
      );
    });


    const percent =
      Math.round(
        (step / totalSteps) * 100
      );


    if (progressText) {
      progressText.textContent =
        `Step ${step} of ${totalSteps}`;
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
        step === 1
      );
    }


    if (nextButton) {
      nextButton.classList.toggle(
        "hidden-button",
        step === totalSteps
      );
    }


    if (submitButton) {
      submitButton.classList.toggle(
        "hidden-button",
        step !== totalSteps
      );
    }


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  /* =====================================================
     VALIDATION
     ===================================================== */

  function validateStep(step) {
    clearStepErrors(step);

    if (step === 1) {
      const selectedService =
        document.querySelector(
          'input[name="service"]:checked'
        );

      if (!selectedService) {
        showError("serviceError");
        return false;
      }
    }


    if (step === 2) {
      let valid = true;

      if (
        !jobTitle ||
        jobTitle.value.trim().length < 3
      ) {
        showError("jobTitleError");
        valid = false;
      }

      if (
        !jobDescription ||
        jobDescription.value.trim().length < 10
      ) {
        showError("descriptionError");
        valid = false;
      }

      return valid;
    }


    if (step === 3) {
      let valid = true;

      const city =
        document.getElementById("city");

      const zipCode =
        document.getElementById("zipCode");

      const budget =
        document.getElementById("budget");

      const selectedTimeframe =
        document.querySelector(
          'input[name="timeframe"]:checked'
        );


      if (
        !city ||
        city.value.trim().length < 2
      ) {
        showError("cityError");
        valid = false;
      }


      if (
        !zipCode ||
        !/^\d{5}$/.test(
          zipCode.value.trim()
        )
      ) {
        showError("zipError");
        valid = false;
      }


      if (!selectedTimeframe) {
        showError("timeframeError");
        valid = false;
      }


      if (
        selectedTimeframe?.value ===
          "Specific date" &&
        !preferredDate?.value
      ) {
        alert(
          "Please select your preferred date."
        );

        valid = false;
      }


      if (!budget?.value) {
        showError("budgetError");
        valid = false;
      }

      return valid;
    }


    if (step === 4) {
      let valid = true;

      const firstName =
        document.getElementById("firstName");

      const lastName =
        document.getElementById("lastName");

      const email =
        document.getElementById("email");

      const phone =
        document.getElementById("phone");

      const termsAgreement =
        document.getElementById(
          "termsAgreement"
        );


      if (!firstName?.value.trim()) {
        showError("firstNameError");
        valid = false;
      }


      if (!lastName?.value.trim()) {
        showError("lastNameError");
        valid = false;
      }


      if (
        !email?.value.trim() ||
        !isValidEmail(email.value)
      ) {
        showError("emailError");
        valid = false;
      }


      if (
        !phone?.value.trim() ||
        !isValidPhone(phone.value)
      ) {
        showError("phoneError");
        valid = false;
      }


      if (!termsAgreement?.checked) {
        showError("termsError");
        valid = false;
      }

      return valid;
    }


    return true;
  }


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


  function clearStepErrors(step) {
    const section =
      document.querySelector(
        `.form-step[data-step="${step}"]`
      );

    if (!section) return;

    section
      .querySelectorAll(".field-error")
      .forEach((error) => {
        error.style.display = "none";
      });
  }


  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email.trim()
    );
  }


  function isValidPhone(phone) {
    const numbers =
      phone.replace(/\D/g, "");

    return numbers.length >= 10;
  }


  /* =====================================================
     LIVE ERROR CLEARING
     ===================================================== */

  const errorMap = {
    city: "cityError",
    zipCode: "zipError",
    budget: "budgetError",
    firstName: "firstNameError",
    lastName: "lastNameError",
    email: "emailError",
    phone: "phoneError"
  };


  Object.entries(errorMap).forEach(
    ([fieldId, errorId]) => {
      const field =
        document.getElementById(fieldId);

      field?.addEventListener(
        "input",
        () => hideError(errorId)
      );

      field?.addEventListener(
        "change",
        () => hideError(errorId)
      );
    }
  );


  const termsAgreement =
    document.getElementById(
      "termsAgreement"
    );

  termsAgreement?.addEventListener(
    "change",
    () => {
      if (termsAgreement.checked) {
        hideError("termsError");
      }
    }
  );


  /* =====================================================
     REVIEW PAGE
     ===================================================== */

  function updateReview() {
    const selectedService =
      document.querySelector(
        'input[name="service"]:checked'
      )?.value;

    const propertyType =
      document.getElementById(
        "propertyType"
      )?.value;

    const jobSize =
      document.getElementById(
        "jobSize"
      )?.value;

    const city =
      document.getElementById("city")
        ?.value;

    const zipCode =
      document.getElementById("zipCode")
        ?.value;

    const timeframe =
      document.querySelector(
        'input[name="timeframe"]:checked'
      )?.value;

    const budget =
      document.getElementById("budget")
        ?.value;

    const materialsProvided =
      document.getElementById(
        "materialsProvided"
      )?.checked;

    const firstName =
      document.getElementById(
        "firstName"
      )?.value;

    const lastName =
      document.getElementById(
        "lastName"
      )?.value;

    const email =
      document.getElementById("email")
        ?.value;

    const phone =
      document.getElementById("phone")
        ?.value;

    const contactPreference =
      document.querySelector(
        'input[name="contactPreference"]:checked'
      )?.value;


    setText(
      "reviewService",
      selectedService || "Not selected"
    );

    setText(
      "reviewJobTitle",
      jobTitle?.value.trim() ||
        "Not provided"
    );

    setText(
      "reviewDescription",
      jobDescription?.value.trim() ||
        "Not provided"
    );

    setText(
      "reviewProperty",
      propertyType || "Not provided"
    );

    setText(
      "reviewSize",
      jobSize || "Not provided"
    );

    setText(
      "reviewLocation",
      city && zipCode
        ? `${city}, ${zipCode}`
        : "Not provided"
    );


    let timeframeText =
      timeframe || "Not provided";

    if (
      timeframe === "Specific date" &&
      preferredDate?.value
    ) {
      timeframeText =
        formatDate(preferredDate.value);
    }

    setText(
      "reviewTimeframe",
      timeframeText
    );

    setText(
      "reviewBudget",
      budget || "Not provided"
    );

    setText(
      "reviewMaterials",
      materialsProvided
        ? "Customer has materials"
        : "Materials may be needed"
    );

    setText(
      "reviewName",
      `${firstName || ""} ${
        lastName || ""
      }`.trim() || "Not provided"
    );

    setText(
      "reviewEmail",
      email || "Not provided"
    );

    setText(
      "reviewPhone",
      phone || "Not provided"
    );

    setText(
      "reviewContactPreference",
      contactPreference ||
        "Korvo messages"
    );
  }


  function setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }


  /* =====================================================
     CREATE JOB DATA
     ===================================================== */

  function createJobData() {
    const service =
      document.querySelector(
        'input[name="service"]:checked'
      )?.value || "Other Service";

    const timeframe =
      document.querySelector(
        'input[name="timeframe"]:checked'
      )?.value || "";

    const city =
      document.getElementById("city")
        ?.value.trim() || "";

    const zipCode =
      document.getElementById("zipCode")
        ?.value.trim() || "";

    const firstName =
      document.getElementById(
        "firstName"
      )?.value.trim() || "";

    const lastName =
      document.getElementById(
        "lastName"
      )?.value.trim() || "";

    const budget =
      document.getElementById("budget")
        ?.value || "";

    const reference =
      generateJobReference();


    const customerDisplayName =
      `${firstName} ${
        lastName
          ? lastName.charAt(0).toUpperCase() +
            "."
          : ""
      }`.trim();


    let requestedDate = timeframe;

    if (
      timeframe === "Specific date" &&
      preferredDate?.value
    ) {
      requestedDate =
        formatDate(preferredDate.value);
    }


    return {
      id: reference,

      reference,

      title:
        jobTitle.value.trim(),

      jobTitle:
        jobTitle.value.trim(),

      category:
        normalizeCategory(service),

      service,

      description:
        jobDescription.value.trim(),

      propertyType:
        document.getElementById(
          "propertyType"
        )?.value || "",

      jobSize:
        document.getElementById(
          "jobSize"
        )?.value || "",

      location:
        `${city}, ${zipCode}`,

      city,

      zipCode,

      budget,

      budgetRange: budget,

      timeframe,

      preferredDate:
        preferredDate?.value || "",

      date: requestedDate,

      materialsProvided:
        document.getElementById(
          "materialsProvided"
        )?.checked || false,

      customer:
        customerDisplayName,

      customerName:
        customerDisplayName,

      firstName,

      lastName,

      email:
        document.getElementById("email")
          ?.value.trim() || "",

      phone:
        document.getElementById("phone")
          ?.value.trim() || "",

      contactPreference:
        document.querySelector(
          'input[name="contactPreference"]:checked'
        )?.value || "Korvo messages",

      photoCount:
        selectedPhotos.length,

      status: "Open",

      quotesCount: 0,

      createdAt:
        new Date().toISOString()
    };
  }


  /* =====================================================
     CATEGORY COMPATIBILITY

     Matches Professional Dashboard filters.
     ===================================================== */

  function normalizeCategory(service) {
    const value =
      service.toLowerCase();

    if (value.includes("clean")) {
      return "cleaning";
    }

    if (value.includes("paint")) {
      return "painting";
    }

    if (value.includes("electrical")) {
      return "electrical";
    }

    if (
      value.includes("lawn") ||
      value.includes("landscap")
    ) {
      return "landscaping";
    }

    if (value.includes("moving")) {
      return "moving";
    }

    if (
      value.includes("drapery") ||
      value.includes("shade") ||
      value.includes("blind") ||
      value.includes("window")
    ) {
      return "window treatments";
    }

    return "other";
  }


  /* =====================================================
     JOB REFERENCE
     ===================================================== */

  function generateJobReference() {
    const randomNumber =
      Math.floor(
        100000 + Math.random() * 900000
      );

    return `KORVO-${randomNumber}`;
  }


  /* =====================================================
     SAVE JOB
     ===================================================== */

  function saveJob(jobData) {
    let savedJobs = [];

    try {
      const existingJobs =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (existingJobs) {
        const parsedJobs =
          JSON.parse(existingJobs);

        if (Array.isArray(parsedJobs)) {
          savedJobs = parsedJobs;
        }
      }
    } catch (error) {
      console.error(
        "Could not load existing Korvo jobs:",
        error
      );

      savedJobs = [];
    }


    savedJobs.unshift(jobData);


    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(savedJobs)
      );

      localStorage.setItem(
        "korvoLatestJob",
        JSON.stringify(jobData)
      );

      return true;
    } catch (error) {
      console.error(
        "Could not save Korvo job:",
        error
      );

      return false;
    }
  }


  /* =====================================================
     FORM SUBMISSION
     ===================================================== */

  if (jobForm) {
    jobForm.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();


        if (!validateStep(4)) {
          currentStep = 4;

          showStep(currentStep);

          return;
        }


        const jobData =
          createJobData();


        const saved =
          saveJob(jobData);


        if (!saved) {
          alert(
            "Korvo could not save the job. Please try again."
          );

          return;
        }


        showSuccessModal(jobData);
      }
    );
  }


  /* =====================================================
     SUCCESS MODAL
     ===================================================== */

  const successModal =
    document.getElementById(
      "successModal"
    );

  const jobReference =
    document.getElementById(
      "jobReference"
    );

  const postAnotherButton =
    document.getElementById(
      "postAnotherButton"
    );


  function showSuccessModal(jobData) {
    if (!successModal) return;


    if (jobReference) {
      jobReference.textContent =
        jobData.reference;
    }


    successModal.classList.add(
      "active"
    );

    successModal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow =
      "hidden";
  }


  if (postAnotherButton) {
    postAnotherButton.addEventListener(
      "click",
      () => {
        successModal?.classList.remove(
          "active"
        );

        successModal?.setAttribute(
          "aria-hidden",
          "true"
        );

        document.body.style.overflow =
          "";


        jobForm?.reset();

        selectedPhotos = [];

        if (imagePreviewGrid) {
          imagePreviewGrid.innerHTML = "";
        }


        serviceCards.forEach((card) => {
          card.classList.remove(
            "selected"
          );
        });


        document
          .querySelectorAll(
            ".option-card"
          )
          .forEach((card) => {
            card.classList.remove(
              "selected"
            );
          });


        preferredDateGroup?.classList.add(
          "hidden-field"
        );


        if (jobTitleCount) {
          jobTitleCount.textContent =
            "0 / 80";
        }


        if (descriptionCount) {
          descriptionCount.textContent =
            "0 / 1200";
        }


        currentStep = 1;

        showStep(currentStep);
      }
    );
  }


  /* =====================================================
     DATE FORMATTER
     ===================================================== */

  function formatDate(dateValue) {
    if (!dateValue) {
      return "";
    }

    const date =
      new Date(
        `${dateValue}T12:00:00`
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


  /* =====================================================
     START PAGE
     ===================================================== */

  document
    .querySelectorAll(".field-error")
    .forEach((error) => {
      error.style.display = "none";
    });


  showStep(1);


  console.log(
    "Korvo Post-a-Job system loaded."
  );
});