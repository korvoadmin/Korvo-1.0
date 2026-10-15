/* =========================
   Korvo Professional Profile
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
  const mobileMenuButton = document.getElementById("mobileMenuButton");
  const mobileNav = document.getElementById("mobileNav");

  const openQuoteButton = document.getElementById("openQuoteButton");
  const closeQuoteButton = document.getElementById("closeQuoteButton");
  const finishQuoteButton = document.getElementById("finishQuoteButton");

  const quoteModal = document.getElementById("quoteModal");
  const quoteForm = document.getElementById("quoteForm");
  const quoteSuccess = document.getElementById("quoteSuccess");

  const saveProfessionalButton = document.getElementById(
    "saveProfessionalButton"
  );

  const messageButton = document.getElementById("messageButton");

  /* Mobile navigation */

  if (mobileMenuButton && mobileNav) {
    mobileMenuButton.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("open");

      mobileMenuButton.textContent = isOpen ? "×" : "☰";
      mobileMenuButton.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
      );
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("open");
        mobileMenuButton.textContent = "☰";
      });
    });
  }

  /* Quote modal */

  function openQuoteModal() {
    if (!quoteModal) return;

    quoteModal.classList.remove("hidden");
    document.body.classList.add("modal-open");

    const firstInput = document.getElementById("customerName");

    setTimeout(() => {
      firstInput?.focus();
    }, 100);
  }

  function closeQuoteModal() {
    if (!quoteModal) return;

    quoteModal.classList.add("hidden");
    document.body.classList.remove("modal-open");

    quoteForm?.classList.remove("hidden");
    quoteSuccess?.classList.add("hidden");
  }

  openQuoteButton?.addEventListener("click", openQuoteModal);
  closeQuoteButton?.addEventListener("click", closeQuoteModal);
  finishQuoteButton?.addEventListener("click", closeQuoteModal);

  quoteModal?.addEventListener("click", (event) => {
    if (event.target === quoteModal) {
      closeQuoteModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      quoteModal &&
      !quoteModal.classList.contains("hidden")
    ) {
      closeQuoteModal();
    }
  });

  /* Quote form */

  quoteForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(quoteForm);

    const quoteRequest = {
      professional: "Chris Custom Installations",
      customerName: formData.get("customerName"),
      customerEmail: formData.get("customerEmail"),
      serviceType: formData.get("serviceType"),
      projectLocation: formData.get("projectLocation"),
      projectDate: formData.get("projectDate"),
      projectBudget: formData.get("projectBudget"),
      projectDescription: formData.get("projectDescription"),
      submittedAt: new Date().toISOString()
    };

    saveQuoteRequest(quoteRequest);

    quoteForm.classList.add("hidden");
    quoteSuccess?.classList.remove("hidden");

    quoteForm.reset();
  });

  function saveQuoteRequest(quoteRequest) {
    try {
      const existingRequests =
        JSON.parse(localStorage.getItem("korvoQuoteRequests")) || [];

      existingRequests.push(quoteRequest);

      localStorage.setItem(
        "korvoQuoteRequests",
        JSON.stringify(existingRequests)
      );
    } catch (error) {
      console.error("Unable to save quote request:", error);
    }
  }

  /* Save professional */

  function loadSavedProfessional() {
    try {
      const savedProfessionals =
        JSON.parse(localStorage.getItem("korvoSavedProfessionals")) || [];

      const isSaved = savedProfessionals.includes(
        "Chris Custom Installations"
      );

      updateSaveButton(isSaved);
    } catch (error) {
      console.error("Unable to load saved professionals:", error);
    }
  }

  function updateSaveButton(isSaved) {
    if (!saveProfessionalButton) return;

    if (isSaved) {
      saveProfessionalButton.classList.add("saved");
      saveProfessionalButton.textContent = "♥ Professional Saved";
    } else {
      saveProfessionalButton.classList.remove("saved");
      saveProfessionalButton.textContent = "♡ Save Professional";
    }
  }

  saveProfessionalButton?.addEventListener("click", () => {
    try {
      const savedProfessionals =
        JSON.parse(localStorage.getItem("korvoSavedProfessionals")) || [];

      const professionalName = "Chris Custom Installations";
      const isAlreadySaved = savedProfessionals.includes(professionalName);

      let updatedSavedProfessionals;

      if (isAlreadySaved) {
        updatedSavedProfessionals = savedProfessionals.filter(
          (professional) => professional !== professionalName
        );
      } else {
        updatedSavedProfessionals = [
          ...savedProfessionals,
          professionalName
        ];
      }

      localStorage.setItem(
        "korvoSavedProfessionals",
        JSON.stringify(updatedSavedProfessionals)
      );

      updateSaveButton(!isAlreadySaved);
    } catch (error) {
      console.error("Unable to update saved professional:", error);
    }
  });

  /* Message button */

  messageButton?.addEventListener("click", () => {
    alert(
      "Korvo messaging will be available soon. For now, use Request a Quote."
    );
  });

  /* Prevent past dates */

  const projectDateInput = document.getElementById("projectDate");

  if (projectDateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    projectDateInput.min = `${year}-${month}-${day}`;
  }
const pageParameters = new URLSearchParams(window.location.search);

if (pageParameters.get("quote") === "open") {
  openQuoteModal();
}

  loadSavedProfessional();
});