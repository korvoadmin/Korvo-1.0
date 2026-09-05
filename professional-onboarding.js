const professionalOnboardingForm =
  document.getElementById(
    "professionalOnboardingForm"
  );

const serviceSearch =
  document.getElementById(
    "serviceSearch"
  );

const serviceSearchResults =
  document.getElementById(
    "serviceSearchResults"
  );

const selectedServicesContainer =
  document.getElementById(
    "selectedServices"
  );

const selectedServices = [];

const serviceCatalog = [
  { name: "Window Treatments", category: "Home Services" },
  { name: "Blind Installation", category: "Home Services" },
  { name: "Curtain Installation", category: "Home Services" },
  { name: "Handyman", category: "Home Services" },
  { name: "Furniture Assembly", category: "Home Services" },
  { name: "TV Mounting", category: "Home Services" },
  { name: "Painting", category: "Home Services" },
  { name: "Interior Painting", category: "Home Services" },
  { name: "Exterior Painting", category: "Home Services" },
  { name: "Drywall Repair", category: "Home Services" },
  { name: "Carpentry", category: "Home Services" },
  { name: "Flooring Installation", category: "Home Services" },
  { name: "Tile Installation", category: "Home Services" },
  { name: "Cabinet Installation", category: "Home Services" },
  { name: "Appliance Installation", category: "Home Services" },
  { name: "Pressure Washing", category: "Home Services" },
  { name: "Gutter Cleaning", category: "Home Services" },
  { name: "Roof Repair", category: "Home Services" },
  { name: "Plumbing", category: "Home Services" },
  { name: "Electrical", category: "Home Services" },
  { name: "HVAC", category: "Home Services" },
  { name: "Locksmith", category: "Home Services" },

  { name: "Home Cleaning", category: "Cleaning" },
  { name: "Deep Cleaning", category: "Cleaning" },
  { name: "Move-In Cleaning", category: "Cleaning" },
  { name: "Move-Out Cleaning", category: "Cleaning" },
  { name: "Office Cleaning", category: "Cleaning" },
  { name: "Carpet Cleaning", category: "Cleaning" },
  { name: "Upholstery Cleaning", category: "Cleaning" },
  { name: "Window Cleaning", category: "Cleaning" },
  { name: "Post-Construction Cleaning", category: "Cleaning" },

  { name: "Lawn Care", category: "Outdoor Services" },
  { name: "Landscaping", category: "Outdoor Services" },
  { name: "Tree Trimming", category: "Outdoor Services" },
  { name: "Leaf Removal", category: "Outdoor Services" },
  { name: "Snow Removal", category: "Outdoor Services" },
  { name: "Fence Installation", category: "Outdoor Services" },
  { name: "Deck Repair", category: "Outdoor Services" },
  { name: "Pool Cleaning", category: "Outdoor Services" },
  { name: "Junk Removal", category: "Outdoor Services" },

  { name: "Dog Walking", category: "Pet Services" },
  { name: "Pet Sitting", category: "Pet Services" },
  { name: "Dog Sitting", category: "Pet Services" },
  { name: "Cat Sitting", category: "Pet Services" },
  { name: "Pet Boarding", category: "Pet Services" },
  { name: "Dog Training", category: "Pet Services" },
  { name: "Pet Grooming", category: "Pet Services" },
  { name: "Pet Waste Cleanup", category: "Pet Services" },

  { name: "Bartender", category: "Events" },
  { name: "Event Planning", category: "Events" },
  { name: "Wedding Planning", category: "Events" },
  { name: "Party Planning", category: "Events" },
  { name: "Event Setup", category: "Events" },
  { name: "Event Cleanup", category: "Events" },
  { name: "Server", category: "Events" },
  { name: "Catering", category: "Events" },
  { name: "Private Chef", category: "Events" },
  { name: "DJ", category: "Events" },
  { name: "MC / Host", category: "Events" },
  { name: "Event Decorator", category: "Events" },
  { name: "Balloon Decor", category: "Events" },
  { name: "Wedding Decor", category: "Events" },
  { name: "Photography", category: "Events" },
  { name: "Videography", category: "Events" },
  { name: "Photo Booth", category: "Events" },

  { name: "Moving", category: "Moving & Labor" },
  { name: "Loading Help", category: "Moving & Labor" },
  { name: "Unloading Help", category: "Moving & Labor" },
  { name: "Packing Help", category: "Moving & Labor" },
  { name: "Delivery Help", category: "Moving & Labor" },
  { name: "General Labor", category: "Moving & Labor" },
  { name: "Furniture Moving", category: "Moving & Labor" },
  { name: "Hauling", category: "Moving & Labor" },

  { name: "Mobile Car Wash", category: "Automotive" },
  { name: "Car Detailing", category: "Automotive" },
  { name: "Mobile Detailing", category: "Automotive" },
  { name: "Mobile Mechanic", category: "Automotive" },
  { name: "Oil Change", category: "Automotive" },
  { name: "Battery Replacement", category: "Automotive" },
  { name: "Brake Service", category: "Automotive" },
  { name: "Tire Change", category: "Automotive" },
  { name: "Roadside Assistance", category: "Automotive" },
  { name: "Window Tinting", category: "Automotive" },

  { name: "Hair Stylist", category: "Beauty & Personal Care" },
  { name: "Barber", category: "Beauty & Personal Care" },
  { name: "Makeup Artist", category: "Beauty & Personal Care" },
  { name: "Nail Technician", category: "Beauty & Personal Care" },
  { name: "Braiding", category: "Beauty & Personal Care" },
  { name: "Massage", category: "Beauty & Personal Care" },
  { name: "Personal Trainer", category: "Beauty & Personal Care" },

  { name: "Tutoring", category: "Education" },
  { name: "Math Tutoring", category: "Education" },
  { name: "English Tutoring", category: "Education" },
  { name: "Spanish Tutoring", category: "Education" },
  { name: "Music Lessons", category: "Education" },
  { name: "Computer Lessons", category: "Education" },

  { name: "Babysitting", category: "Care Services" },
  { name: "Childcare", category: "Care Services" },
  { name: "Senior Companion", category: "Care Services" },
  { name: "Errand Running", category: "Care Services" },
  { name: "Personal Assistant", category: "Care Services" },

  { name: "Graphic Design", category: "Creative & Business" },
  { name: "Logo Design", category: "Creative & Business" },
  { name: "Website Design", category: "Creative & Business" },
  { name: "Social Media Help", category: "Creative & Business" },
  { name: "Content Creation", category: "Creative & Business" },
  { name: "Resume Writing", category: "Creative & Business" },
  { name: "Translation", category: "Creative & Business" },
  { name: "Bookkeeping", category: "Creative & Business" }
];

