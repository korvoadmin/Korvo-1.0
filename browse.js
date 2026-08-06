"use strict";

/*
  Korvo Browse Professionals

  Temporary professional data.
  Later, this information can come from Firebase,
  Supabase, or another Korvo database.
*/

/* =========================
   Professional Data
   ========================= */

const professionals = [
  {
    id: 1,
    name: "Chris Custom Installations",
    initials: "CC",
    category: "Window Treatment Specialist",
    service: "window-treatments",
    city: "Atlanta",
    state: "GA",
    rating: 5.0,
    reviews: 48,
    price: 95,
    priceUnit: "per hour",
    experience: 4,
    verified: true,
    backgroundChecked: true,
    available: true,
    featured: true,
    online: true,

    /* Chris has a completed profile page */
    profilePage: "chris-profile.html",

    description:
      "Professional installation of drapery, blinds, shutters, motorized shades and custom window treatment systems.",

    services: [
      "Motorized Shades",
      "Drapery",
      "Blinds",
      "Shutters"
    ],

    trustBadges: [
      "Identity Verified",
      "Background Checked",
      "Experienced"
    ],

    avatarStart: "#237ed6",
    avatarEnd: "#20b978"
  },

  {
    id: 2,
    name: "Prestige Estate Cleaning",
    initials: "PE",
    category: "Residential Cleaning Service",
    service: "cleaning",
    city: "Buckhead",
    state: "GA",
    rating: 4.9,
    reviews: 36,
    price: 75,
    priceUnit: "starting price",
    experience: 6,
    verified: true,
    backgroundChecked: true,
    available: true,
    featured: false,
    online: true,

    /* Profile has not been built yet */
    profilePage: "#",

    description:
      "Detailed cleaning services for homes, estates and luxury properties throughout the Atlanta area.",

    services: [
      "Deep Cleaning",
      "Standard Cleaning",
      "Move-In Cleaning",
      "Laundry"
    ],

    trustBadges: [
      "Identity Verified",
      "Background Checked"
    ],

    avatarStart: "#0f9d80",
    avatarEnd: "#08644f"
  },

  {
    id: 3,
    name: "Greenline Outdoor Solutions",
    initials: "GO",
    category: "Landscaping and Lawn Care",
    service: "landscaping",
    city: "Chamblee",
    state: "GA",
    rating: 4.8,
    reviews: 72,
    price: 60,
    priceUnit: "starting price",
    experience: 8,
    verified: true,
    backgroundChecked: false,
    available: true,
    featured: false,
    online: false,

    profilePage: "#",

    description:
      "Reliable lawn maintenance, landscape improvements and seasonal outdoor property services.",

    services: [
      "Lawn Care",
      "Mulching",
      "Cleanup",
      "Landscaping"
    ],

    trustBadges: [
      "Identity Verified",
      "Top Rated"
    ],

    avatarStart: "#42a65a",
    avatarEnd: "#246a33"
  },

  {
    id: 4,
    name: "Metro Home Repair",
    initials: "MH",
    category: "Handyman and Home Repair",
    service: "handyman",
    city: "Dunwoody",
    state: "GA",
    rating: 4.7,
    reviews: 29,
    price: 85,
    priceUnit: "per hour",
    experience: 10,
    verified: true,
    backgroundChecked: true,
    available: false,
    featured: false,
    online: false,

    profilePage: "#",

    description:
      "General home repairs, furniture assembly, fixture installation and property maintenance.",

    services: [
      "Home Repairs",
      "Assembly",
      "Mounting",
      "Fixtures"
    ],

    trustBadges: [
      "Identity Verified",
      "Background Checked",
      "10 Years Experience"
    ],

    avatarStart: "#db7c31",
    avatarEnd: "#9a4114"
  },

  {
    id: 5,
    name: "Northside Premier Painting",
    initials: "NP",
    category: "Interior and Exterior Painting",
    service: "painting",
    city: "Sandy Springs",
    state: "GA",
    rating: 4.6,
    reviews: 54,
    price: 100,
    priceUnit: "starting price",
    experience: 7,
    verified: false,
    backgroundChecked: false,
    available: true,
    featured: false,
    online: true,

    profilePage: "#",

    description:
      "Clean, professional painting for residential interiors, exteriors and home improvement projects.",

    services: [
      "Interior Painting",
      "Exterior Painting",
      "Trim",
      "Touch-Ups"
    ],

    trustBadges: [
      "7 Years Experience"
    ],

    avatarStart: "#4278c7",
    avatarEnd: "#22477e"
  },

  {
    id: 6,
    name: "BrightPath Electrical",
    initials: "BE",
    category: "Residential Electrical Services",
    service: "electrical",
    city: "Marietta",
    state: "GA",
    rating: 4.9,
    reviews: 91,
    price: 125,
    priceUnit: "service call",
    experience: 12,
    verified: true,
    backgroundChecked: true,
    available: false,
    featured: true,
    online: false,

    profilePage: "#",

    description:
      "Residential electrical troubleshooting, lighting installation, outlets and smart-home upgrades.",

    services: [
      "Lighting",
      "Outlets",
      "Troubleshooting",
      "Smart Home"
    ],

    trustBadges: [
      "Identity Verified",
      "Background Checked",
      "Licensed"
    ],

    avatarStart: "#e7a915",
    avatarEnd: "#a16e00"
  }
];

