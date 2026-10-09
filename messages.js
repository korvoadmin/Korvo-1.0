"use strict";

/* =========================
   Korvo Messages
   Real Supabase Messaging
   ========================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /* =========================
       Page Elements
       ========================= */

    const mobileMenuButton =
      document.getElementById(
        "mobileMenuButton"
      );

    const mobileNav =
      document.getElementById(
        "mobileNav"
      );

    const conversationSearch =
      document.getElementById(
        "conversationSearch"
      );

    const conversationList =
      document.getElementById(
        "conversationList"
      );

    const conversationCount =
      document.querySelector(
        ".conversation-count"
      );

    const activeConversationName =
      document.getElementById(
        "activeConversationName"
      );

    const activeConversationStatus =
      document.getElementById(
        "activeConversationStatus"
      );

    const activeJobTitle =
      document.getElementById(
        "activeJobTitle"
      );

    const activeJobReference =
      document.getElementById(
        "activeJobReference"
      );

    const activeJobLocation =
      document.getElementById(
        "activeJobLocation"
      );

    const activeJobStatus =
      document.getElementById(
        "activeJobStatus"
      );

    const chatMessages =
      document.getElementById(
        "chatMessages"
      );

    const messageForm =
      document.getElementById(
        "messageForm"
      );

    const messageInput =
      document.getElementById(
        "messageInput"
      );

    const messageCharacterCount =
      document.getElementById(
        "messageCharacterCount"
      );

    const attachmentButton =
      document.getElementById(
        "attachmentButton"
      );

    const currentYear =
      document.getElementById(
        "currentYear"
      );

    const viewConversationProfile =
      document.getElementById(
        "viewConversationProfile"
      );

    const roleBadge =
      document.getElementById(
        "conversationRoleBadge"
      );

    const headerProfileButton =
      document.querySelector(
        ".profile-button"
      );

    const headerProfileAvatar =
      document.querySelector(
        ".profile-avatar"
      );

    const headerProfileName =
      document.querySelector(
        ".profile-name"
      );


    /* =========================
       State
       ========================= */

    let currentUser = null;
    let currentProfile = null;
    let isProfessional = false;
    let conversations = [];
    let messagesByConversation =
      new Map();
    let activeConversationId = "";
    let refreshTimer = null;


    /* =========================
       Utilities
       ========================= */

    function escapeHTML(value) {

      return String(
        value ?? ""
      )
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


    function getInitials(name) {

      return String(
        name || "Korvo"
      )
        .split(" ")
        .filter(Boolean)
        .map(
          (word) =>
            word.charAt(0)
        )
        .slice(0, 2)
        .join("")
        .toUpperCase();

    }


    function formatMessageTime(
      dateValue
    ) {

      const date =
        new Date(
          dateValue
        );


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "";
      }


      const now =
        new Date();


      const sameDate =
        date.toDateString() ===
        now.toDateString();


      if (sameDate) {

        return date
          .toLocaleTimeString(
            [],
            {
              hour:
                "numeric",

              minute:
                "2-digit"
            }
          );

      }


      return date
        .toLocaleDateString(
          "en-US",
          {
            month:
              "short",

            day:
              "numeric"
          }
        );

    }


    function formatStatus(
      value
    ) {

      const normalized =
        String(
          value || ""
        )
          .replaceAll(
            "_",
            " "
          )
          .trim();


      if (!normalized) {
        return "Korvo Conversation";
      }


      return normalized
        .replace(
          /\b\w/g,
          (letter) =>
            letter.toUpperCase()
        );

    }


    function getOtherPartyName(
      conversation
    ) {

      if (isProfessional) {
        return "Korvo Customer";
      }


      return (
        conversation
          .professional_name ||
        "Korvo Professional"
      );

    }


    function getConversationMessages(
      conversationId
    ) {

      return (
        messagesByConversation
          .get(
            conversationId
          ) ||
        []
      );

    }


    function getUnreadCount(
      conversation
    ) {

      if (
        !conversation ||
        !currentUser
      ) {
        return 0;
      }


      const lastReadValue =
        isProfessional
          ? conversation
              .professional_last_read_at
          : conversation
              .customer_last_read_at;


      const lastReadTime =
        lastReadValue
          ? new Date(
              lastReadValue
            ).getTime()
          : 0;


      return getConversationMessages(
        conversation.id
      )
        .filter(
          (message) => {

            if (
              message.sender_id ===
              currentUser.id
            ) {
              return false;
            }


            const messageTime =
              new Date(
                message.created_at
              ).getTime();


            return (
              Number.isFinite(
                messageTime
              ) &&
              messageTime >
                lastReadTime
            );

          }
        )
        .length;

    }


    async function markConversationRead(
      conversation
    ) {

      if (
        !conversation ||
        getUnreadCount(
          conversation
        ) === 0
      ) {
        return;
      }


      const {
        error
      } =
        await korvoSupabase.rpc(
          "mark_conversation_read",
          {
            p_conversation_id:
              conversation.id
          }
        );


      if (error) {
        throw error;
      }


      const now =
        new Date()
          .toISOString();


      if (isProfessional) {
        conversation
          .professional_last_read_at =
            now;
      } else {
        conversation
          .customer_last_read_at =
            now;
      }


      buildConversationList();

    }


    function setComposerEnabled(
      enabled
    ) {

      if (messageInput) {
        messageInput.disabled =
          !enabled;
      }


      if (messageForm) {

        const sendButton =
          messageForm.querySelector(
            'button[type="submit"]'
          );


        if (sendButton) {
          sendButton.disabled =
            !enabled;
        }

      }


      if (attachmentButton) {
        attachmentButton.disabled =
          !enabled;
      }

    }


    /* =========================
       Authentication
       ========================= */

    async function loadCurrentAccount() {

      if (
        typeof korvoSupabase ===
        "undefined"
      ) {
        throw new Error(
          "Supabase is not available."
        );
      }


      const {
        data: userData,
        error: userError
      } =
        await korvoSupabase
          .auth
          .getUser();


      if (
        userError ||
        !userData?.user
      ) {

        window.location.href =
          "login.html";

        return false;
      }


      currentUser =
        userData.user;


      const {
        data: profile,
        error: profileError
      } =
        await korvoSupabase
          .from(
            "profiles"
          )
          .select(
            "id, first_name, last_name, account_type"
          )
          .eq(
            "id",
            currentUser.id
          )
          .single();


      if (profileError) {
        throw profileError;
      }


      currentProfile =
        profile;


      isProfessional =
        String(
          profile.account_type ||
          ""
        ).toLowerCase() ===
        "professional";


      localStorage.setItem(
        "korvoMessagingRole",
        isProfessional
          ? "professional"
          : "customer"
      );


      updateHeaderForRole();


      return true;
    }


    function updateHeaderForRole() {

      const firstName =
        currentProfile
          ?.first_name ||
        (
          isProfessional
            ? "Pro"
            : "Customer"
        );


      const fullName =
        [
          currentProfile
            ?.first_name,

          currentProfile
            ?.last_name
        ]
          .filter(Boolean)
          .join(" ") ||
        firstName;


      if (
        headerProfileButton
      ) {

        headerProfileButton.href =
          isProfessional
            ? "professional-dashboard.html"
            : "customer-dashboard.html";

      }


      if (
        headerProfileAvatar
      ) {

        headerProfileAvatar.textContent =
          getInitials(
            fullName
          );

      }


      if (
        headerProfileName
      ) {

        headerProfileName.textContent =
          firstName;

      }

    }


    /* =========================
       Backend Loading
       ========================= */

    async function fetchConversations() {

      const {
        data,
        error
      } =
        await korvoSupabase
          .from(
            "conversations"
          )
          .select(
            "id, quote_id, job_id, active_job_id, customer_id, professional_id, job_title, job_reference, job_city, job_state, professional_name, status, customer_last_read_at, professional_last_read_at, created_at, updated_at"
          )
          .order(
            "updated_at",
            {
              ascending:
                false
            }
          );


      if (error) {
        throw error;
      }


      conversations =
        Array.isArray(
          data
        )
          ? data
          : [];


      return conversations;
    }


    async function fetchMessages() {

      messagesByConversation =
        new Map();


      const conversationIds =
        conversations.map(
          (conversation) =>
            conversation.id
        );


      if (
        conversationIds.length ===
        0
      ) {
        return;
      }


      const {
        data,
        error
      } =
        await korvoSupabase
          .from(
            "messages"
          )
          .select(
            "id, conversation_id, sender_id, body, created_at"
          )
          .in(
            "conversation_id",
            conversationIds
          )
          .order(
            "created_at",
            {
              ascending:
                true
            }
          );


      if (error) {
        throw error;
      }


      (
        Array.isArray(data)
          ? data
          : []
      )
        .forEach(
          (message) => {

            const existing =
              messagesByConversation
                .get(
                  message
                    .conversation_id
                ) ||
              [];


            existing.push(
              message
            );


            messagesByConversation
              .set(
                message
                  .conversation_id,
                existing
              );

          }
        );

    }


    async function loadInbox() {

      await fetchConversations();
      await fetchMessages();

    }


    /* =========================
       Requested Conversation
       ========================= */

    function chooseInitialConversation() {

      if (
        conversations.length ===
        0
      ) {

        activeConversationId =
          "";

        clearRequestedConversation();

        return;
      }


      const requestedQuoteId =
        localStorage.getItem(
          "korvoOpenQuoteId"
        );


      const requestedActiveJobId =
        localStorage.getItem(
          "korvoOpenActiveJobId"
        );


      const legacyName =
        localStorage.getItem(
          "korvoOpenConversation"
        );


      let match = null;


      if (requestedQuoteId) {

        match =
          conversations.find(
            (conversation) =>
              String(
                conversation
                  .quote_id
              ) ===
              String(
                requestedQuoteId
              )
          );

      }


      if (
        !match &&
        requestedActiveJobId
      ) {

        match =
          conversations.find(
            (conversation) =>
              String(
                conversation
                  .active_job_id ||
                ""
              ) ===
              String(
                requestedActiveJobId
              )
          );

      }


      if (
        !match &&
        legacyName &&
        !isProfessional
      ) {

        match =
          conversations.find(
            (conversation) =>
              String(
                conversation
                  .professional_name ||
                ""
              ) ===
              String(
                legacyName
              )
          );

      }


      if (
        match
      ) {

        activeConversationId =
          match.id;

      } else if (
        !conversations.some(
          (conversation) =>
            conversation.id ===
            activeConversationId
        )
      ) {

        activeConversationId =
          conversations[0].id;

      }


      clearRequestedConversation();

    }


    function clearRequestedConversation() {

      localStorage.removeItem(
        "korvoOpenQuoteId"
      );

      localStorage.removeItem(
        "korvoOpenActiveJobId"
      );

      localStorage.removeItem(
        "korvoOpenConversation"
      );

    }


    /* =========================
       Render Conversation List
       ========================= */

    function buildConversationList() {

      if (
        !conversationList
      ) {
        return;
      }


      conversationList.innerHTML =
        "";


      if (
        conversationCount
      ) {

        conversationCount.textContent =
          String(
            conversations.length
          );

      }


      if (
        conversations.length ===
        0
      ) {

        conversationList.innerHTML =
          '<div class="empty-state compact">' +
            '<div class="empty-state-icon">💬</div>' +
            '<h3>No conversations yet</h3>' +
            '<p>Your Korvo job conversations will appear here.</p>' +
          '</div>';


        return;
      }


      conversations.forEach(
        (conversation) => {

          const button =
            document.createElement(
              "button"
            );


          button.type =
            "button";

          button.className =
            "conversation-item";


          if (
            conversation.id ===
            activeConversationId
          ) {

            button.classList.add(
              "active"
            );

          }


          const otherParty =
            getOtherPartyName(
              conversation
            );


          const messages =
            getConversationMessages(
              conversation.id
            );


          const latestMessage =
            messages[
              messages.length - 1
            ];


          const unreadCount =
            getUnreadCount(
              conversation
            );


          button.innerHTML =
            '<div class="conversation-avatar">' +
              escapeHTML(
                getInitials(
                  otherParty
                )
              ) +
            '</div>' +

            '<div class="conversation-preview">' +

              '<div class="conversation-preview-top">' +
                '<strong>' +
                  escapeHTML(
                    otherParty
                  ) +
                '</strong>' +

                '<span>' +
                  escapeHTML(
                    latestMessage
                      ? formatMessageTime(
                          latestMessage
                            .created_at
                        )
                      : ""
                  ) +
                '</span>' +
              '</div>' +

              '<p>' +
                escapeHTML(
                  latestMessage
                    ?.body ||
                  "Start the conversation..."
                ) +
              '</p>' +

              '<span class="conversation-job">' +
                escapeHTML(
                  conversation
                    .job_title ||
                  "Korvo Job"
                ) +
              '</span>' +

            '</div>' +

            (
              unreadCount > 0
                ? '<span class="conversation-unread-dot" title="' +
                    escapeHTML(
                      unreadCount +
                      (
                        unreadCount === 1
                          ? " unread message"
                          : " unread messages"
                      )
                    ) +
                  '"></span>'
                : ""
            );


          button.addEventListener(
            "click",
            () => {

              activeConversationId =
                conversation.id;


              renderActiveConversation();
              buildConversationList();

            }
          );


          conversationList
            .appendChild(
              button
            );

        }
      );

    }


    /* =========================
       Render Active Conversation
       ========================= */

    function renderActiveConversation() {

      const conversation =
        conversations.find(
          (item) =>
            item.id ===
            activeConversationId
        );


      if (
        !conversation
      ) {

        renderNoConversation();

        return;
      }


      const otherParty =
        getOtherPartyName(
          conversation
        );


      if (
        activeConversationName
      ) {

        activeConversationName
          .textContent =
            otherParty;

      }


      if (
        activeConversationStatus
      ) {

        activeConversationStatus
          .textContent =
            isProfessional
              ? "Korvo Customer"
              : "Korvo Professional";

      }


      if (
        roleBadge
      ) {

        roleBadge.textContent =
          isProfessional
            ? "Korvo Customer"
            : "Korvo Professional";

      }


      if (
        activeJobTitle
      ) {

        activeJobTitle.textContent =
          conversation
            .job_title ||
          "Korvo Job";

      }


      if (
        activeJobReference
      ) {

        activeJobReference
          .textContent =
            conversation
              .job_reference ||
            conversation
              .job_id ||
            "Not assigned";

      }


      if (
        activeJobLocation
      ) {

        activeJobLocation
          .textContent =
            [
              conversation
                .job_city,

              conversation
                .job_state
            ]
              .filter(Boolean)
              .join(", ") ||
            "Location unavailable";

      }


      if (
        activeJobStatus
      ) {

        activeJobStatus
          .textContent =
            conversation
              .active_job_id
              ? "Active Job"
              : "Quote Conversation";

      }


      if (
        viewConversationProfile
      ) {

        if (isProfessional) {

          viewConversationProfile
            .style.display =
              "none";

        } else {

          viewConversationProfile
            .style.display =
              "";

          viewConversationProfile.href =
            "browse.html";

        }

      }


      renderMessages(
        conversation
      );


      setComposerEnabled(
        conversation.status ===
        "active"
      );


      markConversationRead(
        conversation
      )
        .catch(
          (error) => {

            console.error(
              "Unable to mark conversation read:",
              error
            );

          }
        );

    }


    function renderNoConversation() {

      if (
        activeConversationName
      ) {

        activeConversationName
          .textContent =
            "No conversation selected";

      }


      if (
        activeConversationStatus
      ) {

        activeConversationStatus
          .textContent =
            "Choose a conversation from your inbox.";

      }


      if (
        roleBadge
      ) {
        roleBadge.textContent =
          "Korvo";
      }


      if (
        activeJobTitle
      ) {
        activeJobTitle.textContent =
          "—";
      }


      if (
        activeJobReference
      ) {
        activeJobReference.textContent =
          "—";
      }


      if (
        activeJobLocation
      ) {
        activeJobLocation.textContent =
          "—";
      }


      if (
        activeJobStatus
      ) {
        activeJobStatus.textContent =
          "—";
      }


      if (
        viewConversationProfile
      ) {
        viewConversationProfile
          .style.display =
            "none";
      }


      if (
        chatMessages
      ) {

        chatMessages.innerHTML =
          '<div class="empty-state compact">' +
            '<div class="empty-state-icon">💬</div>' +
            '<h3>No messages yet</h3>' +
            '<p>Your conversation will appear here.</p>' +
          '</div>';

      }


      setComposerEnabled(
        false
      );

    }


    function renderMessages(
      conversation
    ) {

      if (
        !chatMessages
      ) {
        return;
      }


      const messages =
        getConversationMessages(
          conversation.id
        );


      chatMessages.innerHTML =
        '<div class="message-date-divider">Recent</div>';


      if (
        messages.length ===
        0
      ) {

        const emptyMessage =
          document.createElement(
            "div"
          );


        emptyMessage.className =
          "empty-state compact";


        emptyMessage.innerHTML =
          '<div class="empty-state-icon">💬</div>' +
          '<h3>Start the conversation</h3>' +
          '<p>Send the first message about this Korvo job.</p>';


        chatMessages.appendChild(
          emptyMessage
        );

      }


      messages.forEach(
        (message) => {

          const outgoing =
            message.sender_id ===
            currentUser.id;


          const bubble =
            document.createElement(
              "article"
            );


          bubble.className =
            "message-bubble " +
            (
              outgoing
                ? "outgoing"
                : "incoming"
            );


          const senderHTML =
            outgoing
              ? ""
              : (
                  '<div class="message-sender">' +
                    escapeHTML(
                      getOtherPartyName(
                        conversation
                      )
                    ) +
                  '</div>'
                );


          bubble.innerHTML =
            senderHTML +

            '<p>' +
              escapeHTML(
                message.body
              ) +
            '</p>' +

            '<span class="message-time">' +
              escapeHTML(
                formatMessageTime(
                  message.created_at
                )
              ) +
            '</span>';


          chatMessages.appendChild(
            bubble
          );

        }
      );


      chatMessages.scrollTop =
        chatMessages.scrollHeight;

    }


    /* =========================
       Send Message
       ========================= */

    messageForm
      ?.addEventListener(
        "submit",
        async (event) => {

          event.preventDefault();


          const text =
            messageInput
              ?.value
              .trim() ||
            "";


          if (
            !text ||
            !activeConversationId ||
            !currentUser
          ) {
            return;
          }


          const sendButton =
            messageForm
              .querySelector(
                'button[type="submit"]'
              );


          if (
            sendButton
          ) {

            sendButton.disabled =
              true;

            sendButton.textContent =
              "Sending...";

          }


          try {

            const {
              data: savedMessage,
              error
            } =
              await korvoSupabase
                .from(
                  "messages"
                )
                .insert({
                  conversation_id:
                    activeConversationId,

                  sender_id:
                    currentUser.id,

                  body:
                    text
                })
                .select(
                  "id, conversation_id, sender_id, body, created_at"
                )
                .single();


            if (error) {
              throw error;
            }


            const existing =
              getConversationMessages(
                activeConversationId
              )
                .slice();


            existing.push(
              savedMessage
            );


            messagesByConversation
              .set(
                activeConversationId,
                existing
              );


            const conversation =
              conversations.find(
                (item) =>
                  item.id ===
                  activeConversationId
              );


            if (
              conversation
            ) {

              conversation.updated_at =
                savedMessage.created_at;

            }


            conversations.sort(
              (a, b) =>
                new Date(
                  b.updated_at
                ) -
                new Date(
                  a.updated_at
                )
            );


            if (
              messageInput
            ) {

              messageInput.value =
                "";

              messageInput.style.height =
                "";

            }


            if (
              messageCharacterCount
            ) {
              messageCharacterCount
                .textContent =
                  "0";
            }


            renderActiveConversation();
            buildConversationList();


          } catch (error) {

            console.error(
              "Message send failed:",
              error
            );


            alert(
              "Korvo could not send your message. Please try again."
            );


          } finally {

            if (
              sendButton
            ) {

              sendButton.disabled =
                false;

              sendButton.textContent =
                "Send";

            }

          }

        }
      );


    /* =========================
       Inbox Refresh
       ========================= */

    async function refreshInbox() {

      try {

        const currentId =
          activeConversationId;


        await loadInbox();


        if (
          conversations.some(
            (conversation) =>
              conversation.id ===
              currentId
          )
        ) {

          activeConversationId =
            currentId;

        } else {

          chooseInitialConversation();

        }


        buildConversationList();
        renderActiveConversation();


      } catch (error) {

        console.error(
          "Unable to refresh messages:",
          error
        );

      }

    }


    /* =========================
       Search
       ========================= */

    conversationSearch
      ?.addEventListener(
        "input",
        () => {

          const searchValue =
            conversationSearch.value
              .trim()
              .toLowerCase();


          const items =
            conversationList
              ?.querySelectorAll(
                ".conversation-item"
              ) ||
            [];


          items.forEach(
            (item) => {

              const matches =
                item.textContent
                  .toLowerCase()
                  .includes(
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


    /* =========================
       Composer Behavior
       ========================= */

    messageInput
      ?.addEventListener(
        "input",
        () => {

          if (
            messageCharacterCount
          ) {

            messageCharacterCount
              .textContent =
                String(
                  messageInput
                    .value
                    .length
                );

          }


          messageInput.style.height =
            "auto";


          messageInput.style.height =
            Math.min(
              messageInput
                .scrollHeight,
              130
            ) +
            "px";

        }
      );


    messageInput
      ?.addEventListener(
        "keydown",
        (event) => {

          if (
            event.key ===
              "Enter" &&
            !event.shiftKey
          ) {

            event.preventDefault();

            messageForm
              ?.requestSubmit();

          }

        }
      );


    attachmentButton
      ?.addEventListener(
        "click",
        () => {

          alert(
            "Photo attachments will be connected after the core messaging backend is verified."
          );

        }
      );


    /* =========================
       Mobile Navigation
       ========================= */

    if (
      mobileMenuButton &&
      mobileNav
    ) {

      mobileMenuButton
        .addEventListener(
          "click",
          () => {

            mobileNav
              .classList
              .toggle(
                "open"
              );


            const isOpen =
              mobileNav
                .classList
                .contains(
                  "open"
                );


            mobileMenuButton
              .setAttribute(
                "aria-expanded",
                String(
                  isOpen
                )
              );


            mobileMenuButton
              .textContent =
                isOpen
                  ? "×"
                  : "☰";

          }
        );

    }


    /* =========================
       Footer
       ========================= */

    if (
      currentYear
    ) {

      currentYear.textContent =
        String(
          new Date()
            .getFullYear()
        );

    }


    /* =========================
       Initialize
       ========================= */

    try {

      const loaded =
        await loadCurrentAccount();


      if (!loaded) {
        return;
      }


      await loadInbox();

      chooseInitialConversation();

      buildConversationList();
      renderActiveConversation();


      refreshTimer =
        window.setInterval(
          refreshInbox,
          5000
        );


      window.addEventListener(
        "beforeunload",
        () => {

          if (
            refreshTimer
          ) {
            window.clearInterval(
              refreshTimer
            );
          }

        }
      );


    } catch (error) {

      console.error(
        "Korvo Messages failed to load:",
        error
      );


      if (
        conversationList
      ) {

        conversationList.innerHTML =
          '<div class="empty-state compact">' +
            '<div class="empty-state-icon">⚠️</div>' +
            '<h3>Messages could not be loaded</h3>' +
            '<p>Refresh the page and try again.</p>' +
          '</div>';

      }


      renderNoConversation();

    }

  }
);
