const admin = require("firebase-admin");
const crypto = require("crypto");
const sendConfirmationCodeEmail = require("./sendConfirmationCodeEmail");
const { phoneModels, countryList } = require("./list");
const url = require("url");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    databaseURL: "https://archx-coming-soon.firebaseio.com",
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  console.log("Setting handler...");

  const clientIp = event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"];

  if (!clientIp) {
    console.log("Client IP address missing");

    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Client IP address missing." }),
    };
  }

  const body = Object.fromEntries(new url.URLSearchParams(event.body));

  console.log("Parsed body:", body);
  if (!body.email || !/\S+@\S+\.\S+/.test(body.email)) {
    console.log("Email is invalid");
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Email is invalid." }),
    };
  }

  if (!body.phoneType || !phoneModels[body.phoneType.toUpperCase()]) {
    console.log("Phone type is invalid");

    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Phone type is invalid." }),
    };
  }

  if (!body.phoneModel || !phoneModels[body.phoneType.toUpperCase()].includes(body.phoneModel)) {
    console.log("Phone model is invalid");

    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Phone model is invalid." }),
    };
  }

  if (!body.country || !countryList.includes(body.country)) {
    console.log("Country is invalid");

    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Country is invalid." }),
    };
  }
  console.log("Checking IP in Firebase");

  const ipRef = db.collection("AlphaTestersSubmissionIPAddresses").doc(clientIp);
  const submissionsRef = ipRef.collection("Submissions");

  const oneDayAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const submissionsSnapshot = await submissionsRef.where("timestamp", ">", oneDayAgo).get();

  if (submissionsSnapshot.size >= 3) {
    console.log("Rate limit exceeded");

    return {
      statusCode: 429,
      body: JSON.stringify({ success: false, message: "Rate limit exceeded." }),
    };
  }

  const uuid = crypto.randomUUID();
  console.log("UUID:", uuid);

  const confirmationCode = [...Array(6)].map(() => (~~(Math.random() * 36)).toString(36).toUpperCase()).join("");
  console.log("Confirmation Code:", confirmationCode);

  try {
    console.log("Store form document");
    await db.collection("AlphaTestersSubmissions").doc(uuid).set({
      email: body.email,
      phoneType: body.phoneType,
      phoneModel: body.phoneModel,
      country: body.country,
      confirmationCode: confirmationCode,
      clientIp: clientIp,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      confirmed: false,
    });
    console.log("Form data, UUID, and confirmation code stored successfully");

    await submissionsRef.add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Sending confirmation code email...");
    await sendConfirmationCodeEmail(body.email, confirmationCode, uuid);
    console.log("Sent confirmation code email...");
  } catch (error) {
    console.log(error);
    let errorMessage = "Internal server error";
    let statusCode = 500;
    return {
      statusCode: statusCode,
      body: JSON.stringify({ success: false, message: errorMessage, error: error.message }),
    };
  }
  console.log("Success registration");
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, uuid: uuid }),
  };
};
