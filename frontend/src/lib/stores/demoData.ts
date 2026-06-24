/**
 * Comprehensive demo data for TravelMap demo mode.
 *
 * Design decisions:
 *  - Countries use ISO Alpha-2 codes (ES, FR, IT, JP, US, ...). The map page
 *    converts these to Alpha-3 for matching GeoJSON country boundaries, so
 *    full Spanish names ("España", "Francia") break the highlighting.
 *  - Image URLs are direct, public URLs (picsum.photos/seed/...) so they work
 *    without an authenticated backend. No more `${API_URL}/media/photos/{id}/image`
 *    lookups for demo content.
 *  - Spain trips include `provinces` arrays (province names) so the provincial
 *    tracking feature works in demo mode.
 *  - Locations include realistic coordinates, categories, ratings, and
 *    `adminArea1` (province) for Spain locations.
 *  - DemoPhoto provides a richer photo object with EXIF-like metadata that
 *    mirrors what the backend would return via Immich/MinIO.
 *
 * NOTE: This file is self-contained and does NOT depend on the authenticated
 * backend, so it can be used to preview the app without a server running.
 */

import type { Location, Trip, UserProfile } from "./data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DemoPhoto {
  id: string;
  /** Direct image URL (e.g. https://picsum.photos/seed/xxx/800/600). */
  url: string;
  /** Smaller thumbnail variant of the same image. */
  thumbUrl: string;
  provider: "demo";
  showOnMap: boolean;
  isCover: boolean;
  isHidden: boolean;
  tripId?: string;
  locationId?: string;
  /** External provider identifier (e.g. Immich asset id) when applicable. */
  externalId?: string;
  metadata?: {
    exif?: {
      latitude?: number;
      longitude?: number;
      dateTimeOriginal?: string;
    };
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a picsum.photos seed URL for a large (cover) image. */
const cover = (seed: string): string =>
  `https://picsum.photos/seed/${seed}/800/600`;

/** Build a picsum.photos seed URL for a thumbnail image. */
const thumb = (seed: string): string =>
  `https://picsum.photos/seed/${seed}/400/300`;

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------
// Trip IDs are kept as stable string identifiers ("1" .. "14") so they can be
// cross-referenced by DemoPhoto records and by data.ts initial state.

export const demoTrips: Trip[] = [
  {
    id: "1",
    userId: "demo_user",
    name: "Eurotrip 2024",
    description:
      "Viaje de verano por las principales capitales europeas: Madrid, Paris y Roma.",
    startDate: "2024-06-01",
    endDate: "2024-06-20",
    countries: ["ES", "FR", "IT"],
    status: "Completado",
    coverImage: cover("eurotrip-2024"),
    coverImageUrl: cover("eurotrip-2024"),
    locations: ["1", "2", "3", "4"],
  },
  {
    id: "2",
    userId: "demo_user",
    name: "Aventura en Japon",
    description:
      "Explorando la cultura, gastronomia y paisajes nipones entre Tokyo, Kyoto y el Monte Fuji.",
    startDate: "2025-04-10",
    endDate: "2025-04-25",
    countries: ["JP"],
    status: "Planificado",
    coverImage: cover("japan-adventure-2025"),
    coverImageUrl: cover("japan-adventure-2025"),
    locations: ["5", "6", "7"],
  },
  {
    id: "3",
    userId: "other_user",
    name: "Ruta 66",
    description:
      "Viaje en moto por la mitica Ruta 66, desde Chicago hasta Santa Monica.",
    startDate: "2023-09-01",
    endDate: "2023-09-20",
    countries: ["US"],
    status: "Completado",
    coverImage: cover("ruta-66-2023"),
    coverImageUrl: cover("ruta-66-2023"),
    locations: ["8", "9", "10"],
  },
  {
    id: "4",
    userId: "other_user",
    name: "Expedicion a la Patagonia",
    description:
      "Recorriendo glaciares y montanas increibles en el fin del mundo, entre Argentina y Chile.",
    startDate: "2024-11-05",
    endDate: "2024-11-25",
    countries: ["AR", "CL"],
    status: "Completado",
    coverImage: cover("patagonia-expedition-2024"),
    coverImageUrl: cover("patagonia-expedition-2024"),
    locations: ["11", "12", "13"],
  },
  {
    id: "5",
    userId: "demo_user",
    name: "Viaje a Tailandia",
    description:
      "Templos, playas y selva tropical: Bangkok, las islas Phi Phi y Chiang Mai.",
    startDate: "2025-01-08",
    endDate: "2025-01-22",
    countries: ["TH"],
    status: "Completado",
    coverImage: cover("thailand-trip-2025"),
    coverImageUrl: cover("thailand-trip-2025"),
    locations: ["14", "15", "16"],
  },
  {
    id: "6",
    userId: "demo_user",
    name: "Descubriendo Mexico",
    description:
      "Un recorrido por las maravillas precolombinas y las playas del Caribe mexicano.",
    startDate: "2024-03-12",
    endDate: "2024-03-26",
    countries: ["MX"],
    status: "Completado",
    coverImage: cover("mexico-discovery-2024"),
    coverImageUrl: cover("mexico-discovery-2024"),
    locations: ["17", "18", "19"],
  },
  {
    id: "7",
    userId: "demo_user",
    name: "Safari en Tanzania",
    description:
      "Safari por el Serengeti, el crate del Ngorongoro y las laderas del Kilimanjaro.",
    startDate: "2025-08-01",
    endDate: "2025-08-15",
    countries: ["TZ", "KE"],
    status: "Planificado",
    coverImage: cover("tanzania-safari-2025"),
    coverImageUrl: cover("tanzania-safari-2025"),
    locations: ["20", "21", "22"],
  },
  {
    id: "8",
    userId: "demo_user",
    name: "Grecia y Croacia",
    description:
      "Islas griegas, la Acrópolis de Atenas y la costa dálmata de Croacia.",
    startDate: "2025-06-05",
    endDate: "2025-06-19",
    countries: ["GR", "HR"],
    status: "En curso",
    coverImage: cover("greece-croatia-2025"),
    coverImageUrl: cover("greece-croatia-2025"),
    locations: ["23", "24", "25"],
  },
  {
    id: "9",
    userId: "demo_user",
    name: "Costa Oeste USA",
    description:
      "Desde San Francisco hasta Las Vegas pasando por Yosemite y el Gran Cañón.",
    startDate: "2023-07-10",
    endDate: "2023-07-24",
    countries: ["US"],
    status: "Completado",
    coverImage: cover("west-coast-usa-2023"),
    coverImageUrl: cover("west-coast-usa-2023"),
    locations: ["26", "27", "28"],
  },
  {
    id: "10",
    userId: "demo_user",
    name: "Ruta por Andalucia",
    description:
      "Una vuelta por el sur de España: Sevilla, Córdoba, Granada, Cádiz y Málaga.",
    startDate: "2024-05-03",
    endDate: "2024-05-12",
    countries: ["ES"],
    provinces: ["Sevilla", "Malaga", "Granada", "Cadiz", "Cordoba"],
    status: "Completado",
    coverImage: cover("andalucia-route-2024"),
    coverImageUrl: cover("andalucia-route-2024"),
    locations: ["29", "30", "31", "32", "33"],
  },
  {
    id: "11",
    userId: "demo_user",
    name: "Trekking en Nepal",
    description:
      "Aventura de montaña hacia el campo base del Everest y los valles de Annapurna.",
    startDate: "2025-10-02",
    endDate: "2025-10-20",
    countries: ["NP"],
    status: "Planificado",
    coverImage: cover("nepal-trek-2025"),
    coverImageUrl: cover("nepal-trek-2025"),
    locations: ["34", "35", "36"],
  },
  {
    id: "12",
    userId: "demo_user",
    name: "Islas Canarias",
    description:
      "Volcanes, playas doradas y bosques de laurisilva en Tenerife y Gran Canaria.",
    startDate: "2024-02-14",
    endDate: "2024-02-22",
    countries: ["ES"],
    provinces: ["Las Palmas", "Santa Cruz de Tenerife"],
    status: "Completado",
    coverImage: cover("canary-islands-2024"),
    coverImageUrl: cover("canary-islands-2024"),
    locations: ["37", "38", "39"],
  },
  {
    id: "13",
    userId: "demo_user",
    name: "Fin de semana en Londres",
    description:
      "Un escapada cultural por la capital británica: museos, puentes y pub food.",
    startDate: "2023-12-08",
    endDate: "2023-12-10",
    countries: ["GB"],
    status: "Completado",
    coverImage: cover("london-weekend-2023"),
    coverImageUrl: cover("london-weekend-2023"),
    locations: ["40", "41", "42"],
  },
  {
    id: "14",
    userId: "demo_user",
    name: "Portugal coastal roadtrip",
    description:
      "Roadtrip desde Lisboa hasta el Algarve pasando por Lisboa y las playas de la costa vicentina.",
    startDate: "2023-08-05",
    endDate: "2023-08-15",
    countries: ["PT"],
    status: "Completado",
    coverImage: cover("portugal-roadtrip-2023"),
    coverImageUrl: cover("portugal-roadtrip-2023"),
    locations: ["43", "44", "45"],
  },
];

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------
// Each location has realistic coordinates (verified against real landmarks),
// a category, a 1-5 rating, visitedDate, and for Spain locations the
// adminArea1 province name so the province-level tracking works.

export const demoLocations: Location[] = [
  // --- Trip 1: Eurotrip 2024 ---
  {
    id: "1",
    name: "Torre Eiffel",
    description:
      "El icono de Paris y una de las estructuras mas famosas del mundo.",
    country: "FR",
    category: "Monumento",
    coordinates: [48.8584, 2.2945],
    rating: 5,
    visitedDate: "2024-06-05",
    images: [thumb("eiffel-tower-paris")],
    tripId: "1",
  },
  {
    id: "2",
    name: "Coliseo Romano",
    description:
      "El anfiteatro mas grande construido durante el Imperio Romano.",
    country: "IT",
    category: "Cultura",
    coordinates: [41.8902, 12.4922],
    rating: 5,
    visitedDate: "2024-06-12",
    images: [thumb("colosseum-rome")],
    tripId: "1",
  },
  {
    id: "3",
    name: "Sagrada Familia",
    description:
      "La obra magistral de Gaudi, aun en construccion, en el corazon de Barcelona.",
    country: "ES",
    category: "Cultura",
    coordinates: [41.4036, 2.1744],
    rating: 5,
    visitedDate: "2024-06-02",
    images: [thumb("sagrada-familia-barcelona")],
    tripId: "1",
    adminArea1: "Barcelona",
  },
  {
    id: "4",
    name: "Plaza Mayor",
    description:
      "El centro historico y gastronomico de Madrid, rodeado de soportales.",
    country: "ES",
    category: "Ciudad",
    coordinates: [40.4155, -3.7074],
    rating: 4,
    visitedDate: "2024-06-01",
    images: [thumb("plaza-mayor-madrid")],
    tripId: "1",
    adminArea1: "Madrid",
  },

  // --- Trip 2: Aventura en Japon ---
  {
    id: "5",
    name: "Monte Fuji",
    description:
      "El pico mas alto y sagrado de Japon, con sus lagos y vistas icónicas.",
    country: "JP",
    category: "Montaña",
    coordinates: [35.3606, 138.7274],
    rating: 5,
    visitedDate: "2025-04-15",
    images: [thumb("fuji-mountain-japan")],
    tripId: "2",
  },
  {
    id: "6",
    name: "Cruce de Shibuya",
    description:
      "El cruce peatonal mas concurrido del mundo, en el centro de Tokyo.",
    country: "JP",
    category: "Ciudad",
    coordinates: [35.6595, 139.7005],
    rating: 4,
    visitedDate: "2025-04-12",
    images: [thumb("shibuya-crossing-tokyo")],
    tripId: "2",
  },
  {
    id: "7",
    name: "Fushimi Inari Taisha",
    description:
      "El santuario sintoista de las mil puertas torii rojas en Kyoto.",
    country: "JP",
    category: "Cultura",
    coordinates: [34.9671, 135.7727],
    rating: 5,
    visitedDate: "2025-04-18",
    images: [thumb("fushimi-inari-kyoto")],
    tripId: "2",
  },

  // --- Trip 3: Ruta 66 ---
  {
    id: "8",
    name: "Gran Cañón",
    description:
      "Una de las maravillas naturales del mundo, tallada por el rio Colorado.",
    country: "US",
    category: "Naturaleza",
    coordinates: [36.1069, -112.1129],
    rating: 5,
    visitedDate: "2023-09-10",
    images: [thumb("grand-canyon-arizona")],
    tripId: "3",
  },
  {
    id: "9",
    name: "Santa Monica Pier",
    description:
      "El final simbolico de la Ruta 66 en la costa de California.",
    country: "US",
    category: "Playa",
    coordinates: [34.0092, -118.4976],
    rating: 4,
    visitedDate: "2023-09-20",
    images: [thumb("santa-monica-pier")],
    tripId: "3",
  },
  {
    id: "10",
    name: "Gateway Arch",
    description:
      "El arco mas alto del mundo, simbolo de San Luis y puerta del Oeste.",
    country: "US",
    category: "Monumento",
    coordinates: [38.6247, -90.1848],
    rating: 4,
    visitedDate: "2023-09-05",
    images: [thumb("gateway-arch-st-louis")],
    tripId: "3",
  },

  // --- Trip 4: Patagonia ---
  {
    id: "11",
    name: "Glaciar Perito Moreno",
    description:
      "Impresionante glaciar en avance en la Patagonia argentina.",
    country: "AR",
    category: "Naturaleza",
    coordinates: [-50.473, -73.0369],
    rating: 5,
    visitedDate: "2024-11-10",
    images: [thumb("perito-moreno-glacier")],
    tripId: "4",
  },
  {
    id: "12",
    name: "Torres del Paine",
    description:
      "Las emblematicas agujas graniticas del parque nacional chileno.",
    country: "CL",
    category: "Montaña",
    coordinates: [-51.0, -73.0833],
    rating: 5,
    visitedDate: "2024-11-15",
    images: [thumb("torres-del-paine-chile")],
    tripId: "4",
  },
  {
    id: "13",
    name: "Ushuaia",
    description:
      "La ciudad mas austral del mundo, puerta de entrada a la Antartida.",
    country: "AR",
    category: "Ciudad",
    coordinates: [-54.8019, -68.303],
    rating: 4,
    visitedDate: "2024-11-20",
    images: [thumb("ushuaia-argentina")],
    tripId: "4",
  },

  // --- Trip 5: Tailandia ---
  {
    id: "14",
    name: "Wat Arun",
    description:
      "El templo del amanecer a orillas del rio Chao Phraya en Bangkok.",
    country: "TH",
    category: "Cultura",
    coordinates: [13.7437, 100.4889],
    rating: 5,
    visitedDate: "2025-01-10",
    images: [thumb("wat-arun-bangkok")],
    tripId: "5",
  },
  {
    id: "15",
    name: "Islas Phi Phi",
    description:
      "Archipielago de aguas turquesa y acantilados de piedra caliza.",
    country: "TH",
    category: "Playa",
    coordinates: [7.7407, 98.7784],
    rating: 5,
    visitedDate: "2025-01-14",
    images: [thumb("phi-phi-islands-thailand")],
    tripId: "5",
  },
  {
    id: "16",
    name: "Doi Suthep",
    description:
      "Templo dorado en lo alto de la montaña sobre Chiang Mai.",
    country: "TH",
    category: "Montaña",
    coordinates: [18.8047, 98.9485],
    rating: 4,
    visitedDate: "2025-01-19",
    images: [thumb("doi-suthep-chiang-mai")],
    tripId: "5",
  },

  // --- Trip 6: Mexico ---
  {
    id: "17",
    name: "Chichen Itza",
    description:
      "La gran piramide de Kukulcan, una de las nuevas siete maravillas del mundo.",
    country: "MX",
    category: "Cultura",
    coordinates: [20.6843, -88.5678],
    rating: 5,
    visitedDate: "2024-03-15",
    images: [thumb("chichen-itza-mexico")],
    tripId: "6",
  },
  {
    id: "18",
    name: "Teotihuacan",
    description:
      "La ciudad de los dioses con la Piramide del Sol y de la Luna.",
    country: "MX",
    category: "Cultura",
    coordinates: [19.6925, -98.8436],
    rating: 5,
    visitedDate: "2024-03-13",
    images: [thumb("teotihuacan-pyramid")],
    tripId: "6",
  },
  {
    id: "19",
    name: "Tulum",
    description:
      "Ruinas mayas frente al mar Caribe y playas de arena blanca.",
    country: "MX",
    category: "Playa",
    coordinates: [20.2114, -87.4654],
    rating: 4,
    visitedDate: "2024-03-20",
    images: [thumb("tulum-ruins-mexico")],
    tripId: "6",
  },

  // --- Trip 7: Safari en Tanzania ---
  {
    id: "20",
    name: "Serengeti",
    description:
      "La gran migracion de ñus y cebras en una de las llanuras mas famosas.",
    country: "TZ",
    category: "Naturaleza",
    coordinates: [-2.3333, 34.8333],
    rating: 5,
    visitedDate: "2025-08-05",
    images: [thumb("serengeti-tanzania")],
    tripId: "7",
  },
  {
    id: "21",
    name: "Monte Kilimanjaro",
    description:
      "El techo de Africa, el pico independiente mas alto del mundo.",
    country: "TZ",
    category: "Montaña",
    coordinates: [-3.0674, 37.3556],
    rating: 5,
    visitedDate: "2025-08-10",
    images: [thumb("kilimanjaro-tanzania")],
    tripId: "7",
  },
  {
    id: "22",
    name: "Crater del Ngorongoro",
    description:
      "La caldera volcanica mas grande del mundo, refugio de fauna unica.",
    country: "TZ",
    category: "Naturaleza",
    coordinates: [-3.1554, 35.5806],
    rating: 5,
    visitedDate: "2025-08-08",
    images: [thumb("ngorongoro-crater")],
    tripId: "7",
  },

  // --- Trip 8: Grecia y Croacia ---
  {
    id: "23",
    name: "Acrópolis de Atenas",
    description:
      "La ciudadela antigua con el Partenón, simbolo de la civilización griega.",
    country: "GR",
    category: "Cultura",
    coordinates: [37.9715, 23.7267],
    rating: 5,
    visitedDate: "2025-06-08",
    images: [thumb("acropolis-athens")],
    tripId: "8",
  },
  {
    id: "24",
    name: "Dubrovnik Old Town",
    description:
      "La ciudad amurallada del Adriático, conocida como la perla de Dubrovnik.",
    country: "HR",
    category: "Ciudad",
    coordinates: [42.6507, 18.0944],
    rating: 5,
    visitedDate: "2025-06-13",
    images: [thumb("dubrovnik-old-town")],
    tripId: "8",
  },
  {
    id: "25",
    name: "Santorini (Oia)",
    description:
      "Atardeceres legendarios sobre casas encaladas y cúpulas azules.",
    country: "GR",
    category: "Ciudad",
    coordinates: [36.4618, 25.3753],
    rating: 5,
    visitedDate: "2025-06-10",
    images: [thumb("santorini-oia-greece")],
    tripId: "8",
  },

  // --- Trip 9: Costa Oeste USA ---
  {
    id: "26",
    name: "Golden Gate Bridge",
    description:
      "El puente naranja internacional decorativo sobre la bahía de San Francisco.",
    country: "US",
    category: "Monumento",
    coordinates: [37.8199, -122.4783],
    rating: 5,
    visitedDate: "2023-07-12",
    images: [thumb("golden-gate-bridge")],
    tripId: "9",
  },
  {
    id: "27",
    name: "Yosemite - Half Dome",
    description:
      "El domo granitico mas icónico del parque nacional de Yosemite.",
    country: "US",
    category: "Montaña",
    coordinates: [37.7456, -119.5329],
    rating: 5,
    visitedDate: "2023-07-15",
    images: [thumb("half-dome-yosemite")],
    tripId: "9",
  },
  {
    id: "28",
    name: "Las Vegas Strip",
    description:
      "La avenida de casinos y hoteles temáticos en el desierto de Nevada.",
    country: "US",
    category: "Ciudad",
    coordinates: [36.1147, -115.1728],
    rating: 4,
    visitedDate: "2023-07-20",
    images: [thumb("las-vegas-strip")],
    tripId: "9",
  },

  // --- Trip 10: Ruta por Andalucia (ES, provinces) ---
  {
    id: "29",
    name: "La Alhambra",
    description:
      "El conjunto palaciego nazarí overlooking Granada, joya del arte hispanomusulmán.",
    country: "ES",
    category: "Cultura",
    coordinates: [37.176, -3.5883],
    rating: 5,
    visitedDate: "2024-05-05",
    images: [thumb("alhambra-granada")],
    tripId: "10",
    adminArea1: "Granada",
  },
  {
    id: "30",
    name: "Mezquita de Cordoba",
    description:
      "La mezquita-catedral con sus arcos bicromos, patrimonio de la humanidad.",
    country: "ES",
    category: "Cultura",
    coordinates: [37.879, -4.7793],
    rating: 5,
    visitedDate: "2024-05-07",
    images: [thumb("mezquita-cordoba")],
    tripId: "10",
    adminArea1: "Cordoba",
  },
  {
    id: "31",
    name: "La Giralda",
    description:
      "El minarete almohade reconvertido en campanario de la catedral de Sevilla.",
    country: "ES",
    category: "Monumento",
    coordinates: [37.3858, -5.9931],
    rating: 5,
    visitedDate: "2024-05-03",
    images: [thumb("giralda-sevilla")],
    tripId: "10",
    adminArea1: "Sevilla",
  },
  {
    id: "32",
    name: "Playa de Bolonia",
    description:
      "Playa salvaje junto a las ruinas romanas de Baelo Claudia en Tarifa.",
    country: "ES",
    category: "Playa",
    coordinates: [36.0926, -5.784],
    rating: 4,
    visitedDate: "2024-05-09",
    images: [thumb("bolonia-beach-cadiz")],
    tripId: "10",
    adminArea1: "Cadiz",
  },
  {
    id: "33",
    name: "Cueva de Nerja",
    description:
      "Impresionantes cavidades kársticas con estalactitas y pinturas rupestres.",
    country: "ES",
    category: "Naturaleza",
    coordinates: [36.7609, -3.735],
    rating: 4,
    visitedDate: "2024-05-11",
    images: [thumb("nerja-caves-malaga")],
    tripId: "10",
    adminArea1: "Malaga",
  },

  // --- Trip 11: Trekking en Nepal ---
  {
    id: "34",
    name: "Everest Base Camp",
    description:
      "El campamento base a 5.364m, destino clasico del trekking himalayo.",
    country: "NP",
    category: "Montaña",
    coordinates: [28.0025, 86.8527],
    rating: 5,
    visitedDate: "2025-10-10",
    images: [thumb("everest-base-camp-nepal")],
    tripId: "11",
  },
  {
    id: "35",
    name: "Kathmandu Durbar Square",
    description:
      "Plaza real con palacios y templos, corazon historico de Katmandu.",
    country: "NP",
    category: "Cultura",
    coordinates: [27.6722, 85.3078],
    rating: 4,
    visitedDate: "2025-10-03",
    images: [thumb("kathmandu-durbar-square")],
    tripId: "11",
  },
  {
    id: "36",
    name: "Phewa Lake (Pokhara)",
    description:
      "El lago alpino mas famoso de Nepal con reflejos del Annapurna.",
    country: "NP",
    category: "Naturaleza",
    coordinates: [28.2096, 83.9497],
    rating: 5,
    visitedDate: "2025-10-17",
    images: [thumb("phewa-lake-pokhara")],
    tripId: "11",
  },

  // --- Trip 12: Islas Canarias (ES, provinces) ---
  {
    id: "37",
    name: "Teide",
    description:
      "El pico mas alto de España, un volcan de 3.715m en el centro de Tenerife.",
    country: "ES",
    category: "Montaña",
    coordinates: [28.2722, -16.6425],
    rating: 5,
    visitedDate: "2024-02-16",
    images: [thumb("teide-tenerife")],
    tripId: "12",
    adminArea1: "Santa Cruz de Tenerife",
  },
  {
    id: "38",
    name: "Dunas de Maspalomas",
    description:
      "Sistema dunar junto al mar en el sur de Gran Canaria.",
    country: "ES",
    category: "Playa",
    coordinates: [27.76, -15.5853],
    rating: 4,
    visitedDate: "2024-02-20",
    images: [thumb("maspalomas-dunes-gran-canaria")],
    tripId: "12",
    adminArea1: "Las Palmas",
  },
  {
    id: "39",
    name: "Roque Nublo",
    description:
      "El monolito volcanico sagrado de los antiguos canarios en Gran Canaria.",
    country: "ES",
    category: "Naturaleza",
    coordinates: [27.9667, -15.6286],
    rating: 4,
    visitedDate: "2024-02-19",
    images: [thumb("roque-nublo-gran-canaria")],
    tripId: "12",
    adminArea1: "Las Palmas",
  },

  // --- Trip 13: Fin de semana en Londres ---
  {
    id: "40",
    name: "Tower Bridge",
    description:
      "El puente basculante victoriano sobre el Támesis, icono de Londres.",
    country: "GB",
    category: "Monumento",
    coordinates: [51.5055, -0.0754],
    rating: 5,
    visitedDate: "2023-12-08",
    images: [thumb("tower-bridge-london")],
    tripId: "13",
  },
  {
    id: "41",
    name: "Big Ben",
    description:
      "La campana y el reloj de la torre Elizabeth del Palacio de Westminster.",
    country: "GB",
    category: "Monumento",
    coordinates: [51.5007, -0.1246],
    rating: 4,
    visitedDate: "2023-12-09",
    images: [thumb("big-ben-london")],
    tripId: "13",
  },
  {
    id: "42",
    name: "Museo Británico",
    description:
      "Una de las mayores colecciones de antigüedades del mundo, entrada gratuita.",
    country: "GB",
    category: "Cultura",
    coordinates: [51.5194, -0.127],
    rating: 5,
    visitedDate: "2023-12-09",
    images: [thumb("british-museum-london")],
    tripId: "13",
  },

  // --- Trip 14: Portugal coastal roadtrip ---
  {
    id: "43",
    name: "Torre de Belém",
    description:
      "Fortaleza manuelina que custodiaba la entrada al puerto de Lisboa.",
    country: "PT",
    category: "Monumento",
    coordinates: [38.6916, -9.2156],
    rating: 4,
    visitedDate: "2023-08-06",
    images: [thumb("belem-tower-lisbon")],
    tripId: "14",
  },
  {
    id: "44",
    name: "Ribeira do Porto",
    description:
      "El barrio ribereño de Porto a orillas del Duero, patrimonio mundial.",
    country: "PT",
    category: "Ciudad",
    coordinates: [41.1407, -8.611],
    rating: 5,
    visitedDate: "2023-08-10",
    images: [thumb("ribeira-porto")],
    tripId: "14",
  },
  {
    id: "45",
    name: "Ponta da Piedade",
    description:
      "Farallones de roca caliza con cuevas y arcos en Lagos, Algarve.",
    country: "PT",
    category: "Naturaleza",
    coordinates: [37.08, -8.67],
    rating: 5,
    visitedDate: "2023-08-14",
    images: [thumb("ponta-da-piedade-algarve")],
    tripId: "14",
  },
];

// ---------------------------------------------------------------------------
// Demo Photos
// ---------------------------------------------------------------------------
// One cover photo per trip plus one or two gallery photos per trip cover the
// most photogenic locations. Coordinates mirror the related location so the
// map "photos on map" feature works out of the box.

export const demoPhotos: DemoPhoto[] = [
  // Eurotrip
  {
    id: "p-eurotrip-cover",
    url: cover("eurotrip-2024"),
    thumbUrl: thumb("eurotrip-2024"),
    provider: "demo",
    showOnMap: true,
    isCover: true,
    isHidden: false,
    tripId: "1",
    metadata: { exif: { latitude: 48.8584, longitude: 2.2945, dateTimeOriginal: "2024-06-05T12:00:00Z" } },
  },
  {
    id: "p-colosseum",
    url: cover("colosseum-rome"),
    thumbUrl: thumb("colosseum-rome"),
    provider: "demo",
    showOnMap: true,
    isCover: false,
    isHidden: false,
    tripId: "1",
    metadata: { exif: { latitude: 41.8902, longitude: 12.4922, dateTimeOriginal: "2024-06-12T14:00:00Z" } },
  },
  // Japan
  {
    id: "p-japan-cover",
    url: cover("japan-adventure-2025"),
    thumbUrl: thumb("japan-adventure-2025"),
    provider: "demo",
    showOnMap: true,
    isCover: true,
    isHidden: false,
    tripId: "2",
    metadata: { exif: { latitude: 35.3606, longitude: 138.7274, dateTimeOriginal: "2025-04-15T06:00:00Z" } },
  },
  {
    id: "p-fushimi-inari",
    url: cover("fushimi-inari-kyoto"),
    thumbUrl: thumb("fushimi-inari-kyoto"),
    provider: "demo",
    showOnMap: true,
    isCover: false,
    isHidden: false,
    tripId: "2",
    metadata: { exif: { latitude: 34.9671, longitude: 135.7727, dateTimeOriginal: "2025-04-18T08:00:00Z" } },
  },
  // Ruta 66
  {
    id: "p-ruta66-cover",
    url: cover("ruta-66-2023"),
    thumbUrl: thumb("ruta-66-2023"),
    provider: "demo",
    showOnMap: true,
    isCover: true,
    isHidden: false,
    tripId: "3",
    metadata: { exif: { latitude: 36.1069, longitude: -112.1129, dateTimeOriginal: "2023-09-10T10:00:00Z" } },
  },
  {
    id: "p-santa-monica",
    url: cover("santa-monica-pier"),
    thumbUrl: thumb("santa-monica-pier"),
    provider: "demo",
    showOnMap: true,
    isCover: false,
    isHidden: false,
    tripId: "3",
    metadata: { exif: { latitude: 34.0092, longitude: -118.4976, dateTimeOriginal: "2023-09-20T18:00:00Z" } },
  },
  // Patagonia
  {
    id: "p-patagonia-cover",
    url: cover("patagonia-expedition-2024"),
    thumbUrl: thumb("patagonia-expedition-2024"),
    provider: "demo",
    showOnMap: true,
    isCover: true,
    isHidden: false,
    tripId: "4",
    metadata: { exif: { latitude: -50.473, longitude: -73.0369, dateTimeOriginal: "2024-11-10T11:00:00Z" } },
  },
  {
    id: "p-torres-paine",
    url: cover("torres-del-paine-chile"),
    thumbUrl: thumb("torres-del-paine-chile"),
    provider: "demo",
    showOnMap: true,
    isCover: false,
    isHidden: false,
    tripId: "4",
    metadata: { exif: { latitude: -51.0, longitude: -73.0833, dateTimeOriginal: "2024-11-15T07:00:00Z" } },
  },
  // Thailand
  {
    id: "p-thailand-cover",
    url: cover("thailand-trip-2025"),
    thumbUrl: thumb("thailand-trip-2025"),
    provider: "demo",
    showOnMap: true,
    isCover: true,
    isHidden: false,
    tripId: "5",
    metadata: { exif: { latitude: 13.7437, longitude: 100.4889, dateTimeOriginal: "2025-01-10T09:00:00Z" } },
  },
  {
    id: "p-phi-phi",
    url: cover("phi-phi-islands-thailand"),
    thumbUrl: thumb("phi-phi-islands-thailand"),
    provider: "demo",
    showOnMap: true,
    isCover: false,
    isHidden: false,
    tripId: "5",
    metadata: { exif: { latitude: 7.7407, longitude: 98.7784, dateTimeOriginal: "2025-01-14T12:00:00Z" } },
  },
  // Mexico
  {
    id: "p-mexico-cover",
    url: cover("mexico-discovery-2024"),
    thumbUrl: thumb("mexico-discovery-2024"),
    provider: "demo",
    showOnMap: true,
    isCover: true,
    isHidden: false,
    tripId: "6",
    metadata: { exif: { latitude: 20.6843, longitude: -88.5678, dateTimeOriginal: "2024-03-15T13:00:00Z" } },
  },
  {
    id: "p-teotihuacan",
    url: cover("teotihuacan-pyramid"),
    thumbUrl: thumb("teotihuacan-pyramid"),
    provider: "demo",
    showOnMap: true,
    isCover: false,
    isHidden: false,
    tripId: "6",
    metadata: { exif: { latitude: 19.6925, longitude: -98.8436, dateTimeOriginal: "2024-03-13T10:00:00Z" } },
  },
  // Tanzania
  {
    id: "p-tanzania-cover",
    url: cover("tanzania-safari-2025"),
    thumbUrl: thumb("tanzania-safari-2025"),
    provider: "demo",
    showOnMap: true,
    isCover: true,
    isHidden: false,
    tripId: "7",
    metadata: { exif: { latitude: -2.3333, longitude: 34.8333, dateTimeOriginal: "2025-08-05T07:00:00Z" } },
  },
  {
    id: "p-kilimanjaro",
    url: cover("kilimanjaro-tanzania"),
    thumbUrl: thumb("kilimanjaro-tanzania"),
    provider: "demo",
    showOnMap: true,
    isCover: false,
    isHidden: false,
    tripId: "7",
    metadata: { exif: { latitude: -3.0674, longitude: 37.3556, dateTimeOriginal: "2025-08-10T08:00:00Z" } },
  },
  // Greece & Croatia
  {
    id: "p-greece-cover",
    url: cover("greece-croatia-2025"),
    thumbUrl: thumb("greece-croatia-2025"),
    provider: "demo",
    showOnMap: true,
    isCover: true,
    isHidden: false,
    tripId: "8",
    metadata: { exif: { latitude: 37.9715, longitude: 23.7267, dateTimeOriginal: "2025-06-08T15:00:00Z" } },
  },
  {
    id: "p-santorini",
    url: cover("santorini-oia-greece"),
    thumbUrl: thumb("santorini-oia-greece"),
    provider: "demo",
    showOnMap: true,
    isCover: false,
    isHidden: false,
    tripId: "8",
    metadata: { exif: { latitude: 36.4618, longitude: 25.3753, dateTimeOriginal: "2025-06-10T19:00:00Z" } },
  },
  // West Coast USA
  {
    id: "p-west-coast-cover",
    url: cover("west-coast-usa-2023"),
    thumbUrl: thumb("west-coast-usa-2023"),
    provider: "demo",
    showOnMap: true,
    isCover: true,
    isHidden: false,
    tripId: "9",
    metadata: { exif: { latitude: 37.8199, longitude: -122.4783, dateTimeOriginal: "2023-07-12T16:00:00Z" } },
  },
  {
    id: "p-half-dome",
    url: cover("half-dome-yosemite"),
    thumbUrl: thumb("half-dome-yosemite"),
    provider: "demo",
    showOnMap: true,
    isCover: false,
    isHidden: false,
    tripId: "9",
    metadata: { exif: { latitude: 37.7456, longitude: -119.5329, dateTimeOriginal: "2023-07-15T11:00:00Z" } },
  },
  // Andalucia
  {
    id: "p-andalucia-cover",
    url: cover("andalucia-route-2024"),
    thumbUrl: thumb("andalucia-route-2024"),
    provider: "demo",
    showOnMap: true,
    isCover: true,
    isHidden: false,
    tripId: "10",
    metadata: { exif: { latitude: 37.176, longitude: -3.5883, dateTimeOriginal: "2024-05-05T13:00:00Z" } },
  },
  {
    id: "p-mezquita-cordoba",
    url: cover("mezquita-cordoba"),
    thumbUrl: thumb("mezquita-cordoba"),
    provider: "demo",
    showOnMap: true,
    isCover: false,
    isHidden: false,
    tripId: "10",
    metadata: { exif: { latitude: 37.879, longitude: -4.7793, dateTimeOriginal: "2024-05-07T12:00:00Z" } },
  },
  // Nepal
  {
    id: "p-nepal-cover",
    url: cover("nepal-trek-2025"),
    thumbUrl: thumb("nepal-trek-2025"),
    provider: "demo",
    showOnMap: true,
    isCover: true,
    isHidden: false,
    tripId: "11",
    metadata: { exif: { latitude: 28.0025, longitude: 86.8527, dateTimeOriginal: "2025-10-10T09:00:00Z" } },
  },
  {
    id: "p-phewa-lake",
    url: cover("phewa-lake-pokhara"),
    thumbUrl: thumb("phewa-lake-pokhara"),
    provider: "demo",
    showOnMap: true,
    isCover: false,
    isHidden: false,
    tripId: "11",
    metadata: { exif: { latitude: 28.2096, longitude: 83.9497, dateTimeOriginal: "2025-10-17T16:00:00Z" } },
  },
  // Canarias
  {
    id: "p-canarias-cover",
    url: cover("canary-islands-2024"),
    thumbUrl: thumb("canary-islands-2024"),
    provider: "demo",
    showOnMap: true,
    isCover: true,
    isHidden: false,
    tripId: "12",
    metadata: { exif: { latitude: 28.2722, longitude: -16.6425, dateTimeOriginal: "2024-02-16T10:00:00Z" } },
  },
  {
    id: "p-maspalomas",
    url: cover("maspalomas-dunes-gran-canaria"),
    thumbUrl: thumb("maspalomas-dunes-gran-canaria"),
    provider: "demo",
    showOnMap: true,
    isCover: false,
    isHidden: false,
    tripId: "12",
    metadata: { exif: { latitude: 27.76, longitude: -15.5853, dateTimeOriginal: "2024-02-20T11:00:00Z" } },
  },
  // London
  {
    id: "p-london-cover",
    url: cover("london-weekend-2023"),
    thumbUrl: thumb("london-weekend-2023"),
    provider: "demo",
    showOnMap: true,
    isCover: true,
    isHidden: false,
    tripId: "13",
    metadata: { exif: { latitude: 51.5055, longitude: -0.0754, dateTimeOriginal: "2023-12-08T14:00:00Z" } },
  },
  {
    id: "p-british-museum",
    url: cover("british-museum-london"),
    thumbUrl: thumb("british-museum-london"),
    provider: "demo",
    showOnMap: true,
    isCover: false,
    isHidden: false,
    tripId: "13",
    metadata: { exif: { latitude: 51.5194, longitude: -0.127, dateTimeOriginal: "2023-12-09T10:00:00Z" } },
  },
  // Portugal
  {
    id: "p-portugal-cover",
    url: cover("portugal-roadtrip-2023"),
    thumbUrl: thumb("portugal-roadtrip-2023"),
    provider: "demo",
    showOnMap: true,
    isCover: true,
    isHidden: false,
    tripId: "14",
    metadata: { exif: { latitude: 38.6916, longitude: -9.2156, dateTimeOriginal: "2023-08-06T15:00:00Z" } },
  },
  {
    id: "p-ponta-piedade",
    url: cover("ponta-da-piedade-algarve"),
    thumbUrl: thumb("ponta-da-piedade-algarve"),
    provider: "demo",
    showOnMap: true,
    isCover: false,
    isHidden: false,
    tripId: "14",
    metadata: { exif: { latitude: 37.08, longitude: -8.67, dateTimeOriginal: "2023-08-14T17:00:00Z" } },
  },
];

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

export const demoProfile: UserProfile = {
  id: "demo_user",
  name: "Alex Viajero",
  bio: "Apasionado por descubrir nuevos lugares y culturas. Fotografo aficionado.",
  avatar: "https://picsum.photos/seed/alex-viajero-avatar/200/200",
  coverImage: "https://picsum.photos/seed/alex-viajero-cover/1200/400",
  createdAt: "2024-01-01",
  stats: {
    // The demo covers 16 distinct countries across the trips above:
    // ES, FR, IT, JP, US, AR, CL, TH, MX, TZ, GR, HR, NP, GB, PT (15 distinct).
    countriesVisited: 15,
    tripsCompleted: 10,
    totalTrips: 14,
    placesVisited: 45,
    photosUploaded: 28,
    furthestPlace: {
      name: "Ushuaia, Argentina",
      distance: 12700,
    },
  },
  homeLocation: {
    name: "Madrid",
    coordinates: [40.4168, -3.7038],
  },
  homeCountry: "ES",
  homeProvince: "Madrid",
};

/** Convenience default export bundle for callers that want everything at once. */
export const demoData = {
  trips: demoTrips,
  locations: demoLocations,
  profile: demoProfile,
  photos: demoPhotos,
};
