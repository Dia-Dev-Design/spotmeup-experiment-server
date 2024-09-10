const { Schema, model } = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const puppeteer = require("puppeteer");
const fs = require("fs");
const QRCode = require("qrcode");
const cloudinary = require("cloudinary").v2;

const ticketSchema = new Schema(
  {
    name: String,
    eventDate: String,
    eventTime: String,
    price: Number,
    qrCode: String,
    status: {
      type: String,
      default: "active",
      enum: ["active", "expired", "canceled", "scanned"],
    },
    scanned: {
      hasScanned: { type: Boolean, default: false },
      dateScanned: { type: Date },
    },
    buyer: { type: Schema.Types.ObjectId, ref: "Users" },
    event: { type: Schema.Types.ObjectId, ref: "Events" },
    layout: { type: Schema.Types.ObjectId, ref: "Layouts" },
    block: { type: Schema.Types.ObjectId, ref: "Blocks" },
    //add tableID, if any
    //extras (bottles), if any
    transaction: { type: Schema.Types.ObjectId, ref: "Transaction" },
    email: { type: String },
  },
  {
    timestamps: true,
  }
);

ticketSchema.pre("save", async function (next) {
  try {
    if (this.event) {
      await this.populate("event");
      this.name = this.event.name;
      this.eventDate = this.event.date;
      this.eventTime = this.event.time;
      this.qrCode = uuidv4();
    }
    next();
  } catch (error) {
    throw error;
  }
});

ticketSchema.methods.markAsScanned = async function () {
  this.scanned.hasScanned = true;
  this.status = "scanned";
  this.scanned.dateScanned = new Date();
  await this.save();
};

ticketSchema.statics.generateQRCodes = async function (qrTextArray) {
  try {
    const qrCodesArray = await Promise.all(
      qrTextArray.map((qrText) => QRCode.toDataURL(qrText))
    );
    return qrCodesArray;
  } catch (err) {
    console.error("QR Code Generation Error:", err);
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

ticketSchema.statics.uploadQRCodeToCloudinary = async function (dataUrl) {
  try {
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: "SpotMeUp/qr-codes",
      resource_type: "image",
    });
    return result.secure_url;
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
  }
};

ticketSchema.statics.generatePDFForTickets = async function (
  tickets,
  transaction
) {
  const qrCodeDataUrlArray = await this.generateQRCodes(
    tickets.map((ticket) => ticket.qrCode)
  );

  const qrCodeImageUrlArray = await Promise.all(
    qrCodeDataUrlArray.map((dataUrl) => this.uploadQRCodeToCloudinary(dataUrl))
  );

  const html = `
   <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        /* text-align: center; */
      }
      h1 {
        color: #333;
      }
      img {
        margin: 20px;
        width: 150px;
        height: 150px;
      }

      .spotmeup-image {
      }
      .logo-container {
        display: flex;
      }
      .ticket-container {
        display: flex;
        justify-content: center;
      }
      .outer-ticket {
        border: 4px solid black;
        border-radius: 25px;
        height: 300px;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 90%;
        position: relative;
      }
      .page-break {
        page-break-after: always; 
      }
    </style>
  </head>
  <body>
    <div class="logo-container">
      <img src="https://res.cloudinary.com/dejxbgfuk/image/upload/v1725751009/spotmeup-logo_blddqn.png" alt="spotmeup-logo" class="spotmeup-image" />
    </div>

    ${tickets
      .map(
        (ticket, index) => `
        <div>
          <h3>Ticket #${index + 1}</h3>
          <p>Buyer: ${ticket.buyer.name}</p>
          <div class="ticket-container">
            <div class="outer-ticket">
              <img src="${qrCodeImageUrlArray[index]}" />
            </div>
          </div>
        </div>
        <div class="page-break"></div>`
      )
      .join("<hr />")} 
    <p>Best regards,</p>
    <p>The SpotMeUp Team</p>
  </body>
</html>
`;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  const pdfPath = `./tickets-${transaction._id}.pdf`;
  fs.writeFileSync(pdfPath, pdfBuffer);

  return pdfPath;
};

module.exports = model("Ticket", ticketSchema);
