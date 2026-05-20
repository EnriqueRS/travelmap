export interface ProvinceInfo {
  id: string; // ISO or common code
  name: string;
  region: string; // e.g., "Comunidad de Madrid"
  flag?: string;
}

export interface RegionInfo {
  id: string;
  name: string;
  flag?: string;
  colors?: [string, string]; // Primary and secondary colors from the flag
}

export const SPAIN_REGIONS: RegionInfo[] = [
  { id: "MD", name: "Comunidad de Madrid", colors: ["#c60b1e", "#ffffff"] },
  { id: "CT", name: "Cataluña", colors: ["#fcdd09", "#da121a"] },
  { id: "AN", name: "Andalucía", colors: ["#009150", "#ffffff"] },
  { id: "VC", name: "Comunidad Valenciana", colors: ["#0060a8", "#fcdd09"] },
  { id: "GA", name: "Galicia", colors: ["#0055a4", "#ffffff"] },
  { id: "CL", name: "Castilla y León", colors: ["#a3195b", "#c8a951"] },
  { id: "CM", name: "Castilla-La Mancha", colors: ["#c60b1e", "#ffffff"] },
  { id: "PV", name: "País Vasco", colors: ["#d52b1e", "#009b48"] },
  { id: "CB", name: "Cantabria", colors: ["#c8102e", "#ffffff"] },
  { id: "AS", name: "Asturias", colors: ["#0057a7", "#fcdd09"] },
  { id: "RI", name: "La Rioja", colors: ["#c8102e", "#009150"] },
  { id: "NC", name: "Navarra", colors: ["#c8102e", "#c8a951"] },
  { id: "AR", name: "Aragón", colors: ["#fcdd09", "#c60b1e"] },
  { id: "EX", name: "Extremadura", colors: ["#009150", "#000000"] },
  { id: "IB", name: "Islas Baleares", colors: ["#7b2d8b", "#fcdd09"] },
  { id: "CN", name: "Canarias", colors: ["#0060a8", "#fcdd09"] },
  { id: "MC", name: "Murcia", colors: ["#c8102e", "#c8a951"] },
  { id: "CE", name: "Ceuta", colors: ["#000000", "#ffffff"] },
  { id: "ML", name: "Melilla", colors: ["#0060a8", "#ffffff"] },
];

export const SPAIN_PROVINCES: ProvinceInfo[] = [
  { id: "M", name: "Madrid", region: "MD" },
  { id: "B", name: "Barcelona", region: "CT" },
  { id: "GI", name: "Girona", region: "CT" },
  { id: "L", name: "Lleida", region: "CT" },
  { id: "T", name: "Tarragona", region: "CT" },
  { id: "SE", name: "Sevilla", region: "AN" },
  { id: "MA", name: "Málaga", region: "AN" },
  { id: "CA", name: "Cádiz", region: "AN" },
  { id: "CO", name: "Córdoba", region: "AN" },
  { id: "GR", name: "Granada", region: "AN" },
  { id: "H", name: "Huelva", region: "AN" },
  { id: "J", name: "Jaén", region: "AN" },
  { id: "AL", name: "Almería", region: "AN" },
  { id: "V", name: "Valencia", region: "VC" },
  { id: "A", name: "Alicante", region: "VC" },
  { id: "CS", name: "Castellón", region: "VC" },
  { id: "C", name: "A Coruña", region: "GA" },
  { id: "LU", name: "Lugo", region: "GA" },
  { id: "OR", name: "Ourense", region: "GA" },
  { id: "PO", name: "Pontevedra", region: "GA" },
  { id: "VA", name: "Valladolid", region: "CL" },
  { id: "LE", name: "León", region: "CL" },
  { id: "SA", name: "Salamanca", region: "CL" },
  { id: "BU", name: "Burgos", region: "CL" },
  { id: "ZA", name: "Zamora", region: "CL" },
  { id: "PA", name: "Palencia", region: "CL" },
  { id: "AV", name: "Ávila", region: "CL" },
  { id: "SG", name: "Segovia", region: "CL" },
  { id: "SO", name: "Soria", region: "CL" },
  { id: "TO", name: "Toledo", region: "CM" },
  { id: "CR", name: "Ciudad Real", region: "CM" },
  { id: "AB", name: "Albacete", region: "CM" },
  { id: "CU", name: "Cuenca", region: "CM" },
  { id: "GU", name: "Guadalajara", region: "CM" },
  { id: "BI", name: "Bizkaia", region: "PV" },
  { id: "SS", name: "Gipuzkoa", region: "PV" },
  { id: "VI", name: "Álava", region: "PV" },
  { id: "S", name: "Cantabria", region: "CB" },
  { id: "O", name: "Asturias", region: "AS" },
  { id: "LO", name: "La Rioja", region: "RI" },
  { id: "NA", name: "Navarra", region: "NC" },
  { id: "Z", name: "Zaragoza", region: "AR" },
  { id: "HU", name: "Huesca", region: "AR" },
  { id: "TE", name: "Teruel", region: "AR" },
  { id: "BA", name: "Badajoz", region: "EX" },
  { id: "CC", name: "Cáceres", region: "EX" },
  { id: "PM", name: "Illes Balears", region: "IB" },
  { id: "GC", name: "Las Palmas", region: "CN" },
  { id: "TF", name: "Santa Cruz de Tenerife", region: "CN" },
  { id: "MU", name: "Murcia", region: "MC" },
  { id: "CE", name: "Ceuta", region: "CE" },
  { id: "ML", name: "Melilla", region: "ML" },
];

export function getProvincesForCountry(countryCode: string): ProvinceInfo[] {
  if (countryCode === "ES") return SPAIN_PROVINCES;
  return [];
}

export function getRegionsForCountry(countryCode: string): RegionInfo[] {
  if (countryCode === "ES") return SPAIN_REGIONS;
  return [];
}
