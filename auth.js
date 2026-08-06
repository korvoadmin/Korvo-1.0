"use strict";

/* =========================
   Korvo Authentication Demo
   Login + Signup
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     Shared Helpers
     ========================= */

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10;
  }

  function setFieldError(input, hasError) {
    const formGroup = input?.closest(".form-group");
    const errorMessage = formGroup?.querySelector(".field-error");

    formGroup?.classList.toggle("error", hasError);

    if (errorMessage) {
      errorMessage.style.display = hasError
        ? "block"
        : "none";
    }
  }

  function saveToStorage(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error(
        `Unable to save ${key}:`,
        error
      );
    }
  }

  function readFromStorage(key, fallbackValue) {
    try {
      const storedValue = localStorage.getItem(key);

      if (!storedValue) {
        return fallbackValue;
      }

      return JSON.parse(storedValue);
    } catch (error) {
      console.error(
        `Unable to read ${key}:`,
        error
      );

      return fallbackValue;
    }
  }

  function saveDemoSession(accountType, email, name = "") {
    const session = {
      accountType,
      email,
      name,
      loggedIn: true,
      loginTime: new Date().toISOString()
    };

    saveToStorage("korvoDemoSession", session);
  }

  function redirectByAccountType(accountType) {
    if (accountType === "professional") {
      window.location.href = "dashboard.html";
      return;
    }

    window.location.href = "customer-dashboard.html";
  }

  function configurePasswordToggle(
    button,
    input
  ) {
    if (!button || !input) {
      return;
    }

    button.addEventListener("click", () => {
      const passwordIsHidden =
        input.type === "password";

      input.type = passwordIsHidden
        ? "text"
        : "password";

      button.textContent = passwordIsHidden
        ? "Hide"
        : "Show";

      button.setAttribute(
        "aria-label",
        passwordIsHidden
          ? "Hide password"
          : "Show password"
      );
    });
  }

  /* =========================
     Login Page
     ========================= */

  const loginForm =
    document.getElementById("loginForm");

  const loginEmail =
    document.getElementById("loginEmail");

  const loginPassword =
    document.getElementById("loginPassword");

  const passwordToggle =
    document.getElementById("passwordToggle");

  const customerDemoButton =
    document.getElementById("customerDemoButton");

  const professionalDemoButton =
    document.getElementById(
      "professionalDemoButton"
    );

  configurePasswordToggle(
    passwordToggle,
    loginPassword
  );

  loginForm?.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      const email =
        loginEmail?.value.trim() || "";

      const password =
        loginPassword?.value || "";

      const emailIsValid =
        isValidEmail(email);

      const passwordIsValid =
        password.length >= 6;

      setFieldError(
        loginEmail,
        !emailIsValid
      );

      setFieldError(
        loginPassword,
        !passwordIsValid
      );

      if (!emailIsValid || !passwordIsValid) {
        return;
      }

      const accounts = readFromStorage(
        "korvoDemoAccounts",
        []
      );

      const existingAccount = accounts.find(
        (account) =>
          account.email.toLowerCase() ===
          email.toLowerCase()
      );

      let accountType = "customer";
      let customerName = "";

      if (existingAccount) {
        accountType =
          existingAccount.accountType;

        customerName =
          existingAccount.firstName || "";
      } else {
        const normalizedEmail =
          email.toLowerCase();

        accountType =
          normalizedEmail.includes("pro") ||
          normalizedEmail.includes("contractor")
            ? "professional"
            : "customer";
      }

      saveDemoSession(
        accountType,
        email,
        customerName
      );

      redirectByAccountType(accountType);
    }
  );

  customerDemoButton?.addEventListener(
    "click",
    () => {
      saveDemoSession(
        "customer",
        "customer@korvo.demo",
        "Chris"
      );

      window.location.href =
        "customer-dashboard.html";
    }
  );

  professionalDemoButton?.addEventListener(
    "click",
    () => {
      saveDemoSession(
        "professional",
        "professional@korvo.demo",
        "Chris"
      );

      window.location.href =
        "dashboard.html";
    }
  );

  loginEmail?.addEventListener(
    "input",
    () => {
      if (
        isValidEmail(
          loginEmail.value.trim()
        )
      ) {
        setFieldError(
          loginEmail,
          false
        );
      }
    }
  );

  loginPassword?.addEventListener(
    "input",
    () => {
      if (loginPassword.value.length >= 6) {
        setFieldError(
          loginPassword,
          false
        );
      }
    }
  );

  /* =========================
     Signup Page
     ========================= */

  const signupForm =
    document.getElementById("signupForm");

  const signupFirstName =
    document.getElementById(
      "signupFirstName"
    );

  const signupLastName =
    document.getElementById(
      "signupLastName"
    );

  const signupEmail =
    document.getElementById(
      "signupEmail"
    );

  const signupPhone =
    document.getElementById(
      "signupPhone"
    );

  const signupPassword =
    document.getElementById(
      "signupPassword"
    );

  const confirmPassword =
    document.getElementById(
      "confirmPassword"
    );

  const signupTerms =
    document.getElementById(
      "signupTerms"
    );

  const signupPasswordToggle =
    document.getElementById(
      "signupPasswordToggle"
    );

  const confirmPasswordToggle =
    document.getElementById(
      "confirmPasswordToggle"
    );

  configurePasswordToggle(
    signupPasswordToggle,
    signupPassword
  );

  configurePasswordToggle(
    confirmPasswordToggle,
    confirmPassword
  );

  signupForm?.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      const firstName =
        signupFirstName?.value.trim() || "";

      const lastName =
        signupLastName?.value.trim() || "";

      const email =
        signupEmail?.value.trim() || "";

      const phone =
        signupPhone?.value.trim() || "";

      const password =
        signupPassword?.value || "";

      const confirmedPassword =
        confirmPassword?.value || "";

      const accountType =
        document.querySelector(
          'input[name="accountType"]:checked'
        )?.value || "customer";

      const firstNameIsValid =
        firstName.length >= 2;

      const lastNameIsValid =
        lastName.length >= 2;

      const emailIsValid =
        isValidEmail(email);

      const phoneIsValid =
        isValidPhone(phone);

      const passwordIsValid =
        password.length >= 6;

      const passwordsMatch =
        password === confirmedPassword &&
        confirmedPassword.length >= 6;

      const termsAccepted =
        Boolean(signupTerms?.checked);

      setFieldError(
        signupFirstName,
        !firstNameIsValid
      );

      setFieldError(
        signupLastName,
        !lastNameIsValid
      );

      setFieldError(
        signupEmail,
        !emailIsValid
      );

      setFieldError(
        signupPhone,
        !phoneIsValid
      );

      setFieldError(
        signupPassword,
        !passwordIsValid
      );

      setFieldError(
        confirmPassword,
        !passwordsMatch
      );

      if (signupTerms) {
        signupTerms
          .closest(".terms-option")
          ?.classList.toggle(
            "error",
            !termsAccepted
          );
      }

      if (
        !firstNameIsValid ||
        !lastNameIsValid ||
        !emailIsValid ||
        !phoneIsValid ||
        !passwordIsValid ||
        !passwordsMatch ||
        !termsAccepted
      ) {
        if (!termsAccepted) {
          alert(
            "Please agree to Korvo’s Terms of Service and Privacy Policy."
          );
        }

        return;
      }

      const accounts = readFromStorage(
        "korvoDemoAccounts",
        []
      );

      const accountAlreadyExists =
        accounts.some(
          (account) =>
            account.email.toLowerCase() ===
            email.toLowerCase()
        );

      if (accountAlreadyExists) {
        setFieldError(
          signupEmail,
          true
        );

        alert(
          "A demo account with this email already exists. Try logging in instead."
        );

        return;
      }

      const newAccount = {
        id: `KORVO-${Date.now()}`,
        firstName,
        lastName,
        email,
        phone,
        password,
        accountType,
        createdAt: new Date().toISOString()
      };

      accounts.push(newAccount);

      saveToStorage(
        "korvoDemoAccounts",
        accounts
      );

      saveDemoSession(
        accountType,
        email,
        firstName
      );

      alert(
        `Welcome to Korvo, ${firstName}! Your demo account has been created.`
      );

      redirectByAccountType(accountType);
    }
  );

  signupFirstName?.addEventListener(
    "input",
    () => {
      if (
        signupFirstName.value.trim().length >= 2
      ) {
        setFieldError(
          signupFirstName,
          false
        );
      }
    }
  );

  signupLastName?.addEventListener(
    "input",
    () => {
      if (
        signupLastName.value.trim().length >= 2
      ) {
        setFieldError(
          signupLastName,
          false
        );
      }
    }
  );

  signupEmail?.addEventListener(
    "input",
    () => {
      if (
        isValidEmail(
          signupEmail.value.trim()
        )
      ) {
        setFieldError(
          signupEmail,
          false
        );
      }
    }
  );

  signupPhone?.addEventListener(
    "input",
    () => {
      if (
        isValidPhone(
          signupPhone.value
        )
      ) {
        setFieldError(
          signupPhone,
          false
        );
      }
    }
  );

  signupPassword?.addEventListener(
    "input",
    () => {
      if (
        signupPassword.value.length >= 6
      ) {
        setFieldError(
          signupPassword,
          false
        );
      }

      if (
        confirmPassword?.value &&
        signupPassword.value ===
          confirmPassword.value
      ) {
        setFieldError(
          confirmPassword,
          false
        );
      }
    }
  );

  confirmPassword?.addEventListener(
    "input",
    () => {
      const passwordsMatch =
        confirmPassword.value.length >= 6 &&
        confirmPassword.value ===
          signupPassword?.value;

      setFieldError(
        confirmPassword,
        !passwordsMatch
      );
    }
  );

  /* =========================
     Optional Phone Formatting
     ========================= */

  signupPhone?.addEventListener(
    "input",
    () => {
      const digits = signupPhone.value
        .replace(/\D/g, "")
        .slice(0, 10);

      if (digits.length <= 3) {
        signupPhone.value = digits;
        return;
      }

      if (digits.length <= 6) {
        signupPhone.value =
          `(${digits.slice(0, 3)}) ` +
          digits.slice(3);

        return;
      }

      signupPhone.value =
        `(${digits.slice(0, 3)}) ` +
        `${digits.slice(3, 6)}-` +
        digits.slice(6);
    }
  );
});