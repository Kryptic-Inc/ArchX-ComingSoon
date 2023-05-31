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

  // Concatenate all the fields into a single string
  const confirmationCode = [
    form.elements.char1.value,
    form.elements.char2.value,
    form.elements.char3.value,
    form.elements.char4.value,
    form.elements.char5.value,
    form.elements.char6.value,
  ].join("");

  // Check if all fields are filled
  if (confirmationCode.length !== 6) {
    // Show error message below the input
    const errorMessage = document.createElement("p");
    errorMessage.textContent = "Please fill all fields.";
    errorMessage.style.color = "#FE475F";
    errorMessage.classList.add("form-message");
    form.appendChild(errorMessage);
    return;
  }

  // Send the form data to Netlify
  const formData = new FormData();
  formData.append("confirmationCode", confirmationCode);

  fetch("/.netlify/functions/confirm", {
    // Change this to your actual Netlify function endpoint
    method: "POST",
    body: new URLSearchParams(formData).toString(),
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        // Replace the form with a success message
        const successMessage = document.createElement("p");
        successMessage.textContent = "Thank you! Your email has been confirmed successfully.";
        successMessage.style.color = "#28A745";
        successMessage.classList.add("form-message");
        form.parentNode.replaceChild(successMessage, form);
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

// Adding event listener to the form
document.forms.confirmationCode.addEventListener("submit", submitForm);
