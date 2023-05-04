function submitForm(event) {
  event.preventDefault(); // Prevent the default form submission behavior

  const myForm = event.target;
  const formData = new FormData(myForm);

  // Send the form data to Netlify
  fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(formData).toString(),
  })
    .then((response) => {
      if (response.ok) {
        // Show success message
        alert("Form submitted successfully!");
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
