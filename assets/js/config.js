/* ==========================================================================
   Tooth Care Centre - site settings.  EDIT THIS FILE to connect things.
   Nothing here is connected yet: the booking form works on screen but does
   not send data anywhere until you fill in `bookingEndpoint` below.
   ========================================================================== */
window.TCC_CONFIG = {

  /* 1) BOOKING DATA RECEIVER (not connected yet)
     Paste the URL that should receive booking requests (Google Apps Script
     web app, Formspree, Make/Zapier webhook, your own API, etc.).
     The form POSTs JSON: { name, phone, service, serviceLabel, date,
     dateLabel, slot, slotLabel, note, pageUrl, createdAt }            */
  bookingEndpoint: "",

  /* 2) WHATSAPP (not connected yet)
     Country code + number, digits only. Example: "917509999033".
     When filled, a WhatsApp button appears site-wide and on the booking
     confirmation screen.                                              */
  whatsappNumber: "",
  whatsappMessage: "Hello Tooth Care Centre, I would like to book an appointment.",

  /* 3) SOCIAL LINKS - paste full page URLs. Empty ones stay inactive. */
  social: {
    facebook: "",
    instagram: "",
    youtube: "",
    google: "https://maps.app.goo.gl/jtdkNRxm5jAKcrrV9"
  },

  /* 4) Link used by "Read all reviews on Google" */
  reviewsUrl: "https://maps.app.goo.gl/jtdkNRxm5jAKcrrV9",

  /* Booking sender. Replace the body only if your receiver needs another
     format (for example form-encoded data instead of JSON).           */
  submitBooking: function (payload) {
    var url = window.TCC_CONFIG.bookingEndpoint;
    if (!url) { return Promise.resolve({ ok: true, delivered: false }); }   // not connected
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },              // works with Apps Script without CORS preflight
      body: JSON.stringify(payload)
    }).then(function (r) { return { ok: r.ok, delivered: r.ok }; })
      .catch(function () { return { ok: false, delivered: false }; });
  }
};