function getCheckedValues(name) {
  return [
    ...document.querySelectorAll(
      `input[name="${name}"]:checked`
    )
  ].map(
    (input) => input.value
  );
}

function renderSelectedServices() {
  selectedServicesContainer.innerHTML = "";

  if (selectedServices.length === 0) {
    selectedServicesContainer.innerHTML = `
      <span class="no-services-selected">
        No services selected yet.
      </span>
    `;

    return;
  }

  selectedServices.forEach(
    (service) => {
      const tag =
        document.createElement("span");

      tag.className =
        "service-tag";

      tag.innerHTML = `
        ${service}
        <button
          type="button"
          aria-label="Remove ${service}"
        >
          ×
        </button>
      `;

      tag
        .querySelector("button")
        .addEventListener(
          "click",
          () => {
            const index =
              selectedServices.indexOf(
                service
              );

            if (index !== -1) {
              selectedServices.splice(
                index,
                1
              );
            }

            renderSelectedServices();
            renderServiceResults(
              serviceSearch.value
            );
          }
        );

      selectedServicesContainer.appendChild(
        tag
      );
    }
  );
}

function renderServiceResults(searchTerm) {
  const term =
    searchTerm
      .trim()
      .toLowerCase();

  if (!term) {
    serviceSearchResults.classList.add(
      "hidden"
    );

    serviceSearchResults.innerHTML = "";

    return;
  }

  const matches =
    serviceCatalog.filter(
      (service) =>
        !selectedServices.includes(
          service.name
        ) &&
        (
          service.name
            .toLowerCase()
            .includes(term) ||
          service.category
            .toLowerCase()
            .includes(term)
        )
    );

  serviceSearchResults.innerHTML = "";

  if (matches.length === 0) {
    serviceSearchResults.innerHTML = `
      <div class="no-service-results">
        No matching services found.
      </div>
    `;

    serviceSearchResults.classList.remove(
      "hidden"
    );

    return;
  }

  matches
    .slice(0, 20)
    .forEach(
      (service) => {
        const button =
          document.createElement(
            "button"
          );

        button.type = "button";

        button.className =
          "service-result";

        button.innerHTML = `
          <strong>
            ${service.name}
          </strong>

          <span
            class="service-result-category"
          >
            ${service.category}
          </span>
        `;

        button.addEventListener(
          "click",
          () => {
            if (
              !selectedServices.includes(
                service.name
              )
            ) {
              selectedServices.push(
                service.name
              );
            }

            serviceSearch.value = "";

            serviceSearchResults.classList.add(
              "hidden"
            );

            renderSelectedServices();

            serviceSearch.focus();
          }
        );

        serviceSearchResults.appendChild(
          button
        );
      }
    );

  serviceSearchResults.classList.remove(
    "hidden"
  );
}

serviceSearch?.addEventListener(
  "input",
  () => {
    renderServiceResults(
      serviceSearch.value
    );
  }
);

serviceSearch?.addEventListener(
  "focus",
  () => {
    if (
      serviceSearch.value.trim()
    ) {
      renderServiceResults(
        serviceSearch.value
      );
    }
  }
);

document.addEventListener(
  "click",
  (event) => {
    if (
      !event.target.closest(
        ".service-picker"
      )
    ) {
      serviceSearchResults?.classList.add(
        "hidden"
      );
    }
  }
);

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

    if (
      selectedServices.length === 0
    ) {
      alert(
        "Please select at least one service."
      );

      return;
    }

    if (
      serviceAreas.length === 0
    ) {
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
        [...selectedServices],

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

renderSelectedServices();