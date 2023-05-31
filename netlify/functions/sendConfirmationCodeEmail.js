const postmark = require("postmark");

const sendConfirmationCodeEmail = async (email, confirmationCode, uuid) => {
  try {
    const client = new postmark.ServerClient(process.env.NETLIFY_EMAILS_PROVIDER_API_KEY);

    // Prepare the template model
    const templateModel = {
      confirmation_code: confirmationCode, // Assign the actual confirmationCode to the template model
      confirmation_link: `https://archx.io/email-confirmation?uuid=${uuid}`,
    };

    // Create the email content
    const message = {
      From: "support@archx.io",
      To: email,
      TemplateAlias: "alpha-test-confirmation-email",
      TemplateModel: templateModel,
    };

    // Send the email
    await client.sendEmailWithTemplate(message);
  } catch (error) {
    // Throw a custom error
    throw new EmailError(error.message);
  }
};

class EmailError extends Error {
  constructor(message) {
    super(message);
    this.name = "EmailError";
  }
}

module.exports = { sendConfirmationCodeEmail, EmailError };
