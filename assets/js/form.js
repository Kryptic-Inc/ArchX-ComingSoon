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
  // Check if all fields are filled
  for (let i = 0; i < form.elements.length; i++) {
    const element = form.elements[i];
    const elementType = element.nodeName.toLowerCase();

    // Exclude the honeypot field from the validation
    if (element.getAttribute("name") === "bot-field") continue;

    // Check if the element is an input, select or textarea
    if (["input", "select", "textarea"].includes(elementType)) {
      if (!element.value) {
        // Show error message below the input
        const errorMessage = document.createElement("p");
        errorMessage.textContent = "Please fill all fields.";
        errorMessage.style.color = "#FE475F";
        errorMessage.classList.add("form-message");
        form.appendChild(errorMessage);
        return;
      }
    }
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
  fetch("/.netlify/functions/register", {
    // Change this to your actual Netlify function endpoint
    method: "POST",
    body: new URLSearchParams(formData).toString(),
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        // Clear the form
        form.reset();

        // Redirect user to the confirmation page with the UUID in the URL
        window.location.href = `/email-confirmation?uuid=${data.uuid}`;
      } else {
        // Show error message
        const errorMessage = document.createElement("p");
        errorMessage.textContent = data.message || "There was an error submitting the form. Please try again.";
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

var phoneModels = {
  Android: ["Samsung Galaxy S20", "Google Pixel 4", "OnePlus 8", "LG V60", "Motorola Edge Plus"],
  iOS: [
    "iPhone 14 Plus",
    "iPhone 14 Pro Max",
    "iPhone 14 Pro",
    "iPhone 14",
    "iPhone 13 Pro Max",
    "iPhone 13 Pro",
    "iPhone 13",
    "iPhone 13 mini",
    "iPhone 12 Pro Max",
    "iPhone 12 Pro",
    "iPhone 12",
    "iPhone 12 mini",
    "iPhone 11 Pro Max",
    "iPhone 11 Pro",
    "iPhone 11",
    "iPhone SE",
    "Other iPhone",
  ],
};

function updatePhoneModels(phoneType) {
  var phoneModelDropdown = document.getElementById("phoneModel");
  phoneModelDropdown.length = 0;
  var models = phoneModels[phoneType];
  if (models) {
    models.forEach(function (model) {
      var option = document.createElement("option");
      option.text = model;
      phoneModelDropdown.add(option);
    });
  }
}
