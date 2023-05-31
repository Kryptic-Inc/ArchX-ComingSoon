const postmark = require("postmark");

const sendConfirmationCodeEmail = async (email, confirmationCode, uuid) => {
  try {
    console.log("Creating Postmark Client...");

    const client = new postmark.ServerClient(process.env.NETLIFY_EMAILS_PROVIDER_API_KEY);

    console.log("Creating Template Model ");

    const templateModel = {
      confirmation_code: confirmationCode,
      confirmation_link: `https://archx.io/email-confirmation?uuid=${uuid}`,
    };

    console.log("Template:", templateModel);

    console.log("Creating email message");
    const message = {
      From: "support@archx.io",
      To: email,
      TemplateAlias: "alpha-test-confirmation-email",
      TemplateModel: templateModel,
    };

    console.log("Message:", message);

    console.log("Sending email...");
    await client.sendEmailWithTemplate(message);
    console.log("Sent email...");
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = sendConfirmationCodeEmail;
