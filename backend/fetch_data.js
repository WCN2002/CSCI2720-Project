const axios = require("axios");
const fs = require("fs");
const xml2js = require("xml2js");

// URL of the XML file, one for events and one for venues
const event_url =
  "https://res.data.gov.hk/api/get-download-file?name=https%3A%2F%2Fwww.lcsd.gov.hk%2Fdatagovhk%2Fevent%2Fevents.xml";

const venue_url =
  "https://res.data.gov.hk/api/get-download-file?name=https%3A%2F%2Fwww.lcsd.gov.hk%2Fdatagovhk%2Fevent%2Fvenues.xml";

async function downloadAndParseEventsData() {
  function parseOrganizer(organizer_string) {
    if (organizer_string === "") {
      return "Organizer Not Available";
    } else {
      if (organizer_string.includes("by ")) {
        // Return the substring after "by "
        return organizer_string.split("by ")[1];
      } else {
        // If "by " is not found, return the whole string
        return organizer_string;
      }
    }
  }

  try {
    // Download the XML file
    const response = await axios.get(event_url);
    const xmlData = response.data;

    // Parse the XML
    const result = await xml2js.parseStringPromise(xmlData);

    // Extract the only required fields
    const events = result.events.event.map((event) => ({
      event_id: event.$.id,
      name: event.titlee ? event.titlee[0] : "empty event name", // title in english
      loc_id: event.venueid ? event.venueid[0] : "empty loc id", // location id, need to find actual venue name in venues xml
      // date: event.predateE ? parseDate(event.predateE[0]) : new Date(0), // Date() in UTC timezone
      date: event.predateE ? event.predateE[0] : "empty date", // Date() in UTC timezone
      description: event.desce
        ? event.desce[0] === ""
          ? "Description Not Available"
          : event.desce[0]
        : "Description Field Not Available", // description in english
      organizer: event.presenterorge
        ? parseOrganizer(event.presenterorge[0])
        : "Organizer Field Not Available", // organizer of the event
      // price: event.pricee ? Number(event.pricee[0].replace("$", "")) : 99999, // price, if not specified, set to 99999
      price: event.pricee
        ? event.pricee[0] === ""
          ? "Price Not Available"
          : event.pricee[0]
        : "Price Field Not Available", // price
    }));

    return events;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

async function downloadAndParseVenuesXML() {
  try {
    // Download the XML file
    const response = await axios.get(venue_url);
    const xmlData = response.data;

    // Parse the XML
    const result = await xml2js.parseStringPromise(xmlData);

    // Extract the required fields
    const venues = result.venues.venue.map((venue) => ({
      loc_id: venue.$.id,
      name: venue.venuee ? venue.venuee[0] : "empty location name",
      coordinate: {
        latitude: venue.latitude ? Number(venue.latitude[0]) : 0,
        longitude: venue.longitude ? Number(venue.longitude[0]) : 0,
      },
      comments: [],
      hosted_event: [],
    }));

    return venues;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

module.exports = {
  downloadAndParseEventsData,
  downloadAndParseVenuesXML,
};

// for testing purposes
if (require.main === module) {
  Promise.all([downloadAndParseEventsData(), downloadAndParseVenuesXML()])
    .then(([events, venues]) => {
      console.log("Both XML files have been processed successfully.");
      fs.writeFileSync(
        "./backend/data/venues.json",
        JSON.stringify(venues, null, 4),
        "utf8"
      );
      console.log("Conversion complete. JSON data saved to venues.json");
      fs.writeFileSync(
        "./backend/data/events.json",
        JSON.stringify(events, null, 4),
        "utf8"
      );
      console.log("Conversion complete. JSON data saved to events.json");
    })
    .catch((error) => {
      console.error(`Error processing XML files: ${error}`);
    });
}
