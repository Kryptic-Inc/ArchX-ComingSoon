function submitForm(event) {
  event.preventDefault(); // Prevent the default form submission behavior
  return;
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
  if (window.location.hostname !== "localhost") {
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

var phoneModels = {
  ANDROID: [
    "Other Android",
    "Samsung Galaxy A12",
    "Samsung Galaxy A14",
    "Samsung Galaxy A34",
    "Samsung Galaxy A54",
    "Samsung Galaxy S20",
    "Samsung Galaxy S21",
    "Samsung Galaxy S21 FE",
    "Samsung Galaxy S21 Ultra",
    "Samsung Galaxy S22",
    "Samsung Galaxy S22 Ultra",
    "Samsung Galaxy S23",
    "Samsung Galaxy S23 Ultra",
    "Google Pixel 4",
    "Google Pixel 4 XL",
    "Google Pixel 5",
    "Google Pixel 5a",
    "Google Pixel 6",
    "Google Pixel 6 Pro",
    "Google Pixel 7",
    "Google Pixel 7 Pro",
    "OnePlus 5",
    "OnePlus 5T",
    "OnePlus 6",
    "OnePlus 6T",
    "OnePlus 7",
    "OnePlus 7 Pro",
    "OnePlus 8",
    "OnePlus 8 Pro",
    "Huawei P60",
    "Huawei P60 Pro",
    "Huawei P30",
    "Huawei P30 Pro",
    "Xiaomi Redmi Note 11",
    "Xiaomi Redmi Note 12",
    "Xiaomi Redmi Note 12 Pro",
    "Xiaomi Poco F5",
    "Xiaomi Poco F5 Pro",
    "LG V60 ThinQ",
    "LG V50 ThinQ",
    "LG G8 ThinQ",
    "LG Velvet",
    "LG Wing",
    "Motorola Edge 30",
    "Motorola Edge 40",
    "Motorola Edge 40 Pro",
    "Motorola Moto G",
  ],
  IOS: [
    "Other iPhone",
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
