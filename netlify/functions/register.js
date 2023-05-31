const admin = require("firebase-admin");
const crypto = require("crypto");
const sendConfirmationCodeEmail = require("./sendConfirmationCodeEmail");
const { phoneModels, countryList } = require("./list");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
    databaseURL: "https://archx-coming-soon.firebaseio.com",
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  // Check rate limit

  const clientIp = event.headers["client-ip"];
  if (!clientIp) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Client IP address missing." }),
    };
  }

  const body = JSON.parse(event.body);
  // Email validation
  if (!body.email || !/\S+@\S+\.\S+/.test(body.email)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Email is invalid." }),
    };
  }

  // Phone type validation
  if (!body.phoneType || !phoneModels[body.phoneType.toUpperCase()]) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Phone type is invalid." }),
    };
  }

  // Phone model validation
  if (!body.phoneModel || !phoneModels[body.phoneType.toUpperCase()].includes(body.phoneModel)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Phone model is invalid." }),
    };
  }

  if (!body.country || !countryList.includes(body.country)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Country is invalid." }),
    };
  }

  const ipRef = db.collection("AlphaTestersSubmissionIPAddresses").doc(clientIp);
  const ipDoc = await ipRef.get();

  if (ipDoc.exists) {
    const submissions = ipDoc.data().submissions.filter((timestamp) => {
      // Remove timestamps older than 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return timestamp.toDate() > oneDayAgo;
    });

    if (submissions.length >= 3) {
      return {
        statusCode: 429,
        body: JSON.stringify({ success: false, message: "Rate limit exceeded." }),
      };
    }
  }

  // Generate a UUID
  const uuid = crypto.randomUUID();

  // Generate a random 6 character alphanumeric confirmation code (not case sensitive)
  const confirmationCode = [...Array(6)].map(() => (~~(Math.random() * 36)).toString(36).toUpperCase()).join("");

  // Store the form data, UUID, and confirmation code, along with the IP address and the current timestamp
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

    // Update the IP address document
    await ipRef.set(
      {
        submissions: admin.firestore.FieldValue.arrayUnion(admin.firestore.FieldValue.serverTimestamp()),
      },
      { merge: true }
    );

    // Sending the confirmation code email
    await sendConfirmationCodeEmail({
      email: body.email,
      confirmationCode: confirmationCode,
      uuid: uuid,
    });
  } catch (error) {
    let errorMessage = "Internal server error";
    let statusCode = 500;

    if (error instanceof EmailError) {
      errorMessage = "Failed to send confirmation code email";
      statusCode = 400;
    }

    return {
      statusCode: statusCode,
      body: JSON.stringify({ success: false, message: errorMessage, error: error.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, uuid: uuid }),
  };
};