/* =========================
   Page Elements
   ========================= */

const professionalsGrid = document.getElementById(
  "professionalsGrid"
);

const resultsCount = document.getElementById(
  "resultsCount"
);

const emptyState = document.getElementById(
  "emptyState"
);

const activeFilters = document.getElementById(
  "activeFilters"
);

const heroSearchForm = document.getElementById(
  "heroSearchForm"
);

const heroService = document.getElementById(
  "heroService"
);

const heroLocation = document.getElementById(
  "heroLocation"
);

const serviceFilter = document.getElementById(
  "serviceFilter"
);

const locationFilter = document.getElementById(
  "locationFilter"
);

const ratingFilter = document.getElementById(
  "ratingFilter"
);

const priceFilter = document.getElementById(
  "priceFilter"
);

const sortFilter = document.getElementById(
  "sortFilter"
);

const verifiedFilter = document.getElementById(
  "verifiedFilter"
);

const backgroundFilter = document.getElementById(
  "backgroundFilter"
);

const availableFilter = document.getElementById(
  "availableFilter"
);

const clearFiltersButton = document.getElementById(
  "clearFilters"
);

const emptyClearButton = document.getElementById(
  "emptyClearButton"
);

const filterToggle = document.getElementById(
  "filterToggle"
);

const filtersPanel = document.getElementById(
  "filtersPanel"
);

const mobileMenuButton = document.getElementById(
  "mobileMenuButton"
);

const mobileNav = document.getElementById(
  "mobileNav"
);

const currentYear = document.getElementById(
  "currentYear"
);

/* =========================
   Utility Functions
   ========================= */

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function createStarDisplay(rating) {
  const roundedRating = Math.round(rating);

  return (
    "★".repeat(roundedRating) +
    "☆".repeat(5 - roundedRating)
  );
}

function formatServiceName(service) {
  const serviceNames = {
    "window-treatments": "Window Treatments",
    cleaning: "House Cleaning",
    landscaping: "Landscaping",
    handyman: "Handyman",
    painting: "Painting",
    electrical: "Electrical"
  };

  return serviceNames[service] || service;
}

/* =========================
   Professional Card Creation
   ========================= */

function createProfessionalCard(professional) {
  const card = document.createElement("article");

  card.className = professional.featured
    ? "professional-card featured-card"
    : "professional-card";

  card.dataset.professionalId = String(professional.id);

  const verifiedBadge = professional.verified
    ? `
      <span
        class="verified-badge"
        title="Verified professional"
        aria-label="Verified professional"
      >
        ✓
      </span>
    `
    : "";

  const onlineDot = professional.online
    ? `
      <span
        class="online-dot"
        title="Recently active"
        aria-label="Recently active"
      ></span>
    `
    : "";

  const serviceTags = professional.services
    .map(
      (service) => `
        <span class="service-tag">
          ${service}
        </span>
      `
    )
    .join("");

  const trustBadges = professional.trustBadges
    .map(
      (badge) => `
        <span class="trust-badge">
          ${badge}
        </span>
      `
    )
    .join("");

  /*
    Chris has a real profile page.

    Other professionals use "#" until their
    profile pages are created.
  */

  const profileLink =
    professional.profilePage === "#"
      ? `href="#" data-coming-soon="true"`
      : `href="${professional.profilePage}"`;

  card.innerHTML = `
    <div class="avatar-wrap">
      <div
        class="professional-avatar"
        style="
          --avatar-start: ${professional.avatarStart};
          --avatar-end: ${professional.avatarEnd};
        "
      >
        ${professional.initials}
      </div>

      ${onlineDot}
    </div>

    <div class="professional-main">
      <div class="card-primary-info">
        <div class="name-row">
          <h3 class="professional-name">
            ${professional.name}
          </h3>

          ${verifiedBadge}
        </div>

        <p class="professional-category">
          ${professional.category}
        </p>

        <div class="rating-row">
          <span
            class="stars"
            aria-label="${professional.rating} out of 5 stars"
          >
            ${createStarDisplay(professional.rating)}
          </span>

          <span class="rating-number">
            ${professional.rating.toFixed(1)}
          </span>

          <span class="review-count">
            (${professional.reviews} reviews)
          </span>

          <span class="dot-divider">
            •
          </span>

          <span class="location-text">
            ${professional.city}, ${professional.state}
          </span>
        </div>
      </div>

      <div class="professional-details">
        <p class="professional-description">
          ${professional.description}
        </p>

        <div class="service-tags">
          ${serviceTags}
        </div>

        <div class="trust-badges">
          ${trustBadges}
        </div>
      </div>
    </div>

    <div class="professional-side">
      <div class="pricing-block">
        <p class="starting-label">
          Starting at
        </p>

        <p class="price">
          $${professional.price}
        </p>

        <p class="price-unit">
          ${professional.priceUnit}
        </p>

        <p class="availability">
          ${
            professional.available
              ? "Available this week"
              : "Limited availability"
          }
        </p>
      </div>

      <a
        class="profile-button"
        ${profileLink}
        data-professional="${professional.name}"
      >
        View Profile
      </a>

      <a
        href="post-a-job.html"
        class="quote-button"
        data-professional="${professional.name}"
      >
        Request Quote
      </a>
    </div>
  `;

  return card;
}

