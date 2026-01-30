// backend/src/database/seeds/countries.seed.ts
import { Knex } from 'knex';
import axios from 'axios';

// Function to convert ISO Alpha3 to Alpha2
function convertAlpha3ToAlpha2(alpha3: string): string {
  const mapping: { [key: string]: string } = {
    'AFG': 'AF', 'AGO': 'AO', 'ALB': 'AL', 'ARE': 'AE', 'ARG': 'AR',
    'ARM': 'AM', 'ATA': 'AQ', 'ATF': 'TF', 'AUS': 'AU', 'AUT': 'AT',
    'AZE': 'AZ', 'BDI': 'BI', 'BEL': 'BE', 'BEN': 'BJ', 'BFA': 'BF',
    'BGD': 'BD', 'BGR': 'BG', 'BHR': 'BH', 'BHS': 'BS', 'BIH': 'BA',
    'BLR': 'BY', 'BLZ': 'BZ', 'BOL': 'BO', 'BRA': 'BR', 'BRN': 'BN',
    'BTN': 'BT', 'BWA': 'BW', 'CAN': 'CA', 'CHE': 'CH', 'CHL': 'CL',
    'CHN': 'CN', 'CIV': 'CI', 'CMR': 'CM', 'COD': 'CD', 'COG': 'CG',
    'COK': 'CK', 'COL': 'CO', 'COM': 'KM', 'CPV': 'CV', 'CRI': 'CR',
    'CUB': 'CU', 'CUW': 'CW', 'CXR': 'CX', 'CYM': 'KY', 'CYP': 'CY',
    'CZE': 'CZ', 'DEU': 'DE', 'DJI': 'DJ', 'DMA': 'DM', 'DNK': 'DK',
    'DOM': 'DO', 'DZA': 'DZ', 'ECU': 'EC', 'EGY': 'EG', 'ERI': 'ER',
    'ESH': 'EH', 'ESP': 'ES', 'EST': 'EE', 'ETH': 'ET', 'FIN': 'FI',
    'FJI': 'FJ', 'FLK': 'FK', 'FRA': 'FR', 'FRO': 'FO', 'FSM': 'FM',
    'GAB': 'GA', 'GBR': 'GB', 'GEO': 'GE', 'GGY': 'GG', 'GHA': 'GH',
    'GIB': 'GI', 'GIN': 'GN', 'GLP': 'GP', 'GMB': 'GM', 'GNB': 'GW',
    'GNQ': 'GQ', 'GRC': 'GR', 'GRD': 'GD', 'GRL': 'GL', 'GTM': 'GT',
    'GUF': 'GF', 'GUM': 'GU', 'GUY': 'GY', 'HKG': 'HK', 'HMD': 'HM',
    'HND': 'HN', 'HRV': 'HR', 'HTI': 'HT', 'HUN': 'HU', 'IDN': 'ID',
    'IMN': 'IM', 'IND': 'IN', 'IOT': 'IO', 'IRL': 'IE', 'IRN': 'IR',
    'IRQ': 'IQ', 'ISL': 'IS', 'ITA': 'IT', 'JEY': 'JE', 'JAM': 'JM',
    'JOR': 'JO', 'JPN': 'JP', 'KAZ': 'KZ', 'KEN': 'KE', 'KGZ': 'KG',
    'KHM': 'KH', 'KIR': 'KI', 'KNA': 'KN', 'KOR': 'KR', 'KWT': 'KW',
    'LAO': 'LA', 'LBN': 'LB', 'LBR': 'LR', 'LBY': 'LY', 'LCA': 'LC',
    'LIE': 'LI', 'LKA': 'LK', 'LSO': 'LS', 'LTU': 'LT', 'LUX': 'LU',
    'LVA': 'LV', 'MAC': 'MO', 'MAF': 'MF', 'MAR': 'MA', 'MCO': 'MC',
    'MDA': 'MD', 'MDG': 'MG', 'MDV': 'MV', 'MEX': 'MX', 'MHL': 'MH',
    'MKD': 'MK', 'MLI': 'ML', 'MLT': 'MT', 'MMR': 'MM', 'MNE': 'ME',
    'MNG': 'MN', 'MNP': 'MP', 'MOZ': 'MZ', 'MRT': 'MR', 'MSR': 'MS',
    'MTQ': 'MQ', 'MUS': 'MU', 'MWI': 'MW', 'MYS': 'MY', 'MYT': 'YT',
    'NAM': 'NA', 'NCL': 'NC', 'NER': 'NE', 'NFK': 'NF', 'NGA': 'NG',
    'NIC': 'NI', 'NIU': 'NU', 'NLD': 'NL', 'NOR': 'NO', 'NPL': 'NP',
    'NRU': 'NR', 'NZL': 'NZ', 'OMN': 'OM', 'PAK': 'PK', 'PAN': 'PA',
    'PCN': 'PN', 'PER': 'PE', 'PHL': 'PH', 'PLW': 'PW', 'PNG': 'PG',
    'POL': 'PL', 'PRI': 'PR', 'PRK': 'KP', 'PRT': 'PT', 'PRY': 'PY',
    'PSE': 'PS', 'PYF': 'PF', 'QAT': 'QA', 'REU': 'RE', 'ROU': 'RO',
    'RUS': 'RU', 'RWA': 'RW', 'SAU': 'SA', 'SDN': 'SD', 'SEN': 'SN',
    'SGP': 'SG', 'SGS': 'GS', 'SHN': 'SH', 'SJM': 'SJ', 'SLB': 'SB',
    'SLE': 'SL', 'SLV': 'SV', 'SMR': 'SM', 'SOM': 'SO', 'SPM': 'PM',
    'SRB': 'RS', 'SSD': 'SS', 'STP': 'ST', 'SUR': 'SR', 'SVK': 'SK',
    'SVN': 'SI', 'SWE': 'SE', 'SWZ': 'SZ', 'SXM': 'SX', 'SYC': 'SC',
    'SYR': 'SY', 'TCA': 'TC', 'TCD': 'TD', 'TGO': 'TG', 'THA': 'TH',
    'TJK': 'TJ', 'TKL': 'TK', 'TKM': 'TM', 'TLS': 'TL', 'TON': 'TO',
    'TTO': 'TT', 'TUN': 'TN', 'TUR': 'TR', 'TUV': 'TV', 'TWN': 'TW',
    'TZA': 'TZ', 'UGA': 'UG', 'UKR': 'UA', 'UMI': 'UM', 'URY': 'UY',
    'USA': 'US', 'UZB': 'UZ', 'VAT': 'VA', 'VCT': 'VC', 'VEN': 'VE',
    'VGB': 'VG', 'VIR': 'VI', 'VNM': 'VN', 'VUT': 'VU', 'WLF': 'WF',
    'WSM': 'WS', 'YEM': 'YE', 'ZAF': 'ZA', 'ZMB': 'ZM', 'ZWE': 'ZW'
  };

  return mapping[alpha3] || alpha3.substring(0, 2); // Fallback: take first 2 characters
}

