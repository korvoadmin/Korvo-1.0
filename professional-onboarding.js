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
const suggestServiceButton =
  document.getElementById(
    "suggestServiceButton"
  );

const customServiceForm =
  document.getElementById(
    "customServiceForm"
  );

const customServiceInput =
  document.getElementById(
    "customServiceInput"
  );

const addCustomServiceButton =
  document.getElementById(
    "addCustomServiceButton"
  );
const selectedServices = [];

const serviceCatalog = [

  // =========================
  // Handyman & Home Help
  // =========================

  { name: "Handyman", category: "Handyman & Home" },
  { name: "Furniture Assembly", category: "Handyman & Home" },
  { name: "IKEA Furniture Assembly", category: "Handyman & Home" },
  { name: "TV Mounting", category: "Handyman & Home" },
  { name: "Shelf Installation", category: "Handyman & Home" },
  { name: "Picture Hanging", category: "Handyman & Home" },
  { name: "Mirror Installation", category: "Handyman & Home" },
  { name: "Curtain Installation", category: "Handyman & Home" },
  { name: "Curtain Rod Installation", category: "Handyman & Home" },
  { name: "Blind Installation", category: "Handyman & Home" },
  { name: "Window Treatment Installation", category: "Handyman & Home" },
  { name: "Door Repair", category: "Handyman & Home" },
  { name: "Door Installation", category: "Handyman & Home" },
  { name: "Interior Door Installation", category: "Handyman & Home" },
  { name: "Screen Door Repair", category: "Handyman & Home" },
  { name: "Cabinet Hardware Installation", category: "Handyman & Home" },
  { name: "Cabinet Installation", category: "Handyman & Home" },
  { name: "Minor Home Repairs", category: "Handyman & Home" },
  { name: "Caulking", category: "Handyman & Home" },
  { name: "Weatherstripping", category: "Handyman & Home" },
  { name: "Childproofing", category: "Handyman & Home" },
  { name: "Home Organization", category: "Handyman & Home" },
  { name: "Closet Organization", category: "Handyman & Home" },
  { name: "Garage Organization", category: "Handyman & Home" },

  // =========================
  // Painting & Walls
  // =========================

  { name: "Interior Painting", category: "Painting & Walls" },
  { name: "Exterior Painting", category: "Painting & Walls" },
  { name: "Room Painting", category: "Painting & Walls" },
  { name: "Accent Wall Painting", category: "Painting & Walls" },
  { name: "Cabinet Painting", category: "Painting & Walls" },
  { name: "Fence Painting", category: "Painting & Walls" },
  { name: "Deck Painting", category: "Painting & Walls" },
  { name: "Drywall Repair", category: "Painting & Walls" },
  { name: "Drywall Patching", category: "Painting & Walls" },
  { name: "Hole Repair", category: "Painting & Walls" },
  { name: "Wallpaper Installation", category: "Painting & Walls" },
  { name: "Wallpaper Removal", category: "Painting & Walls" },

  // =========================
  // Cleaning
  // =========================

  { name: "Home Cleaning", category: "Cleaning" },
  { name: "House Cleaning", category: "Cleaning" },
  { name: "Apartment Cleaning", category: "Cleaning" },
  { name: "Deep Cleaning", category: "Cleaning" },
  { name: "Move-In Cleaning", category: "Cleaning" },
  { name: "Move-Out Cleaning", category: "Cleaning" },
  { name: "Airbnb Cleaning", category: "Cleaning" },
  { name: "Vacation Rental Cleaning", category: "Cleaning" },
  { name: "Office Cleaning", category: "Cleaning" },
  { name: "Kitchen Cleaning", category: "Cleaning" },
  { name: "Bathroom Cleaning", category: "Cleaning" },
  { name: "Garage Cleaning", category: "Cleaning" },
  { name: "Post-Construction Cleaning", category: "Cleaning" },
  { name: "Window Cleaning", category: "Cleaning" },
  { name: "Carpet Cleaning", category: "Cleaning" },
  { name: "Rug Cleaning", category: "Cleaning" },
  { name: "Upholstery Cleaning", category: "Cleaning" },
  { name: "Couch Cleaning", category: "Cleaning" },
  { name: "Mattress Cleaning", category: "Cleaning" },
  { name: "Pressure Washing", category: "Cleaning" },
  { name: "Driveway Cleaning", category: "Cleaning" },
  { name: "Patio Cleaning", category: "Cleaning" },
  { name: "Trash Bin Cleaning", category: "Cleaning" },

  // =========================
  // Lawn & Outdoor
  // =========================

  { name: "Lawn Mowing", category: "Lawn & Outdoor" },
  { name: "Lawn Care", category: "Lawn & Outdoor" },
  { name: "Landscaping", category: "Lawn & Outdoor" },
  { name: "Weed Removal", category: "Lawn & Outdoor" },
  { name: "Leaf Removal", category: "Lawn & Outdoor" },
  { name: "Yard Cleanup", category: "Lawn & Outdoor" },
  { name: "Bush Trimming", category: "Lawn & Outdoor" },
  { name: "Hedge Trimming", category: "Lawn & Outdoor" },
  { name: "Small Tree Trimming", category: "Lawn & Outdoor" },
  { name: "Mulching", category: "Lawn & Outdoor" },
  { name: "Garden Help", category: "Lawn & Outdoor" },
  { name: "Planting", category: "Lawn & Outdoor" },
  { name: "Flower Bed Maintenance", category: "Lawn & Outdoor" },
  { name: "Gutter Cleaning", category: "Lawn & Outdoor" },
  { name: "Fence Repair", category: "Lawn & Outdoor" },
  { name: "Deck Cleaning", category: "Lawn & Outdoor" },
  { name: "Deck Staining", category: "Lawn & Outdoor" },
  { name: "Pool Cleaning", category: "Lawn & Outdoor" },
  { name: "Junk Removal", category: "Lawn & Outdoor" },
  { name: "Brush Removal", category: "Lawn & Outdoor" },

  // =========================
  // Moving & Muscle
  // =========================

  { name: "Moving Help", category: "Moving & Labor" },
  { name: "Local Moving", category: "Moving & Labor" },
  { name: "Furniture Moving", category: "Moving & Labor" },
  { name: "Loading Help", category: "Moving & Labor" },
  { name: "Unloading Help", category: "Moving & Labor" },
  { name: "Packing Help", category: "Moving & Labor" },
  { name: "Unpacking Help", category: "Moving & Labor" },
  { name: "Heavy Lifting", category: "Moving & Labor" },
  { name: "General Labor", category: "Moving & Labor" },
  { name: "Garage Cleanout", category: "Moving & Labor" },
  { name: "Basement Cleanout", category: "Moving & Labor" },
  { name: "Storage Unit Cleanout", category: "Moving & Labor" },
  { name: "Junk Hauling", category: "Moving & Labor" },
  { name: "Furniture Delivery", category: "Moving & Labor" },
  { name: "Appliance Moving", category: "Moving & Labor" },

  // =========================
  // Delivery & Errands
  // =========================

  { name: "Local Delivery", category: "Delivery & Errands" },
  { name: "Package Delivery", category: "Delivery & Errands" },
  { name: "Furniture Pickup", category: "Delivery & Errands" },
  { name: "Store Pickup", category: "Delivery & Errands" },
  { name: "Grocery Shopping", category: "Delivery & Errands" },
  { name: "Grocery Delivery", category: "Delivery & Errands" },
  { name: "Errand Running", category: "Delivery & Errands" },
  { name: "Personal Shopper", category: "Delivery & Errands" },
  { name: "Prescription Pickup", category: "Delivery & Errands" },
  { name: "Courier Service", category: "Delivery & Errands" },

  // =========================
  // Pet Services
  // =========================

  { name: "Dog Walking", category: "Pet Services" },
  { name: "Pet Sitting", category: "Pet Services" },
  { name: "Dog Sitting", category: "Pet Services" },
  { name: "Cat Sitting", category: "Pet Services" },
  { name: "House & Pet Sitting", category: "Pet Services" },
  { name: "Pet Feeding", category: "Pet Services" },
  { name: "Pet Boarding", category: "Pet Services" },
  { name: "Dog Boarding", category: "Pet Services" },
  { name: "Dog Training", category: "Pet Services" },
  { name: "Basic Puppy Training", category: "Pet Services" },
  { name: "Pet Grooming", category: "Pet Services" },
  { name: "Dog Grooming", category: "Pet Services" },
  { name: "Mobile Pet Grooming", category: "Pet Services" },
  { name: "Pet Waste Cleanup", category: "Pet Services" },
  { name: "Pet Transportation", category: "Pet Services" },

  // =========================
  // Events & Parties
  // =========================

  { name: "Bartender", category: "Events & Parties" },
  { name: "Mobile Bartender", category: "Events & Parties" },
  { name: "Event Planning", category: "Events & Parties" },
  { name: "Party Planning", category: "Events & Parties" },
  { name: "Wedding Planning", category: "Events & Parties" },
  { name: "Wedding Coordinator", category: "Events & Parties" },
  { name: "Day-Of Wedding Coordinator", category: "Events & Parties" },
  { name: "Birthday Party Setup", category: "Events & Parties" },
  { name: "Event Setup", category: "Events & Parties" },
  { name: "Event Cleanup", category: "Events & Parties" },
  { name: "Event Staff", category: "Events & Parties" },
  { name: "Waitstaff", category: "Events & Parties" },
  { name: "Server", category: "Events & Parties" },
  { name: "Party Host", category: "Events & Parties" },
  { name: "MC / Host", category: "Events & Parties" },
  { name: "DJ", category: "Events & Parties" },
  { name: "Karaoke Host", category: "Events & Parties" },
  { name: "Live Music", category: "Events & Parties" },
  { name: "Party Decorator", category: "Events & Parties" },
  { name: "Event Decorator", category: "Events & Parties" },
  { name: "Balloon Decor", category: "Events & Parties" },
  { name: "Balloon Artist", category: "Events & Parties" },
  { name: "Backdrop Setup", category: "Events & Parties" },
  { name: "Table & Chair Setup", category: "Events & Parties" },
  { name: "Photo Booth Attendant", category: "Events & Parties" },
  { name: "Face Painting", category: "Events & Parties" },
  { name: "Party Cleanup", category: "Events & Parties" },

  // =========================
  // Food & Hospitality
  // =========================

  { name: "Catering", category: "Food & Hospitality" },
  { name: "Catering Assistant", category: "Food & Hospitality" },
  { name: "Private Chef", category: "Food & Hospitality" },
  { name: "Personal Chef", category: "Food & Hospitality" },
  { name: "Meal Prep", category: "Food & Hospitality" },
  { name: "Party Food Preparation", category: "Food & Hospitality" },
  { name: "Cake Decorating", category: "Food & Hospitality" },
  { name: "Baking", category: "Food & Hospitality" },
  { name: "Dessert Catering", category: "Food & Hospitality" },
  { name: "BBQ Catering", category: "Food & Hospitality" },
  { name: "Bartending Assistant", category: "Food & Hospitality" },

  // =========================
  // Photography & Creative
  // =========================

  { name: "Photography", category: "Photography & Creative" },
  { name: "Portrait Photography", category: "Photography & Creative" },
  { name: "Family Photography", category: "Photography & Creative" },
  { name: "Event Photography", category: "Photography & Creative" },
  { name: "Wedding Photography", category: "Photography & Creative" },
  { name: "Real Estate Photography", category: "Photography & Creative" },
  { name: "Product Photography", category: "Photography & Creative" },
  { name: "Car Photography", category: "Photography & Creative" },
  { name: "Videography", category: "Photography & Creative" },
  { name: "Video Editing", category: "Photography & Creative" },
  { name: "Drone Photography", category: "Photography & Creative" },
  { name: "Content Creation", category: "Photography & Creative" },
  { name: "Graphic Design", category: "Photography & Creative" },
  { name: "Flyer Design", category: "Photography & Creative" },
  { name: "Logo Design", category: "Photography & Creative" },

  // =========================
  // Automotive
  // =========================

  { name: "Mobile Car Wash", category: "Automotive" },
  { name: "Car Detailing", category: "Automotive" },
  { name: "Mobile Detailing", category: "Automotive" },
  { name: "Interior Car Cleaning", category: "Automotive" },
  { name: "Headlight Restoration", category: "Automotive" },
  { name: "Mobile Mechanic", category: "Automotive" },
  { name: "Oil Change", category: "Automotive" },
  { name: "Battery Replacement", category: "Automotive" },
  { name: "Battery Jump Start", category: "Automotive" },
  { name: "Brake Pad Replacement", category: "Automotive" },
  { name: "Tire Change", category: "Automotive" },
  { name: "Flat Tire Help", category: "Automotive" },
  { name: "Mobile Tire Service", category: "Automotive" },
  { name: "Roadside Assistance", category: "Automotive" },
  { name: "Car Audio Installation", category: "Automotive" },
  { name: "Dash Cam Installation", category: "Automotive" },
  { name: "Window Tinting", category: "Automotive" },
  { name: "Vehicle Wrap Installation", category: "Automotive" },

  // =========================
  // Beauty & Grooming
  // =========================

  { name: "Barber", category: "Beauty & Grooming" },
  { name: "Mobile Barber", category: "Beauty & Grooming" },
  { name: "Hair Stylist", category: "Beauty & Grooming" },
  { name: "Braiding", category: "Beauty & Grooming" },
  { name: "Loc Maintenance", category: "Beauty & Grooming" },
  { name: "Hair Extensions", category: "Beauty & Grooming" },
  { name: "Makeup Artist", category: "Beauty & Grooming" },
  { name: "Wedding Makeup", category: "Beauty & Grooming" },
  { name: "Nail Technician", category: "Beauty & Grooming" },
  { name: "Mobile Nail Technician", category: "Beauty & Grooming" },
  { name: "Lash Technician", category: "Beauty & Grooming" },
  { name: "Eyebrow Services", category: "Beauty & Grooming" },
  { name: "Esthetician", category: "Beauty & Grooming" },

  // =========================
  // Fitness & Wellness
  // =========================

  { name: "Personal Trainer", category: "Fitness & Wellness" },
  { name: "Workout Partner", category: "Fitness & Wellness" },
  { name: "Running Coach", category: "Fitness & Wellness" },
  { name: "Yoga Instructor", category: "Fitness & Wellness" },
  { name: "Dance Instructor", category: "Fitness & Wellness" },
  { name: "Stretching Coach", category: "Fitness & Wellness" },

  // =========================
  // Childcare & Household Help
  // =========================

  { name: "Babysitting", category: "Family & Household" },
  { name: "Date Night Babysitter", category: "Family & Household" },
  { name: "Nanny Services", category: "Family & Household" },
  { name: "Mother's Helper", category: "Family & Household" },
  { name: "House Sitting", category: "Family & Household" },
  { name: "Senior Companion", category: "Family & Household" },
  { name: "Companion Services", category: "Family & Household" },
  { name: "Personal Assistant", category: "Family & Household" },
  { name: "Household Assistant", category: "Family & Household" },

  // =========================
  // Tutoring & Lessons
  // =========================

  { name: "Tutoring", category: "Tutoring & Lessons" },
  { name: "Math Tutoring", category: "Tutoring & Lessons" },
  { name: "English Tutoring", category: "Tutoring & Lessons" },
  { name: "Spanish Tutoring", category: "Tutoring & Lessons" },
  { name: "Reading Tutoring", category: "Tutoring & Lessons" },
  { name: "Homework Help", category: "Tutoring & Lessons" },
  { name: "GED Tutoring", category: "Tutoring & Lessons" },
  { name: "Computer Lessons", category: "Tutoring & Lessons" },
  { name: "Smartphone Lessons", category: "Tutoring & Lessons" },
  { name: "Music Lessons", category: "Tutoring & Lessons" },
  { name: "Guitar Lessons", category: "Tutoring & Lessons" },
  { name: "Piano Lessons", category: "Tutoring & Lessons" },
  { name: "Singing Lessons", category: "Tutoring & Lessons" },
  { name: "Dance Lessons", category: "Tutoring & Lessons" },

  // =========================
  // Tech Help
  // =========================

  { name: "Computer Help", category: "Technology" },
  { name: "Computer Repair", category: "Technology" },
  { name: "Laptop Setup", category: "Technology" },
  { name: "Printer Setup", category: "Technology" },
  { name: "Wi-Fi Setup", category: "Technology" },
  { name: "Smart TV Setup", category: "Technology" },
  { name: "Streaming Device Setup", category: "Technology" },
  { name: "Smart Home Setup", category: "Technology" },
  { name: "Security Camera Setup", category: "Technology" },
  { name: "Doorbell Camera Installation", category: "Technology" },
  { name: "Gaming Console Setup", category: "Technology" },
  { name: "Phone Setup", category: "Technology" },
  { name: "Data Transfer Help", category: "Technology" },
  { name: "Website Design", category: "Technology" },
  { name: "Basic Website Setup", category: "Technology" },

  // =========================
  // Business & Office Help
  // =========================

  { name: "Resume Writing", category: "Business Help" },
  { name: "Resume Editing", category: "Business Help" },
  { name: "Data Entry", category: "Business Help" },
  { name: "Virtual Assistant", category: "Business Help" },
  { name: "Administrative Help", category: "Business Help" },
  { name: "Bookkeeping", category: "Business Help" },
  { name: "Translation", category: "Business Help" },
  { name: "Spanish Translation", category: "Business Help" },
  { name: "English Translation", category: "Business Help" },
  { name: "Social Media Help", category: "Business Help" },
  { name: "Social Media Management", category: "Business Help" },
  { name: "Product Listing Help", category: "Business Help" },
  { name: "Inventory Help", category: "Business Help" },
  { name: "Office Organization", category: "Business Help" },

  // =========================
  // Seasonal & Miscellaneous
  // =========================

  { name: "Christmas Light Installation", category: "Seasonal & Misc." },
  { name: "Christmas Light Removal", category: "Seasonal & Misc." },
  { name: "Holiday Decorating", category: "Seasonal & Misc." },
  { name: "Holiday Decoration Removal", category: "Seasonal & Misc." },
  { name: "Gift Wrapping", category: "Seasonal & Misc." },
  { name: "Party Rental Setup", category: "Seasonal & Misc." },
  { name: "Tent Setup", category: "Seasonal & Misc." },
  { name: "Canopy Setup", category: "Seasonal & Misc." },
  { name: "Grill Assembly", category: "Seasonal & Misc." },
  { name: "Trampoline Assembly", category: "Seasonal & Misc." },
  { name: "Playset Assembly", category: "Seasonal & Misc." },
  { name: "Bike Assembly", category: "Seasonal & Misc." },
  { name: "Home Gym Assembly", category: "Seasonal & Misc." },

// =========================
// Plumbing
// =========================

{ name: "Plumber", category: "Plumbing" },
{ name: "Plumbing Repair", category: "Plumbing" },
{ name: "Emergency Plumbing", category: "Plumbing" },
{ name: "Leaky Faucet Repair", category: "Plumbing" },
{ name: "Pipe Repair", category: "Plumbing" },
{ name: "Burst Pipe Repair", category: "Plumbing" },
{ name: "Drain Cleaning", category: "Plumbing" },
{ name: "Clogged Drain Repair", category: "Plumbing" },
{ name: "Toilet Repair", category: "Plumbing" },
{ name: "Toilet Installation", category: "Plumbing" },
{ name: "Sink Repair", category: "Plumbing" },
{ name: "Sink Installation", category: "Plumbing" },
{ name: "Garbage Disposal Repair", category: "Plumbing" },
{ name: "Garbage Disposal Installation", category: "Plumbing" },
{ name: "Shower Repair", category: "Plumbing" },
{ name: "Shower Installation", category: "Plumbing" },
{ name: "Bathtub Plumbing", category: "Plumbing" },
{ name: "Water Heater Repair", category: "Plumbing" },
{ name: "Water Heater Installation", category: "Plumbing" },
{ name: "Tankless Water Heater Installation", category: "Plumbing" },
{ name: "Water Line Repair", category: "Plumbing" },
{ name: "Sewer Line Repair", category: "Plumbing" },
{ name: "Sewer Cleaning", category: "Plumbing" },
{ name: "Leak Detection", category: "Plumbing" },
{ name: "Outdoor Faucet Repair", category: "Plumbing" },
{ name: "Dishwasher Plumbing Installation", category: "Plumbing" },
{ name: "Refrigerator Water Line Installation", category: "Plumbing" },

// =========================
// Restaurant & Hospitality
// =========================

{ name: "Server", category: "Restaurant & Hospitality" },
{ name: "Server Assistant", category: "Restaurant & Hospitality" },
{ name: "Busser", category: "Restaurant & Hospitality" },
{ name: "Food Runner", category: "Restaurant & Hospitality" },
{ name: "Host", category: "Restaurant & Hospitality" },
{ name: "Hostess", category: "Restaurant & Hospitality" },
{ name: "Banquet Server", category: "Restaurant & Hospitality" },
{ name: "Banquet Staff", category: "Restaurant & Hospitality" },
{ name: "Bartender", category: "Restaurant & Hospitality" },
{ name: "Barback", category: "Restaurant & Hospitality" },
{ name: "Event Server", category: "Restaurant & Hospitality" },
{ name: "Catering Server", category: "Restaurant & Hospitality" },
{ name: "Restaurant Support Staff", category: "Restaurant & Hospitality" },
{ name: "Dishwasher", category: "Restaurant & Hospitality" },
{ name: "Kitchen Assistant", category: "Restaurant & Hospitality" },

// =========================
// Home Maintenance
// =========================

{ name: "Home Maintenance", category: "Home Maintenance" },
{ name: "Property Maintenance", category: "Home Maintenance" },
{ name: "Apartment Maintenance", category: "Home Maintenance" },
{ name: "Rental Property Maintenance", category: "Home Maintenance" },
{ name: "Preventive Home Maintenance", category: "Home Maintenance" },
{ name: "General Home Repairs", category: "Home Maintenance" },
{ name: "Home Maintenance Inspection", category: "Home Maintenance" },
{ name: "Seasonal Home Maintenance", category: "Home Maintenance" },
{ name: "Rental Turnover Maintenance", category: "Home Maintenance" },
{ name: "Air Filter Replacement", category: "Home Maintenance" },
{ name: "Smoke Detector Installation", category: "Home Maintenance" },
{ name: "Smoke Detector Battery Replacement", category: "Home Maintenance" },
{ name: "Door Hardware Replacement", category: "Home Maintenance" },
{ name: "Cabinet Hardware Replacement", category: "Home Maintenance" },
{ name: "Minor Fixture Replacement", category: "Home Maintenance" },

// =========================
// Security & Safety
// =========================

{ name: "Security Guard", category: "Security & Safety" },
{ name: "Event Security", category: "Security & Safety" },
{ name: "Private Event Security", category: "Security & Safety" },
{ name: "Residential Security", category: "Security & Safety" },
{ name: "Commercial Security", category: "Security & Safety" },
{ name: "Security Patrol", category: "Security & Safety" },
{ name: "Parking Lot Security", category: "Security & Safety" },
{ name: "Construction Site Security", category: "Security & Safety" },
{ name: "Security Camera Installation", category: "Security & Safety" },
{ name: "Doorbell Camera Installation", category: "Security & Safety" },
{ name: "Home Security System Installation", category: "Security & Safety" },
{ name: "Access Control Installation", category: "Security & Safety" },
{ name: "Security System Setup", category: "Security & Safety" },

// =========================
// Loss Prevention
// =========================

{ name: "Loss Prevention", category: "Loss Prevention" },
{ name: "Retail Loss Prevention", category: "Loss Prevention" },
{ name: "Asset Protection", category: "Loss Prevention" },
{ name: "Retail Asset Protection", category: "Loss Prevention" },
{ name: "Store Security", category: "Loss Prevention" },
{ name: "Inventory Loss Prevention", category: "Loss Prevention" },
{ name: "Theft Prevention", category: "Loss Prevention" },
{ name: "Event Loss Prevention", category: "Loss Prevention" }

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
suggestServiceButton?.addEventListener(
  "click",
  () => {
    customServiceForm?.classList.toggle(
      "hidden"
    );

    if (
      !customServiceForm?.classList.contains(
        "hidden"
      )
    ) {
      customServiceInput?.focus();
    }
  }
);

function addCustomService() {
  const customService =
    customServiceInput?.value.trim();

  if (!customService) {
    return;
  }

  const alreadySelected =
    selectedServices.some(
      (service) =>
        service.toLowerCase() ===
        customService.toLowerCase()
    );

  if (alreadySelected) {
    alert(
      "You already selected that service."
    );

    return;
  }

  selectedServices.push(
    customService
  );

  customServiceInput.value = "";

  customServiceForm?.classList.add(
    "hidden"
  );

  renderSelectedServices();
}

addCustomServiceButton?.addEventListener(
  "click",
  addCustomService
);

customServiceInput?.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCustomService();
    }
  }
);