/* =========================
   Filtering
   ========================= */

function getFilteredProfessionals() {
  const selectedService = serviceFilter.value;

  const selectedLocation = normalizeText(
    locationFilter.value
  );

  const selectedRating = Number(
    ratingFilter.value
  );

  const selectedPrice = Number(
    priceFilter.value
  );

  const searchText = normalizeText(
    heroService.value
  );

  let filteredProfessionals = professionals.filter(
    (professional) => {
      const searchableText = normalizeText(
        [
          professional.name,
          professional.category,
          professional.description,
          professional.city,
          professional.state,
          ...professional.services
        ].join(" ")
      );

      const matchesSearch =
        !searchText ||
        searchableText.includes(searchText);

      const matchesService =
        selectedService === "all" ||
        professional.service === selectedService;

      const professionalLocation = normalizeText(
        `${professional.city} ${professional.state}`
      );

      const matchesLocation =
        !selectedLocation ||
        professionalLocation.includes(selectedLocation);

      const matchesRating =
        professional.rating >= selectedRating;

      const matchesPrice =
        professional.price <= selectedPrice;

      const matchesVerified =
        !verifiedFilter.checked ||
        professional.verified;

      const matchesBackground =
        !backgroundFilter.checked ||
        professional.backgroundChecked;

      const matchesAvailability =
        !availableFilter.checked ||
        professional.available;

      return (
        matchesSearch &&
        matchesService &&
        matchesLocation &&
        matchesRating &&
        matchesPrice &&
        matchesVerified &&
        matchesBackground &&
        matchesAvailability
      );
    }
  );

  filteredProfessionals = sortProfessionals(
    filteredProfessionals
  );

  return filteredProfessionals;
}

/* =========================
   Sorting
   ========================= */

function sortProfessionals(list) {
  const sortedProfessionals = [...list];

  switch (sortFilter.value) {
    case "rating-high":
      sortedProfessionals.sort(
        (a, b) => b.rating - a.rating
      );
      break;

    case "reviews-high":
      sortedProfessionals.sort(
        (a, b) => b.reviews - a.reviews
      );
      break;

    case "price-low":
      sortedProfessionals.sort(
        (a, b) => a.price - b.price
      );
      break;

    case "experience-high":
      sortedProfessionals.sort(
        (a, b) => b.experience - a.experience
      );
      break;

    default:
      sortedProfessionals.sort((a, b) => {
        if (a.featured !== b.featured) {
          return (
            Number(b.featured) -
            Number(a.featured)
          );
        }

        return b.rating - a.rating;
      });
  }

  return sortedProfessionals;
}

/* =========================
   Active Filter Labels
   ========================= */

function updateActiveFilters() {
  const filters = [];

  if (heroService.value.trim()) {
    filters.push(
      `Search: ${heroService.value.trim()}`
    );
  }

  if (serviceFilter.value !== "all") {
    filters.push(
      formatServiceName(serviceFilter.value)
    );
  }

  if (locationFilter.value.trim()) {
    filters.push(
      `Location: ${locationFilter.value.trim()}`
    );
  }

  if (Number(ratingFilter.value) > 0) {
    filters.push(
      `${ratingFilter.value}+ rating`
    );
  }

  if (Number(priceFilter.value) < 9999) {
    filters.push(
      `Up to $${priceFilter.value}`
    );
  }

  if (verifiedFilter.checked) {
    filters.push("Verified");
  }

  if (backgroundFilter.checked) {
    filters.push("Background checked");
  }

  if (availableFilter.checked) {
    filters.push("Available this week");
  }

  activeFilters.innerHTML = filters
    .map(
      (filter) => `
        <span class="active-filter-chip">
          ${filter}
        </span>
      `
    )
    .join("");
}

