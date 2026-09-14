"use strict";

/* =========================
   Korvo Authentication
   Supabase Auth + Profiles
   ========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     Supabase Check
     ========================= */

  if (
    typeof korvoSupabase === "undefined"
  ) {
    console.error(
      "Korvo Supabase client is not available."
    );

    return;
  }


  /* =========================
     Shared Helpers
     ========================= */

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );
  }


  function isValidPhone(phone) {
    const digits =
      phone.replace(/\D/g, "");

    return digits.length >= 10;
  }


  function setFieldError(
    input,
    hasError
  ) {
    const formGroup =
      input?.closest(".form-group");

    const errorMessage =
      formGroup?.querySelector(
        ".field-error"
      );

    formGroup?.classList.toggle(
      "error",
      hasError
    );

    if (errorMessage) {
      errorMessage.style.display =
        hasError
          ? "block"
          : "none";
    }
  }


  function configurePasswordToggle(
    button,
    input
  ) {
    if (!button || !input) {
      return;
    }

    button.addEventListener(
      "click",
      () => {

        const passwordIsHidden =
          input.type === "password";

        input.type =
          passwordIsHidden
            ? "text"
            : "password";

        button.textContent =
          passwordIsHidden
            ? "Hide"
            : "Show";

        button.setAttribute(
          "aria-label",
          passwordIsHidden
            ? "Hide password"
            : "Show password"
        );
      }
    );
  }


  function setButtonLoading(
    button,
    loading,
    loadingText = "Please wait..."
  ) {
    if (!button) {
      return;
    }

    if (loading) {
      button.dataset.originalText =
        button.textContent;

      button.textContent =
        loadingText;

      button.disabled = true;
      return;
    }

    button.textContent =
      button.dataset.originalText ||
      button.textContent;

    button.disabled = false;
  }


  async function getProfile(
    userId
  ) {
    const {
      data,
      error
    } =
      await korvoSupabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }


  async function createProfileIfMissing(
    user
  ) {
    let profile =
      await getProfile(user.id);

    if (profile) {
      return profile;
    }

    const metadata =
      user.user_metadata || {};

    const newProfile = {
      id: user.id,

      first_name:
        metadata.first_name || "",

      last_name:
        metadata.last_name || "",

      phone:
        metadata.phone || "",

      email:
        user.email || "",

      account_type:
        metadata.account_type ||
        "customer",

      onboarding_complete:
        metadata.account_type ===
        "professional"
          ? false
          : true,

      is_active: true,

      updated_at:
        new Date().toISOString()
    };

    const {
      data,
      error
    } =
      await korvoSupabase
        .from("profiles")
        .insert(newProfile)
        .select()
        .single();

    if (error) {
      throw error;
    }

    return data;
  }


  function redirectByProfile(
    profile
  ) {
    const accountType =
      profile?.account_type ||
      "customer";

    if (
      accountType ===
      "professional"
    ) {

      if (
        profile?.onboarding_complete
      ) {
        window.location.href =
          "professional-dashboard.html";

        return;
      }

      window.location.href =
        "professional-onboarding.html";

      return;
    }

    window.location.href =
      "customer-dashboard.html";
  }


  /* =========================
     Login Page
     ========================= */

  const loginForm =
    document.getElementById(
      "loginForm"
    );

  const loginEmail =
    document.getElementById(
      "loginEmail"
    );

  const loginPassword =
    document.getElementById(
      "loginPassword"
    );

  const passwordToggle =
    document.getElementById(
      "passwordToggle"
    );

  const customerDemoButton =
    document.getElementById(
      "customerDemoButton"
    );

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
    async (event) => {

      event.preventDefault();

      const submitButton =
        loginForm.querySelector(
          'button[type="submit"]'
        );

      const email =
        loginEmail?.value
          .trim()
          .toLowerCase() || "";

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


      if (
        !emailIsValid ||
        !passwordIsValid
      ) {
        return;
      }


      try {

        setButtonLoading(
          submitButton,
          true,
          "Logging in..."
        );


        const {
          data,
          error
        } =
          await korvoSupabase
            .auth
            .signInWithPassword({
              email,
              password
            });


        if (error) {
          throw error;
        }


        if (!data.user) {
          throw new Error(
            "Unable to load your Korvo account."
          );
        }


        const profile =
          await createProfileIfMissing(
            data.user
          );


        redirectByProfile(
          profile
        );

      } catch (error) {

        console.error(
          "Korvo login error:",
          error
        );

        alert(
          error.message ||
          "We couldn't log you in. Please check your email and password."
        );

      } finally {

        setButtonLoading(
          submitButton,
          false
        );
      }
    }
  );


  /*
     Old demo login buttons are
     intentionally disabled now
     that Korvo uses real accounts.
  */

  customerDemoButton?.addEventListener(
    "click",
    () => {
      alert(
        "Demo login has been disabled. Please use a real Korvo account."
      );
    }
  );


  professionalDemoButton?.addEventListener(
    "click",
    () => {
      alert(
        "Demo login has been disabled. Please use a real Korvo account."
      );
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

      if (
        loginPassword.value.length >= 6
      ) {
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
    document.getElementById(
      "signupForm"
    );

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
    async (event) => {

      event.preventDefault();


      const submitButton =
        signupForm.querySelector(
          'button[type="submit"]'
        );


      const firstName =
        signupFirstName?.value
          .trim() || "";

      const lastName =
        signupLastName?.value
          .trim() || "";

      const email =
        signupEmail?.value
          .trim()
          .toLowerCase() || "";

      const phone =
        signupPhone?.value
          .trim() || "";

      const password =
        signupPassword?.value || "";

      const confirmedPassword =
        confirmPassword?.value || "";


      const accountType =
        document.querySelector(
          'input[name="accountType"]:checked'
        )?.value ||
        "customer";


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
        password ===
          confirmedPassword &&
        confirmedPassword.length >= 6;

      const termsAccepted =
        Boolean(
          signupTerms?.checked
        );


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


      try {

        setButtonLoading(
          submitButton,
          true,
          "Creating Account..."
        );


        /*
           Create the user through
           Supabase Auth.

           Password is handled by
           Supabase and is NOT saved
           in localStorage.
        */

        const {
          data,
          error
        } =
          await korvoSupabase
            .auth
            .signUp({

              email,

              password,

              options: {

  emailRedirectTo:
    "https://korvoadmin.github.io/Korvo-1.0/login.html",

  data: {

    first_name:
      firstName,

    last_name:
      lastName,

    phone,

    account_type:
      accountType
  }
}
            });


        if (error) {
          throw error;
        }


        if (!data.user) {
          throw new Error(
            "Korvo could not create your account."
          );
        }


        /*
           If Supabase immediately
           gives us a session, create
           the public profile now.

           Our RLS policy requires
           the user to be authenticated.
        */

        if (data.session) {

          const profile =
            await createProfileIfMissing(
              data.user
            );


          alert(
            `Welcome to Korvo, ${firstName}! Your account has been created.`
          );


          redirectByProfile(
            profile
          );

          return;
        }


        /*
           If email confirmation is
           enabled, Supabase may create
           the Auth user without logging
           them in yet.

           Their metadata is already
           stored securely with the
           Auth account.

           On their first confirmed
           login, Korvo creates the
           profiles row.
        */

        alert(
          `Welcome to Korvo, ${firstName}! Check your email to confirm your account. After confirming it, log in to continue.`
        );


        window.location.href =
          "login.html";


      } catch (error) {

        console.error(
          "Korvo signup error:",
          error
        );


        let message =
          error.message ||
          "We couldn't create your Korvo account.";


        if (
          message
            .toLowerCase()
            .includes(
              "already registered"
            )
        ) {

          message =
            "An account with this email already exists. Try logging in instead.";

          setFieldError(
            signupEmail,
            true
          );
        }


        alert(message);


      } finally {

        setButtonLoading(
          submitButton,
          false
        );
      }
    }
  );


  /* =========================
     Signup Field Validation
     ========================= */

  signupFirstName?.addEventListener(
    "input",
    () => {

      if (
        signupFirstName
          .value
          .trim()
          .length >= 2
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
        signupLastName
          .value
          .trim()
          .length >= 2
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
        signupPassword
          .value
          .length >= 6
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
        confirmPassword
          .value
          .length >= 6 &&
        confirmPassword.value ===
          signupPassword?.value;


      setFieldError(
        confirmPassword,
        !passwordsMatch
      );
    }
  );


  /* =========================
     Phone Formatting
     ========================= */

  signupPhone?.addEventListener(
    "input",
    () => {

      const digits =
        signupPhone.value
          .replace(/\D/g, "")
          .slice(0, 10);


      if (digits.length <= 3) {

        signupPhone.value =
          digits;

        return;
      }


      if (digits.length <= 6) {

        signupPhone.value =
          `(${digits.slice(
            0,
            3
          )}) ${digits.slice(3)}`;

        return;
      }


      signupPhone.value =
        `(${digits.slice(
          0,
          3
        )}) ` +
        `${digits.slice(
          3,
          6
        )}-` +
        digits.slice(6);
    }
  );

});