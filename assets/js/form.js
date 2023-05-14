function submitForm(event) {
  event.preventDefault(); // Prevent the default form submission behavior

  // Get the submit button
  const submitButton = event.target.querySelector("button[type='submit']");

  // Check if the submit button is disabled
  if (submitButton.disabled) {
    // If the submit button is disabled, don't proceed with form submission
    return;
  }

  const form = event.target;

  // Remove existing error or success messages
  const existingMessage = document.querySelector(".form-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  // Check if reCAPTCHA is filled
  const recaptchaResponse = grecaptcha.getResponse();
  if (recaptchaResponse.length === 0) {
    // Show error message below the input
    const errorMessage = document.createElement("p");
    errorMessage.textContent = "Please complete the reCAPTCHA.";
    errorMessage.style.color = "#FE475F";
    errorMessage.classList.add("form-message");
    form.appendChild(errorMessage);
    return;
  }

  // Send the form data to Netlify
  const formData = new FormData(form);
  fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(formData).toString(),
  })
    .then((response) => {
      if (response.ok) {
        // Clear the form
        form.reset();
        grecaptcha.reset();

        // Show success message below the input
        const successMessage = document.createElement("p");
        successMessage.textContent = "Thank you! Your email was submitted successfully!";
        successMessage.style.color = "#00CF30";
        successMessage.classList.add("form-message");
        form.appendChild(successMessage);
      } else {
        // Show error message
        const errorMessage = document.createElement("p");
        errorMessage.textContent = "There was an error submitting the form. Please try again.";
        errorMessage.style.color = "#FE475F";
        errorMessage.classList.add("form-message");
        form.appendChild(errorMessage);

        // Remove the error message after 2 seconds
        setTimeout(() => {
          errorMessage.remove();
        }, 2000);
      }
    })
    .catch((error) => {
      // Show error message
      const errorMessage = document.createElement("p");
      errorMessage.textContent = "There was an error submitting the form. Please try again.";
      errorMessage.style.color = "#FE475F";
      errorMessage.classList.add("form-message");
      form.appendChild(errorMessage);

      // Remove the error message after 2 seconds
      setTimeout(() => {
        errorMessage.remove();
      }, 2000);
    });
}
