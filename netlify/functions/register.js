const admin = require("firebase-admin");
const crypto = require("crypto");
const url = require("url");
const postmark = require("postmark");

console.log(process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"));

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

const phoneModels = {
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

const countryList = [
  "Afghanistan",
  "Aland Islands",
  "Albania",
  "Algeria",
  "American Samoa",
  "Andorra",
  "Angola",
  "Anguilla",
  "Antarctica",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Aruba",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bermuda",
  "Bhutan",
  "Bolivia",
  "Bonaire, Sint Eustatius and Saba",
  "Bosnia and Herzegovina",
  "Botswana",
  "Bouvet Island",
  "Brazil",
  "British Indian Ocean Territory",
  "Brunei Darussalam",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Cayman Islands",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Christmas Island",
  "Cocos (Keeling) Islands",
  "Colombia",
  "Comoros",
  "Congo",
  "Congo, Democratic Republic of the Congo",
  "Cook Islands",
  "Costa Rica",
  "Cote D'Ivoire",
  "Croatia",
  "Cuba",
  "Curacao",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Ethiopia",
  "Falkland Islands (Malvinas)",
  "Faroe Islands",
  "Fiji",
  "Finland",
  "France",
  "French Guiana",
  "French Polynesia",
  "French Southern Territories",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Gibraltar",
  "Greece",
  "Greenland",
  "Grenada",
  "Guadeloupe",
  "Guam",
  "Guatemala",
  "Guernsey",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Heard Island and Mcdonald Islands",
  "Holy See (Vatican City State)",
  "Honduras",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran, Islamic Republic of",
  "Iraq",
  "Ireland",
  "Isle of Man",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jersey",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Korea, Democratic People's Republic of",
  "Korea, Republic of",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Lao People's Democratic Republic",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libyan Arab Jamahiriya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Macao",
  "Macedonia, the Former Yugoslav Republic of",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Martinique",
  "Mauritania",
  "Mauritius",
  "Mayotte",
  "Mexico",
  "Micronesia, Federated States of",
  "Moldova, Republic of",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Montserrat",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "Netherlands Antilles",
  "New Caledonia",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "Niue",
  "Norfolk Island",
  "Northern Mariana Islands",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestinian Territory, Occupied",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Pitcairn",
  "Poland",
  "Portugal",
  "Puerto Rico",
  "Qatar",
  "Reunion",
  "Romania",
  "Russian Federation",
  "Rwanda",
  "Saint Barthelemy",
  "Saint Helena",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Martin",
  "Saint Pierre and Miquelon",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Serbia and Montenegro",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Sint Maarten",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Georgia and the South Sandwich Islands",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Svalbard and Jan Mayen",
  "Swaziland",
  "Sweden",
  "Switzerland",
  "Syrian Arab Republic",
  "Taiwan, Province of China",
  "Tajikistan",
  "Tanzania, United Republic of",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tokelau",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Turks and Caicos Islands",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "United States Minor Outlying Islands",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Venezuela",
  "Viet Nam",
  "Virgin Islands, British",
  "Virgin Islands, U.s.",
  "Wallis and Futuna",
  "Western Sahara",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];
