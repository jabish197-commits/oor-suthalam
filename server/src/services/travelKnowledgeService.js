import { currentWeather } from './weatherService.js';
import Destination from '../models/Destination.js';
import Package from '../models/Package.js';
import { originCities } from '../data/tamilNaduCatalog.js';
const tamilNames = {
  Alappuzha: 'ஆலப்புழா',
  Kochi: 'கொச்சி',
  Munnar: 'மூணாறு',
  Wayanad: 'வயநாடு',
  Chennai: 'சென்னை',
  Madurai: 'மதுரை',
  Kanyakumari: 'கன்னியாகுமரி',
  Ooty: 'ஊட்டி',
  Coonoor: 'குன்னூர்',
  Rameswaram: 'ராமேஸ்வரம்',
  Chettinad: 'செட்டிநாடு',
  Kodaikanal: 'கொடைக்கானல்',
};
import { suggestFromBudget, straightLineKm } from './budgetPlannerService.js';
const money = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
export function extractBudget(text) {
  let normalized = text.replace(/[௦-௯]/g, (c) => String('௦௧௨௩௪௫௬௭௮௯'.indexOf(c)));
  const words = {
    'five thousand': '5000',
    'ten thousand': '10000',
    'twenty thousand': '20000',
    ஐந்தாயிரம்: '5000',
    பத்தாயிரம்: '10000',
    இருபதாயிரம்: '20000',
  };
  for (const [word, value] of Object.entries(words))
    normalized = normalized.replaceAll(word, value);
  const hit =
    normalized.match(
      /(?:₹|budget|rs\.?|rupees|பட்ஜெட்|பட்ஜெட்டு|பட்ஜட்)[^\d]{0,30}(\d[\d,]*(?:\.\d+)?)\s*(k\b|thousand|ஆயிரம்|lakh|லட்சம்)?/i,
    ) ||
    normalized.match(
      /(\d[\d,]*(?:\.\d+)?)\s*(k\b|thousand|ஆயிரம்|lakh|லட்சம்)?\s*(?:₹|rs\.?|rupees|ரூபாய்|பட்ஜெட்|budget)/i,
    );
  if (!hit) return null;
  const amount =
    Number(hit[1].replaceAll(',', '')) *
    (/k|thousand|ஆயிரம்/i.test(hit[2] || '')
      ? 1000
      : /lakh|லட்சம்/i.test(hit[2] || '')
        ? 100000
        : 1);
  return Number.isFinite(amount) && amount >= 1 && amount <= 100000000 ? amount : null;
}
export const travelKnowledgeService = {
  async reply(messages, replyLanguage, location) {
    const question = messages.at(-1)?.text || '';
    const tamil =
      replyLanguage === 'ta-IN' || (!replyLanguage && /[\u0B80-\u0BFF]/.test(question));
    if (
      /weather|temperature|forecast|வானிலை|வெப்பநிலை|மழை|வெயில்|காலநிலை/i.test(question)
    ) {
      const places = await Destination.find({
        active: { $ne: false },
        region: /Tamil Nadu|Kerala/i,
      });
      const aliases = {
        ...tamilNames,
        Munnar: 'மூணாறு',
        Wayanad: 'வயநாடு',
        Alappuzha: 'ஆலப்புழா',
        Kochi: 'கொச்சி',
        Varkala: 'வர்க்கலா',
        Thekkady: 'தேக்கடி',
        Kumarakom: 'குமரகம்',
        Kovalam: 'கோவளம்',
        Vagamon: 'வாகமன்',
        Thiruvananthapuram: 'திருவனந்தபுரம்',
        Athirappilly: 'அதிரப்பள்ளி',
        Bekal: 'பேக்கல்',
        Thanjavur: 'தஞ்சாவூர்',
        Pollachi: 'பொள்ளாச்சி',
        Valparai: 'வால்பாறை',
        Vellore: 'வேலூர்',
        Yelagiri: 'ஏலகிரி',
        Yercaud: 'ஏற்காடு',
        Tiruchirappalli: 'திருச்சி',
        Kanchipuram: 'காஞ்சிபுரம்',
        Mamallapuram: 'மாமல்லபுரம்',
        Pichavaram: 'பிச்சாவரம்',
        Tiruchendur: 'திருச்செந்தூர்',
        Courtallam: 'குற்றாலம்',
        Tharangambadi: 'தரங்கம்பாடி',
        Tiruvannamalai: 'திருவண்ணாமலை',
        Kumbakonam: 'கும்பகோணம்',
        Kotagiri: 'கோத்தகிரி',
        Hogenakkal: 'ஒகேனக்கல்',
        'Kolli Hills': 'கொல்லிமலை',
      };
      let matches = places
        .filter(
          (p) =>
            question.toLowerCase().includes(p.name.toLowerCase()) ||
            (aliases[p.name] && question.includes(aliases[p.name])),
        )
        .slice(0, 3);
      if (!matches.length && /there|அங்கே|அங்கு/i.test(question)) {
        const previous =
          messages
            .slice(0, -1)
            .reverse()
            .find((m) => m.role === 'user')?.text || '';
        matches = places
          .filter(
            (p) =>
              previous.toLowerCase().includes(p.name.toLowerCase()) ||
              (aliases[p.name] && previous.includes(aliases[p.name])),
          )
          .slice(0, 3);
      }
      if (!matches.length)
        return {
          text: tamil
            ? 'எந்த இடத்தின் இன்றைய வானிலை வேண்டும்? இடத்தின் பெயரைச் சொல்லுங்கள்.'
            : 'Which destination’s weather would you like? Tell me the place name.',
          cards: [],
        };
      const replies = await Promise.all(
        matches.map(async (p) => {
          try {
            return await currentWeather(p, tamil);
          } catch {
            return tamil
              ? p.name +
                  ' — தற்போதைய வானிலை கிடைக்கவில்லை. சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.'
              : p.name + ' — current weather is unavailable. Please try again shortly.';
          }
        }),
      );
      return { text: replies.join('\n\n'), cards: [] };
    }
    const distanceIntent =
      /distance|nearby|nearest|how far|கிலோமீட்டர்|கிமீ|தூரம்|அருகில/i.test(question);
    if (distanceIntent) {
      if (!location)
        return {
          text: tamil
            ? 'Settings-ல் “Use my location” அழுத்தி location அனுமதி கொடுங்கள். அதன் பிறகு அருகிலுள்ள இடங்களையும் நேர்க்கோட்டு தூரத்தையும் காட்ட முடியும்.'
            : 'Choose Use my location in the chat settings first. Then I can show nearby destinations and straight-line distances.',
          cards: [],
        };
      const places = await Destination.find({
        active: { $ne: false },
        region: /Tamil Nadu|Kerala/i,
      })
        .sort({ name: 1 })
        .limit(100);
      const aliases = {
        Chennai: 'சென்னை',
        Madurai: 'மதுரை',
        Kanyakumari: 'கன்னியாகுமரி',
        Ooty: 'ஊட்டி',
        Coonoor: 'குன்னூர்',
        Rameswaram: 'ராமேஸ்வரம்',
        Chettinad: 'செட்டிநாடு',
        Kodaikanal: 'கொடைக்கானல்',
      };
      const named = places.filter(
        (p) =>
          question.toLowerCase().includes(p.name.toLowerCase()) ||
          (aliases[p.name] && question.includes(aliases[p.name])),
      );
      const matches = (named.length ? named : places)
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .map((p) => ({ place: p, km: straightLineKm(location, p) }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 5);
      return {
        privateContext: true,
        text:
          (tamil
            ? location.label
              ? location.label + ' ஊர் மையத்திலிருந்து தோராயமான நேர்க்கோட்டு தூரம்:\n\n'
              : 'உங்கள் தற்போதைய இடத்திலிருந்து நேர்க்கோட்டு தூரம்:\n\n'
            : location.label
              ? 'Approximate straight-line distances from ' +
                location.label +
                ' town centre:\n\n'
              : 'Straight-line distances from your current location:\n\n') +
          matches.map((p) => p.place.name + ' — ' + p.km.toFixed(1) + ' km').join('\n') +
          (tamil
            ? '\n\nசாலை வழித் தூரம் மாறலாம். இடத்தைத் திறந்து Map & distance பகுதியில் road directions பார்க்கலாம்.'
            : '\n\nRoad distances may be longer. Open a destination and choose Map & distance for road directions.'),
        cards: matches.map((p) => ({
          kind: 'destination',
          title: p.place.name,
          destinationId: p.place._id,
          description: p.km.toFixed(1) + ' km · straight-line',
        })),
      };
    }
    const budgetMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user' && extractBudget(m.text) !== null);
    const askedBudget = /Tell me your total budget|உங்கள் மொத்த பட்ஜெட்/.test(
      messages.at(-2)?.text || '',
    );
    const amount =
      extractBudget(question) ||
      (askedBudget && /^\s*\d[\d,]*(?:\s*k)?\s*$/i.test(question)
        ? extractBudget('budget ' + question)
        : null);
    const listIntent =
      /all trips|all packages|what trips|list.*trip|எல்லா.*பயண|அனைத்து/i.test(question);
    const followUp =
      !listIntent &&
      budgetMessage &&
      /includ|what|detail|அடங்க|என்ன|இதுல|அதுல|விவர/i.test(question);
    const namedIntent =
      Object.keys(originCities).some((name) =>
        question.toLowerCase().includes(name.toLowerCase()),
      ) || Object.values(tamilNames).some((name) => question.includes(name));
    const catalogIntent =
      /trip|package|destination|places|பயண|இடங்கள|இடம்|ட்ரிப்|பேக்கேஜ்|பிளேஸ்|ஊர்|சுற்றுலா/i.test(
        question,
      );
    if (
      !amount &&
      !followUp &&
      !catalogIntent &&
      !namedIntent &&
      !/budget|பட்ஜெட்|பட்ஜட்/i.test(question)
    )
      return null;
    const destinations = await Destination.find({
      active: { $ne: false },
      region: /Tamil Nadu|Kerala/i,
    })
      .sort({ name: 1 })
      .limit(100);
    const ids = destinations.map((d) => d._id);
    const packages = await Package.find({
      active: true,
      travelType: { $ne: 'flight' },
      destination: { $in: ids },
    })
      .select('title destination days price priceMode')
      .limit(100);
    const mentions = (text) =>
      destinations.filter(
        (d) =>
          text.toLowerCase().includes(d.name.toLowerCase()) ||
          (tamilNames[d.name] && text.includes(tamilNames[d.name])) ||
          (d.name === 'Alappuzha' && /alleppey/i.test(text)),
      );
    const currentPlaces = mentions(question);
    const previousPlaceMessage = messages
      .slice(0, -1)
      .reverse()
      .find((m) => m.role === 'user' && mentions(m.text).length);
    const chosen =
      currentPlaces[0] ||
      (!listIntent && previousPlaceMessage
        ? mentions(previousPlaceMessage.text)[0]
        : null);
    const budget = amount || (followUp ? extractBudget(budgetMessage.text) : null);
    if (budget) {
      const result = suggestFromBudget(destinations, {
        budget,
        ...(chosen ? { destination: String(chosen._id) } : {}),
      });
      if (!result.plans.length)
        return {
          text: tamil
            ? `${money(budget)} பட்ஜெட்டுக்குள் தற்போது பொருத்தமான திட்டம் இல்லை. ${result.minimumBudget ? `குறைந்தபட்ச திட்ட மதிப்பீடு ${money(result.minimumBudget)}.` : ''} Plan trip பகுதியில் விவரங்களை மாற்றலாம்.`
            : `No plan${chosen ? ' for ' + chosen.name : ''} currently fits ${money(budget)}. ${result.minimumBudget ? `The lowest planning estimate is ${money(result.minimumBudget)}.` : ''} Adjust the options under Plan trip.`,
          cards: [],
        };
      const lines = result.plans.map(
        (p) =>
          `${p.destination.name} · ${p.days} ${tamil ? 'நாட்கள்' : 'days'} · ${money(p.estimatedCost)}\n${tamil ? 'பயணம்' : 'Travel'} ${money(p.costs.transport)}, ${tamil ? 'தங்குமிடம்' : 'stay'} ${money(p.costs.stay)}, ${tamil ? 'உணவு' : 'meals'} ${money(p.costs.food)}, ${tamil ? 'உள்ளூர் பயணம்' : 'local transport'} ${money(p.costs.localTransport)}, ${tamil ? 'சுற்றிப்பார்ப்பு' : 'sightseeing'} ${money(p.costs.sightseeing)}, ${tamil ? 'அவசர செலவு' : 'contingency'} ${money(p.costs.contingency)}.`,
      );
      return {
        text:
          (tamil
            ? `${money(budget)} பட்ஜெட்டுக்கு இந்தப் பயணங்கள் பொருந்துகின்றன. சென்னைலிருந்து ஒரு பயணி எனக் கணக்கிட்டுள்ளேன்.\n\n`
            : `These trips fit ${money(budget)}. I assumed one traveler starting from Chennai.\n\n`) +
          lines.join('\n\n') +
          (tamil
            ? '\n\nஇவை திட்டமிடும் மதிப்பீடுகள்; உறுதியான விலைகள் அல்லது booking அல்ல. Plan trip-ல் உங்கள் ஊர், பயணிகள் எண்ணிக்கையை மாற்றலாம்.'
            : '\n\nThese are planning estimates, not confirmed prices or bookings. Personalise the starting town and group size in Plan trip.'),
        cards: result.plans.map((p) => ({
          kind: 'plan',
          title: p.destination.name,
          destinationId: p.destination._id,
          days: p.days,
          estimatedCost: p.estimatedCost,
          budget,
          description: p.destination.activities.slice(0, 3).join(' · '),
        })),
      };
    }
    if (chosen && /plan|trip|itinerary|திட்ட|பயண|ட்ரிப்/i.test(question)) {
      const stops = chosen.activities || [];
      return {
        text: tamil
          ? chosen.name +
            ' பயணத்தைத் திட்டமிடலாம்.\n\n' +
            stops
              .slice(0, 4)
              .map((stop, index) => index + 1 + '. ' + stop)
              .join('\n') +
            '\n\nஉங்கள் மொத்த பட்ஜெட்டை ரூபாயில் சொல்லுங்கள். அந்த இடத்திற்கான நாட்களையும் செலவுப் பிரிவையும் கணக்கிடுகிறேன். பயணம் தொடங்கும் ஊர் மற்றும் பயணிகள் எண்ணிக்கையையும் சொல்லலாம். இடங்களின் அனுமதி, நேரம் மற்றும் உண்மையான கட்டணங்களை உறுதிசெய்ய வேண்டும்.'
          : 'Yes — let’s plan your ' +
            chosen.name +
            ' trip. A suggested outline includes:\n\n' +
            stops
              .slice(0, 4)
              .map((stop, index) => index + 1 + '. ' + stop)
              .join('\n') +
            '\n\nTell me your total budget in rupees. I’ll keep ' +
            chosen.name +
            ' selected and estimate a suitable duration and cost breakdown. You can also tell me your starting town and group size. Visitor access, timings and actual fares need confirmation.',
        cards: [
          {
            kind: 'destination',
            title: chosen.name,
            destinationId: chosen._id,
            description: stops.slice(0, 3).join(' · '),
          },
        ],
      };
    }
    if (/plan|budget|திட்ட|பட்ஜெட்|பட்ஜட்/i.test(question))
      return {
        text: tamil
          ? 'உங்கள் மொத்த பட்ஜெட்டை ரூபாயில் சொல்லுங்கள். உதாரணம்: “என் பட்ஜெட் ₹5000”. அதற்குள் பொருந்தும் இடம், நாட்கள், செலவுப் பிரிவைத் தருகிறேன்.'
          : 'Tell me your total budget in rupees, for example “My budget is ₹5000”. I’ll suggest destinations, duration and a cost breakdown.',
        cards: [],
      };
    const matched = destinations.filter(
      (d) =>
        question.toLowerCase().includes(d.name.toLowerCase()) ||
        (tamilNames[d.name] && question.includes(tamilNames[d.name])),
    );
    const selected = matched.length ? matched : destinations;
    const cards = selected.map((d) => {
      const pkg = packages.find((p) => String(p.destination) === String(d._id));
      return {
        kind: pkg ? 'package' : 'destination',
        title: d.name,
        destinationId: d._id,
        packageId: pkg?._id,
        days: pkg?.days,
        description: d.activities.slice(0, 4).join(' · '),
      };
    });
    return {
      text:
        (tamil
          ? 'நமது website-ல் உள்ள தமிழ்நாடு பயண இடங்கள்:\n\n'
          : 'Tamil Nadu and Kerala trips available to explore on this website:\n\n') +
        selected.map((d) => `• ${d.name} — ${d.category}`).join('\n') +
        (tamil
          ? '\n\nஉங்கள் பட்ஜெட்டைச் சொன்னால் பொருத்தமான திட்டங்களைத் தருகிறேன். கீழே உள்ள இடத்தைத் திறந்து விவரங்களைப் பார்க்கலாம்.'
          : '\n\nTell me your budget for a shortlist, or open a place below for its itinerary. Availability requires a confirmed quote.'),
      cards,
    };
  },
};