professionalOnboardingForm?.addEventListener(
  "submit",
  async (event) => {
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


    /* =========================
       Validate Form
       ========================= */

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


    /* =========================
       Require Supabase Login
       ========================= */

    if (
      typeof korvoSupabase ===
      "undefined"
    ) {
      alert(
        "Korvo could not connect to your account. Please log in again."
      );

      window.location.href =
        "login.html";

      return;
    }


    try {

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
          "Please create or log in to your Korvo professional account before completing onboarding."
        );

        window.location.href =
          "signup.html";

        return;
      }


      /* =========================
         Update Real Korvo Profile
         ========================= */

      const {
        data: profile,
        error: profileError
      } =
        await korvoSupabase
          .from("profiles")
          .update({
            phone:
              professionalPhone,

            email:
              user.email ||
              professionalEmail,

            account_type:
              "professional",

            onboarding_complete:
              true,

            updated_at:
              new Date().toISOString()
          })
          .eq(
            "id",
            user.id
          )
          .select()
          .single();


      if (profileError) {
        throw profileError;
      }


      /* =========================
         Temporary Professional Data
         =========================

         Services, business name,
         service areas, experience,
         etc. still use localStorage
         temporarily until we build
         professional_profiles in
         Supabase.
      */

      const professionalProfile = {
        id:
          user.id,

        name:
          professionalName,

        businessName:
          businessName,

        phone:
          professionalPhone,

        email:
          user.email ||
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

        accountType:
          profile.account_type,

        updatedAt:
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


      alert(
        "Professional profile setup complete."
      );


      window.location.href =
        "professional-dashboard.html";


    } catch (error) {

      console.error(
        "Professional onboarding error:",
        error
      );


      alert(
        error.message ||
        "Korvo could not save your professional profile. Please try again."
      );
    }
  }
);

renderSelectedServices();