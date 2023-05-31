const admin = require("firebase-admin");
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

exports.handler = async (event) => {
  const body = Object.fromEntries(new url.URLSearchParams(event.body));
  console.log(body);
  if (!body.uuid || !body.confirmationCode) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: "UUID or confirmation code is missing." }),
    };
  }

  try {
    const doc = await db.collection("AlphaTestersSubmissions").doc(body.uuid).get();

    if (!doc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: "UUID not found." }),
      };
    }

    const data = doc.data();

    if (data.confirmationCode !== body.confirmationCode.toUpperCase()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Confirmation code does not match." }),
      };
    }

    const now = Date.now();
    const validTime = data.timestamp.toMillis() + 30 * 60 * 1000;
    if (now > validTime) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Confirmation code has expired." }),
      };
    }

    await db.collection("AlphaTestersSubmissions").doc(body.uuid).update({
      confirmed: true,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Email confirmed successfully." }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: "Internal server error.", details: error.message }),
    };
  }
};
