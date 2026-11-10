import mongoose from 'mongoose';
import Destination from '../src/models/Destination.js';
import Package from '../src/models/Package.js';
const places = [
  [
    'Maldives',
    'Maldives',
    'Coast',
    5,
    'Island Escape',
    'Relaxed island days and coastal scenery. Resort, transfer and flight options require a personalised quote.',
    ['Beach relaxation', 'Island sightseeing', 'Optional guided marine excursion'],
    ['Indoor dining', 'Local cultural exhibits'],
    'https://visitmaldives.com/en/places',
  ],
  [
    'Dubai',
    'United Arab Emirates',
    'City',
    5,
    'City and Coast',
    'Discover waterfront neighbourhoods and modern city sights. Activities and admission costs depend on your chosen itinerary.',
    ['Dubai Creek walk', 'Al Fahidi neighbourhood', 'Beach promenade'],
    ['Museum visit', 'Indoor shopping and dining'],
    'https://www.visitdubai.com/en/things-to-do/dubai-attractions',
  ],
  [
    'Singapore',
    'Singapore',
    'City',
    4,
    'City Discovery',
    'Plan a city break around neighbourhood walks and waterfront landmarks. Attractions and transport are quoted separately.',
    ['Marina Bay walk', 'Explore Little India', 'Singapore River waterfront'],
    ['Museum visit', 'Indoor galleries'],
    'https://www.visitsingapore.com/',
  ],
  [
    'Bali',
    'Indonesia',
    'Nature',
    6,
    'Island and Culture',
    'A proposed island itinerary combining cultural exploration and time to unwind. Local transfers and activities require a quote.',
    ['Explore local crafts', 'Coastal sightseeing', 'Nature walk with local advice'],
    ['Craft workshop', 'Regional cooking experience'],
    'https://www.indonesia.travel/',
  ],
  [
    'Bangkok',
    'Thailand',
    'City',
    4,
    'Culture and City Break',
    'Plan neighbourhood sightseeing and local food stops with flexible leisure time. Confirm attraction access and local transport before travel.',
    ['Neighbourhood walks', 'Local markets', 'Riverside sightseeing'],
    ['Museum visit', 'Indoor food markets'],
    'https://www.tourismthailand.org/',
  ],
  [
    'Colombo',
    'Sri Lanka',
    'City',
    4,
    'Coastal City Break',
    'A flexible city and coastal itinerary designed around your preferences. International travel requirements and all fares need confirmation.',
    ['Waterfront walk', 'Local markets', 'City sightseeing'],
    ['Museum visit', 'Local dining'],
    'https://www.srilanka.travel/',
  ],
  [
    'Goa',
    'Goa, India',
    'Coast',
    4,
    'Coastal Getaway',
    'A relaxed coastal itinerary with local culture and leisure time. Departure city, hotel category and transfers determine the final quote.',
    ['Beach walk', 'Explore local markets', 'Heritage neighbourhoods'],
    ['Local art galleries', 'Regional cuisine'],
    'https://www.incredibleindia.gov.in/',
  ],
  [
    'Jaipur',
    'Rajasthan, India',
    'Heritage',
    4,
    'Heritage Getaway',
    'Explore local crafts and heritage areas at your own pace. Entry tickets, guide services and transport are not confirmed until quoted.',
    ['Heritage sightseeing', 'Craft markets', 'Local food walks'],
    ['Museum visit', 'Craft workshop'],
    'https://www.incredibleindia.gov.in/',
  ],
  [
    'New Delhi',
    'Delhi, India',
    'City',
    3,
    'Capital Discovery',
    'A proposed capital-city itinerary with culture, neighbourhood exploration and leisure. Confirm opening hours and local conditions.',
    ['City sightseeing', 'Neighbourhood exploration', 'Local markets'],
    ['Museum visit', 'Art galleries'],
    'https://www.incredibleindia.gov.in/',
  ],
  [
    'Munnar',
    'Kerala, India',
    'Nature',
    4,
    'Hillside Retreat',
    'Plan a hill-country break with nature and local discoveries. Weather, access restrictions and travel conditions can change activities.',
    ['Hill viewpoints', 'Nature walks', 'Local tea experiences'],
    ['Indoor tea tasting', 'Local craft shops'],
    'https://www.keralatourism.org/',
  ],
];
try {
  await mongoose.connect('mongodb://127.0.0.1:27017/oor_suthalam_local', {
    serverSelectionTimeoutMS: 5000,
  });
  let destinations = 0,
    packages = 0;
  for (const [
    name,
    region,
    category,
    days,
    title,
    description,
    activities,
    indoorActivities,
    source,
  ] of places) {
    let destination = await Destination.findOne({ name }).collation({
      locale: 'en',
      strength: 2,
    });
    if (!destination) {
      destination = await Destination.create({
        name,
        region,
        category,
        description:
          description +
          ' Destination information: ' +
          source +
          ' No verified daily budget is available; request a quote. Activities are suggestions, not confirmed inclusions.',
        dailyBudget: 0,
        image: '',
        activities,
        indoorActivities,
      });
      destinations++;
    }
    const result = await Package.updateOne(
      { title: `${name} · ${title}`, destination: destination._id },
      {
        $setOnInsert: {
          title: `${name} · ${title}`,
          destination: destination._id,
          days,
          price: 0,
          priceMode: 'quote',
          travelType: 'flight',
          active: true,
          description:
            description +
            ' Flight-based planning enquiry only: airfare, baggage, hotels, visas, transfers and activities must be quoted and confirmed separately. No airline reservation or ticket is created by this website.',
          inclusions: [
            'Personalised itinerary planning request',
            'Airfare and land services to be quoted separately; no paid services are confirmed',
          ],
        },
      },
      { upsert: true, runValidators: true },
    );
    packages += result.upsertedCount;
  }
  console.log(
    `Added ${destinations} destinations and ${packages} quote-based flight itineraries. Photos and existing records preserved.`,
  );
} catch {
  console.error('Local international catalog update failed; existing records preserved.');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
