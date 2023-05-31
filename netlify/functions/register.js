const admin = require("firebase-admin");
const crypto = require("crypto");
const sendConfirmationCodeEmail = require("./sendConfirmationCodeEmail");
const { phoneModels, countryList } = require("./list");

console.log("Attempting to initialize Firebase Admin...");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    databaseURL: "https://archx-coming-soon.firebaseio.com",
  });
  console.log("Firebase Admin initialized successfully!");
} else {
  console.log("Firebase Admin already initialized!");
}

const db = admin.firestore();
console.log("Firestore initialized");

exports.handler = async (event, context) => {
  console.log("Handler triggered");

  // (Rest of your code here...)

  console.log("Checking IP in Firebase...");
  const ipRef = db.collection("AlphaTestersSubmissionIPAddresses").doc(clientIp);
  const ipDoc = await ipRef.get();

  // (Rest of your code here...)

  console.log("Storing form data, UUID, and confirmation code...");
  try {
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

    // (Rest of your code here...)

    console.log("Sending confirmation code email...");
    await sendConfirmationCodeEmail({
      email: body.email,
      confirmationCode: confirmationCode,
      uuid: uuid,
    });
    console.log("Confirmation code email sent successfully");
  } catch (error) {
    console.log("Error encountered: ", error);
    // (Rest of your error handling code here...)
  }

  console.log("Function execution completed successfully!");

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, uuid: uuid }),
  };
};
