function submitForm(event) {
  event.preventDefault(); // Prevent the default form submission behavior

  // Get the form element
  const form = event.target;

  // Check if reCAPTCHA is filled
  const recaptchaResponse = grecaptcha.getResponse();
  if (recaptchaResponse.length === 0) {
    // Show error message below the input
    const errorMessage = document.createElement("p");
    errorMessage.textContent = "Please complete the reCAPTCHA.";
    errorMessage.style.color = "red";
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
        successMessage.textContent = "Thank you! Form submitted successfully!";
        successMessage.style.color = "green";
        form.appendChild(successMessage);
      } else {
        // Show error message
        alert("There was an error submitting the form. Please try again.");
      }
    })
    .catch((error) => {
      // Show error message
      alert("There was an error submitting the form. Please try again.");
    });
}