/* =========================
   Render Professionals
   ========================= */

function renderProfessionals() {
  const filteredProfessionals =
    getFilteredProfessionals();

  professionalsGrid.innerHTML = "";

  filteredProfessionals.forEach(
    (professional) => {
      const professionalCard =
        createProfessionalCard(professional);

      professionalsGrid.appendChild(
        professionalCard
      );
    }
  );

  resultsCount.textContent =
    filteredProfessionals.length;

  const hasNoResults =
    filteredProfessionals.length === 0;

  emptyState.classList.toggle(
    "hidden",
    !hasNoResults
  );

  professionalsGrid.classList.toggle(
    "hidden",
    hasNoResults
  );

  updateActiveFilters();
  attachCardEvents();
}

/* =========================
   Clear Filters
   ========================= */

function clearAllFilters() {
  heroService.value = "";
  heroLocation.value = "";

  serviceFilter.value = "all";
  locationFilter.value = "";
  ratingFilter.value = "0";
  priceFilter.value = "9999";
  sortFilter.value = "recommended";

  verifiedFilter.checked = false;
  backgroundFilter.checked = false;
  availableFilter.checked = false;

  renderProfessionals();
}

/* =========================
   Card Events
   ========================= */

function attachCardEvents() {
  const comingSoonLinks =
    document.querySelectorAll(
      '[data-coming-soon="true"]'
    );

  comingSoonLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const professionalName =
        link.dataset.professional ||
        "This professional";

      alert(
        `${professionalName}'s full profile is coming soon. Chris Custom Installations already has a working profile page.`
      );
    });
  });

  const quoteButtons =
    document.querySelectorAll(".quote-button");

  quoteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const professionalName =
        button.dataset.professional || "";

      try {
        localStorage.setItem(
          "korvoSelectedProfessional",
          professionalName
        );
      } catch (error) {
        console.error(
          "Unable to save selected professional:",
          error
        );
      }
    });
  });
}

/* =========================
   Hero Search Form
   ========================= */

heroSearchForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    locationFilter.value =
      heroLocation.value.trim();

    renderProfessionals();

    document
      .querySelector(".marketplace-section")
      .scrollIntoView({
        behavior: "smooth"
      });
  }
);

/* =========================
   Popular Search Buttons
   ========================= */

document
  .querySelectorAll(".popular-chip")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const serviceName =
        button.textContent.trim();

      heroService.value = serviceName;

      const serviceMap = {
        "Window Treatments":
          "window-treatments",

        "House Cleaning":
          "cleaning",

        Landscaping:
          "landscaping",

        Handyman:
          "handyman"
      };

      serviceFilter.value =
        serviceMap[serviceName] || "all";

      renderProfessionals();

      document
        .querySelector(".marketplace-section")
        .scrollIntoView({
          behavior: "smooth"
        });
    });
  });

/* =========================
   Filter Events
   ========================= */

[
  serviceFilter,
  ratingFilter,
  priceFilter,
  sortFilter,
  verifiedFilter,
  backgroundFilter,
  availableFilter
].forEach((element) => {
  element.addEventListener(
    "change",
    renderProfessionals
  );
});

locationFilter.addEventListener(
  "input",
  renderProfessionals
);

heroService.addEventListener(
  "input",
  renderProfessionals
);

clearFiltersButton.addEventListener(
  "click",
  clearAllFilters
);

emptyClearButton.addEventListener(
  "click",
  clearAllFilters
);

/* =========================
   Mobile Filter Panel
   ========================= */

filterToggle.addEventListener("click", () => {
  filtersPanel.classList.toggle("open");

  const isOpen =
    filtersPanel.classList.contains("open");

  filterToggle.textContent = isOpen
    ? "Close Filters"
    : "Filters";
});

/* =========================
   Mobile Navigation
   ========================= */

mobileMenuButton.addEventListener(
  "click",
  () => {
    mobileNav.classList.toggle("open");

    const isOpen =
      mobileNav.classList.contains("open");

    mobileMenuButton.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    mobileMenuButton.textContent =
      isOpen ? "×" : "☰";
  }
);

mobileNav
  .querySelectorAll("a")
  .forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("open");

      mobileMenuButton.setAttribute(
        "aria-expanded",
        "false"
      );

      mobileMenuButton.textContent = "☰";
    });
  });

/* =========================
   Footer Year
   ========================= */

if (currentYear) {
  currentYear.textContent =
    new Date().getFullYear();
}

/* =========================
   Initial Page Load
   ========================= */

renderProfessionals();