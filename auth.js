"use strict";

/* =========================
   Korvo Authentication Demo
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");

  const passwordToggle = document.getElementById("passwordToggle");
  const customerDemoButton = document.getElementById(
    "customerDemoButton"
  );
  const professionalDemoButton = document.getElementById(
    "professionalDemoButton"
  );

  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");

  /* =========================
     Helper Functions
     ========================= */

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setFieldError(input, errorElement, hasError) {
    const formGroup = input?.closest(".form-group");

    formGroup?.classList.toggle("error", hasError);

    if (errorElement) {
      errorElement.style.display = hasError
        ? "block"
        : "none";
    }
  }

  function saveDemoSession(accountType, email) {
    const session = {
      accountType,
      email,
      loggedIn: true,
      loginTime: new Date().toISOString()
    };

    try {
      localStorage.setItem(
        "korvoDemoSession",
        JSON.stringify(session)
      );
    } catch (error) {
      console.error(
        "Unable to save Korvo demo session:",
        error
      );
    }
  }

  function redirectByAccountType(accountType) {
    if (accountType === "professional") {
      window.location.href = "dashboard.html";
      return;
    }

    window.location.href = "customer-dashboard.html";
  }

  /* =========================
     Password Visibility
     ========================= */

  passwordToggle?.addEventListener("click", () => {
    if (!loginPassword) {
      return;
    }

    const passwordIsHidden =
      loginPassword.type === "password";

    loginPassword.type = passwordIsHidden
      ? "text"
      : "password";

    passwordToggle.textContent = passwordIsHidden
      ? "Hide"
      : "Show";

    passwordToggle.setAttribute(
      "aria-label",
      passwordIsHidden
        ? "Hide password"
        : "Show password"
    );
  });

  /* =========================
     Login Form
     ========================= */

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = loginEmail?.value.trim() || "";
    const password = loginPassword?.value || "";

    const emailIsValid = isValidEmail(email);
    const passwordIsValid = password.length >= 6;

    setFieldError(
      loginEmail,
      emailError,
      !emailIsValid
    );

    setFieldError(
      loginPassword,
      passwordError,
      !passwordIsValid
    );

    if (!emailIsValid || !passwordIsValid) {
      return;
    }

    /*
      Temporary front-end demo login.

      Until Korvo has real authentication,
      an email containing "pro" or "contractor"
      opens the professional dashboard.
      Other emails open the customer dashboard.
    */

    const normalizedEmail = email.toLowerCase();

    const accountType =
      normalizedEmail.includes("pro") ||
      normalizedEmail.includes("contractor")
        ? "professional"
        : "customer";

    saveDemoSession(accountType, email);
    redirectByAccountType(accountType);
  });

  /* =========================
     Demo Account Buttons
     ========================= */

  customerDemoButton?.addEventListener(
    "click",
    () => {
      saveDemoSession(
        "customer",
        "customer@korvo.demo"
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
        "professional@korvo.demo"
      );

      window.location.href =
        "dashboard.html";
    }
  );

  /* =========================
     Clear Errors While Typing
     ========================= */

  loginEmail?.addEventListener("input", () => {
    if (isValidEmail(loginEmail.value.trim())) {
      setFieldError(
        loginEmail,
        emailError,
        false
      );
    }
  });

  loginPassword?.addEventListener("input", () => {
    if (loginPassword.value.length >= 6) {
      setFieldError(
        loginPassword,
        passwordError,
        false
      );
    }
  });
});