interface CountryData {
  type: string;
  features: Array<{
    type: string;
    id: string;
    properties: {
      name: string;
    };
    geometry: {
      type: string;
      coordinates: number[][][] | number[][][][];
    };
  }>;
}

export async function seed(knex: Knex): Promise<void> {
  console.log('Importing countries data...');

  try {
    // Check if PostGIS is available
    const postgisCheck = await knex.raw(`
      SELECT 1 FROM pg_available_extensions 
      WHERE name = 'postgis' AND installed_version IS NOT NULL
    `);

    const hasPostGIS = postgisCheck.rows.length > 0;

    if (!hasPostGIS) {
      console.log('PostGIS not available, using fallback...');
    }
    // Download GeoJSON data from Natural Earth
    const response = await axios.get<CountryData>(
      'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'
    );

    const geoData = response.data;
    let imported = 0;
    let updated = 0;

    for (const feature of geoData.features) {
      const properties = feature.properties;
      const geometry = feature.geometry;

      // Extract basic data
      const name = properties.name || '';
      // For this dataset, the id is the ISO Alpha3 code
      const isoAlpha3 = feature.id || '';
      // Convert ISO Alpha3 to Alpha2
      const isoAlpha2 = convertAlpha3ToAlpha2(isoAlpha3);

      console.log(`Processing: ${name} (${isoAlpha3} -> ${isoAlpha2})`);

      // Validate that ISO codes have the correct length
      if (!name || !isoAlpha2 || isoAlpha2 === '-99' || isoAlpha3.length > 3) {
        console.log(`Skipping invalid entry: ${name} (${isoAlpha3} -> ${isoAlpha2})`);
        continue; // Skip invalid entries
      }

      // Convert geometry to PostGIS format
      let geometryWkt;
      if (geometry.type === 'Polygon') {
        // Convert Polygon to WKT
        const coords = geometry.coordinates[0];
        const points = coords.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
        geometryWkt = `MULTIPOLYGON(((${points})))`;
      } else if (geometry.type === 'MultiPolygon') {
        // Convert MultiPolygon to WKT
        const polygons = (geometry.coordinates as number[][][][]).map((polygon: number[][][]) => {
          const points = polygon[0].map(coord => `${coord[0]} ${coord[1]}`).join(', ');
          return `((${points}))`;
        });
        geometryWkt = `MULTIPOLYGON(${polygons.join(',')})`;
      } else {
        continue; // Skip unsupported geometries
      }

      // Insert or update country
      const existing = await knex('countries')
        .where('iso_alpha2', isoAlpha2)
        .first();

      const updateData: any = {
        name,
        iso_alpha3: isoAlpha3,
        continent: null, // Not available in this dataset
        capital: null,   // Not available in this dataset
        population: null, // Not available in this dataset
        area_sq_km: null,  // Not available in this dataset
        updated_at: new Date()
      };

      const insertData: any = {
        iso_alpha2: isoAlpha2,
        iso_alpha3: isoAlpha3,
        name,
        continent: null, // Not available in this dataset
        capital: null,   // Not available in this dataset
        population: null, // Not available in this dataset
        area_sq_km: null,  // Not available in this dataset
        created_at: new Date(),
        updated_at: new Date()
      };

      if (hasPostGIS) {
        updateData.geometry = knex.raw(`ST_GeomFromText('${geometryWkt}', 4326)`);
        insertData.geometry = knex.raw(`ST_GeomFromText('${geometryWkt}', 4326)`);
      } else {
        updateData.geometry_json = JSON.stringify(geometry);
        insertData.geometry_json = JSON.stringify(geometry);
      }

      if (existing) {
        await knex('countries')
          .where('iso_alpha2', isoAlpha2)
          .update(updateData);
        updated++;
      } else {
        await knex('countries').insert(insertData);
        imported++;
      }
    }

    // Calculate centroids for all countries (only if PostGIS is available)
    if (hasPostGIS) {
      await knex.raw(`
        UPDATE countries 
        SET centroid = ST_Centroid(geometry)
        WHERE centroid IS NULL
      `);
    }

    console.log(`✅ Countries imported: ${imported}, updated: ${updated}`);

  } catch (error) {
    console.error('❌ Error importing countries:', error);
    throw error;
  }
}