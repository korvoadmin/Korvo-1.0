"use strict";

/* =========================
   Korvo Messages
   ========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     Messaging Role
     ========================= */

  const messagingRole =
    localStorage.getItem("korvoMessagingRole") ||
    "customer";

  const isProfessional =
    messagingRole === "professional";

  const messageStorageKey =
    isProfessional
      ? "korvoProfessionalMessages"
      : "korvoCustomerMessages";


  /* =========================
     Page Elements
     ========================= */

  const mobileMenuButton =
    document.getElementById("mobileMenuButton");

  const mobileNav =
    document.getElementById("mobileNav");

  const conversationSearch =
    document.getElementById("conversationSearch");

  const conversationList =
    document.getElementById("conversationList");

  const activeConversationName =
    document.getElementById("activeConversationName");

  const activeConversationStatus =
    document.getElementById("activeConversationStatus");

  const activeJobTitle =
    document.getElementById("activeJobTitle");

  const activeJobLocation =
    document.getElementById("activeJobLocation");

  const chatMessages =
    document.getElementById("chatMessages");

  const messageForm =
    document.getElementById("messageForm");

  const messageInput =
    document.getElementById("messageInput");

  const messageCharacterCount =
    document.getElementById(
      "messageCharacterCount"
    );

  const attachmentButton =
    document.getElementById("attachmentButton");

  const currentYear =
    document.getElementById("currentYear");

  const viewConversationProfile =
    document.getElementById(
      "viewConversationProfile"
    );


  /* =========================
     Customer Conversations
     ========================= */

  const customerConversations = {

    "chris-custom-installations": {
      name: "Chris Custom Installations",
      status: "Typically replies within an hour",
      jobTitle: "Install Motorized Shades",
      location: "Atlanta, GA",
      profile: "chris-profile.html",
      senderName:
        "Chris Custom Installations",

      messages: [
        {
          type: "incoming",
          text:
            "Hi Chris, I saw your motorized shade installation request. I can complete the installation Friday afternoon.",
          time: "6:32 PM"
        },
        {
          type: "outgoing",
          text:
            "Sounds good. Does your quote include programming the shades too?",
          time: "6:36 PM"
        },
        {
          type: "incoming",
          text:
            "Yes. Installation, programming, testing and cleanup are included.",
          time: "6:39 PM"
        }
      ]
    },

    "prestige-cleaning": {
      name: "Prestige Estate Cleaning",
      status: "Usually replies the same day",
      jobTitle:
        "Deep Cleaning for Apartment",
      location: "Chamblee, GA",
      profile: "browse.html",
      senderName:
        "Prestige Estate Cleaning",

      messages: [
        {
          type: "incoming",
          text:
            "Hi Chris, we reviewed your deep-cleaning request and can complete the project Saturday morning.",
          time: "Yesterday"
        },
        {
          type: "outgoing",
          text:
            "Does the estimate include the kitchen and both bathrooms?",
          time: "Yesterday"
        },
        {
          type: "incoming",
          text:
            "Yes. The estimate includes both bathrooms, the kitchen, floors, dusting and general cleanup.",
          time: "Yesterday"
        }
      ]
    }

  };


  /* =========================
     Professional Conversations
     ========================= */

  const professionalConversations = {

    "sarah-m": {
      name: "Sarah M.",
      status: "Korvo Customer",
      jobTitle:
        "Motorized Shade Installation",
      location:
        "Buckhead, Atlanta",
      profile:
        "customer-dashboard.html",
      senderName:
        "Sarah M.",

      messages: [
        {
          type: "outgoing",
          text:
            "Hi Sarah, I saw your motorized shade installation request. I can complete the installation Friday afternoon.",
          time: "6:32 PM"
        },
        {
          type: "incoming",
          text:
            "Sounds good. Does your quote include programming the shades too?",
          time: "6:36 PM"
        },
        {
          type: "outgoing",
          text:
            "Yes. Installation, programming, testing and cleanup are included.",
          time: "6:39 PM"
        }
      ]
    },

    "michael-r": {
      name: "Michael R.",
      status: "Korvo Customer",
      jobTitle:
        "Interior Painting",
      location:
        "Brookhaven, GA",
      profile:
        "customer-dashboard.html",
      senderName:
        "Michael R.",

      messages: [
        {
          type: "incoming",
          text:
            "Hi, I had a question about the painting quote you submitted.",
          time: "Today"
        },
        {
          type: "outgoing",
          text:
            "Absolutely. What would you like to know?",
          time: "Today"
        }
      ]
    }

  };


  /* =========================
     Active Conversation Set
     ========================= */

  const conversations =
    isProfessional
      ? professionalConversations
      : customerConversations;


  /* =========================
     Active Conversation
     ========================= */

  let activeConversationId =
    isProfessional
      ? "sarah-m"
      : "chris-custom-installations";


  /* =========================
     Open Requested Conversation
     ========================= */

  const requestedConversationName =
    localStorage.getItem(
      "korvoOpenConversation"
    );

  if (requestedConversationName) {

    const matchingConversation =
      Object.entries(conversations)
        .find(
          ([, conversation]) =>
            conversation.name ===
            requestedConversationName
        );

    if (matchingConversation) {
      activeConversationId =
        matchingConversation[0];
    }

    localStorage.removeItem(
      "korvoOpenConversation"
    );

  }


  /* =========================
     Escape HTML
     ========================= */

  function escapeHTML(value) {

    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll(
        "'",
        "&#039;"
      );

  }


  /* =========================
     Local Storage
     ========================= */

  function readStoredMessages() {

    try {

      const stored =
        JSON.parse(
          localStorage.getItem(
            messageStorageKey
          )
        );

      if (
        stored &&
        typeof stored === "object"
      ) {

        Object.keys(stored)
          .forEach(
            (conversationId) => {

              if (
                conversations[
                  conversationId
                ] &&
                Array.isArray(
                  stored[
                    conversationId
                  ]
                )
              ) {

                conversations[
                  conversationId
                ].messages =
                  stored[
                    conversationId
                  ];

              }

            }
          );

      }

    } catch (error) {

      console.error(
        "Unable to load Korvo messages:",
        error
      );

    }

  }


  function saveMessages() {

    try {

      const messagesToSave = {};

      Object.keys(
        conversations
      ).forEach(
        (conversationId) => {

          messagesToSave[
            conversationId
          ] =
            conversations[
              conversationId
            ].messages;

        }
      );

      localStorage.setItem(
        messageStorageKey,
        JSON.stringify(
          messagesToSave
        )
      );

    } catch (error) {

      console.error(
        "Unable to save Korvo messages:",
        error
      );

    }

  }


  /* =========================
     Render Conversation
     ========================= */

  function renderConversation(
    conversationId
  ) {

    const conversation =
      conversations[
        conversationId
      ];

    if (!conversation) {
      return;
    }

    activeConversationId =
      conversationId;

    activeConversationName.textContent =
      conversation.name;

    activeConversationStatus.textContent =
      conversation.status;

    activeJobTitle.textContent =
      conversation.jobTitle;

    activeJobLocation.textContent =
      conversation.location;

    viewConversationProfile.href =
      conversation.profile;

    renderMessages(
      conversation
    );

    buildConversationList();

  }


  /* =========================
     Render Messages
     ========================= */

  function renderMessages(
    conversation
  ) {

    if (!chatMessages) {
      return;
    }

    chatMessages.innerHTML = `
      <div class="message-date-divider">
        Recent
      </div>
    `;

    conversation.messages.forEach(
      (message) => {

        const bubble =
          document.createElement(
            "article"
          );

        bubble.className =
          `message-bubble ${message.type}`;

        if (
          message.type ===
          "incoming"
        ) {

          bubble.innerHTML = `
            <div class="message-sender">
              ${escapeHTML(
                conversation.senderName
              )}
            </div>

            <p>
              ${escapeHTML(
                message.text
              )}
            </p>

            <span class="message-time">
              ${escapeHTML(
                message.time
              )}
            </span>
          `;

        } else {

          bubble.innerHTML = `
            <p>
              ${escapeHTML(
                message.text
              )}
            </p>

            <span class="message-time">
              ${escapeHTML(
                message.time
              )}
            </span>
          `;

        }

        chatMessages.appendChild(
          bubble
        );

      }
    );

    chatMessages.scrollTop =
      chatMessages.scrollHeight;

  }


  /* =========================
     Build Conversation List
     ========================= */

  function buildConversationList() {

    if (!conversationList) {
      return;
    }

    conversationList.innerHTML = "";

    Object.entries(
      conversations
    ).forEach(
      ([conversationId, conversation]) => {

        const button =
          document.createElement(
            "button"
          );

        button.type = "button";

        button.className =
          "conversation-item";

        if (
          conversationId ===
          activeConversationId
        ) {
          button.classList.add(
            "active"
          );
        }

        button.dataset.conversation =
          conversationId;

        const initials =
          conversation.name
            .split(" ")
            .map(
              (word) =>
                word.charAt(0)
            )
            .slice(0, 2)
            .join("")
            .toUpperCase();

        const latestMessage =
          conversation.messages[
            conversation.messages.length - 1
          ];

        button.innerHTML = `
          <div class="conversation-avatar">
            ${escapeHTML(initials)}
          </div>

          <div class="conversation-preview">

            <div class="conversation-preview-top">

              <strong>
                ${escapeHTML(
                  conversation.name
                )}
              </strong>

              <span>
                ${escapeHTML(
                  latestMessage?.time ||
                    ""
                )}
              </span>

            </div>

            <p>
              ${escapeHTML(
                latestMessage?.text ||
                  "Start a conversation..."
              )}
            </p>

            <span class="conversation-job">
              ${escapeHTML(
                conversation.jobTitle
              )}
            </span>

          </div>
        `;

        button.addEventListener(
          "click",
          () => {
            renderConversation(
              conversationId
            );
          }
        );

        conversationList.appendChild(
          button
        );

      }
    );

  }


  /* =========================
     Conversation Search
     ========================= */

  if (conversationSearch) {

    conversationSearch.addEventListener(
      "input",
      () => {

        const searchValue =
          conversationSearch.value
            .trim()
            .toLowerCase();

        const conversationItems =
          conversationList
            ?.querySelectorAll(
              ".conversation-item"
            ) || [];

        conversationItems.forEach(
          (item) => {

            const searchableText =
              item.textContent
                .toLowerCase();

            const matches =
              searchableText.includes(
                searchValue
              );

            item.style.display =
              matches
                ? ""
                : "none";

          }
        );

      }
    );

  }


  /* =========================
     Send Message
     ========================= */

  if (messageForm) {

    messageForm.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        const text =
          messageInput.value
            .trim();

        if (!text) {
          return;
        }

        const conversation =
          conversations[
            activeConversationId
          ];

        if (!conversation) {
          return;
        }

        const newMessage = {
          type: "outgoing",
          text,
          time:
            new Date()
              .toLocaleTimeString(
                [],
                {
                  hour: "numeric",
                  minute: "2-digit"
                }
              )
        };

        conversation.messages.push(
          newMessage
        );

        saveMessages();

        renderMessages(
          conversation
        );

        buildConversationList();

        messageInput.value = "";

        messageCharacterCount.textContent =
          "0";

        messageInput.style.height =
          "";

      }
    );

  }


  /* =========================
     Character Counter
     ========================= */

  if (messageInput) {

    messageInput.addEventListener(
      "input",
      () => {

        messageCharacterCount.textContent =
          String(
            messageInput.value.length
          );

        messageInput.style.height =
          "auto";

        messageInput.style.height =
          `${Math.min(
            messageInput.scrollHeight,
            130
          )}px`;

      }
    );

    messageInput.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          messageForm.requestSubmit();

        }

      }
    );

  }


  /* =========================
     Attachment Button
     ========================= */

  if (attachmentButton) {

    attachmentButton.addEventListener(
      "click",
      () => {

        alert(
          "Photo attachments will be added when Korvo file uploads are connected to the backend."
        );

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

        const isOpen =
          mobileNav.classList.contains(
            "open"
          );

        mobileMenuButton.setAttribute(
          "aria-expanded",
          String(isOpen)
        );

        mobileMenuButton.textContent =
          isOpen
            ? "×"
            : "☰";

      }
    );

  }


  /* =========================
     Footer Year
     ========================= */

  if (currentYear) {

    currentYear.textContent =
      String(
        new Date().getFullYear()
      );

  }


  /* =========================
     Initialize
     ========================= */

  readStoredMessages();

  buildConversationList();

  renderConversation(
    activeConversationId
  );

});