const professionalOnboardingForm =
  document.getElementById(
    "professionalOnboardingForm"
  );

function getCheckedValues(name) {
  return [
    ...document.querySelectorAll(
      `input[name="${name}"]:checked`
    )
  ].map(
    (input) => input.value
  );
}

professionalOnboardingForm?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const professionalName =
      document.getElementById(
        "professionalName"
      )?.value.trim();

    const businessName =
      document.getElementById(
        "businessName"
      )?.value.trim();

    const professionalPhone =
      document.getElementById(
        "professionalPhone"
      )?.value.trim();

    const professionalEmail =
      document.getElementById(
        "professionalEmail"
      )?.value.trim();

    const experienceYears =
      document.getElementById(
        "experienceYears"
      )?.value;

    const professionalAvailability =
      document.getElementById(
        "professionalAvailability"
      )?.value;

    const professionalBio =
      document.getElementById(
        "professionalBio"
      )?.value.trim();

    const services =
      getCheckedValues("services");

    const serviceAreas =
      getCheckedValues("areas");

    if (
      !professionalName ||
      !professionalPhone ||
      !professionalEmail ||
      !experienceYears ||
      !professionalAvailability
    ) {
      alert(
        "Please complete all required fields."
      );

      return;
    }

    if (services.length === 0) {
      alert(
        "Please select at least one service."
      );

      return;
    }

    if (serviceAreas.length === 0) {
      alert(
        "Please select at least one service area."
      );

      return;
    }

    const professionalProfile = {
      id: `pro-${Date.now()}`,

      name:
        professionalName,

      businessName:
        businessName,

      phone:
        professionalPhone,

      email:
        professionalEmail,

      services:
        services,

      serviceAreas:
        serviceAreas,

      experience:
        experienceYears,

      availability:
        professionalAvailability,

      bio:
        professionalBio,

      verificationStatus:
        "Not Verified",

      onboardingComplete:
        true,

      createdAt:
        new Date().toISOString()
    };

    localStorage.setItem(
      "korvoProfessionalProfile",
      JSON.stringify(
        professionalProfile
      )
    );

    localStorage.setItem(
      "korvoMessagingRole",
      "professional"
    );

    window.location.href =
      "professional-dashboard.html";
  }
);