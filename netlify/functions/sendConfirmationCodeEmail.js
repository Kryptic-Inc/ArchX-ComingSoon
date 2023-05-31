const postmark = require("postmark");

const sendConfirmationCodeEmail = async (email, confirmationCode, uuid) => {
  try {
    console.log("Creating Postmark Client...");
    console.log(process.env.EMAIL_PROVIDER_KEY);
    const client = new postmark.ServerClient("56aa55fa-2b52-4c06-9799-f761eba3e379");

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
