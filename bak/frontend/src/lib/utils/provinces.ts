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
}

export const SPAIN_REGIONS: RegionInfo[] = [
  { id: "MD", name: "Comunidad de Madrid", flag: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Bandera_de_la_Comunidad_de_Madrid.svg" },
  { id: "CT", name: "Cataluña", flag: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Bandera_de_Catalu%C3%B1a.svg" },
  { id: "AN", name: "Andalucía", flag: "https://upload.wikimedia.org/wikipedia/commons/4/42/Bandera_de_Andaluc%C3%ADa.svg" },
  { id: "VC", name: "Comunidad Valenciana", flag: "https://upload.wikimedia.org/wikipedia/commons/d/df/Bandera_de_la_Comunidad_Valenciana.svg" },
  { id: "GA", name: "Galicia", flag: "https://upload.wikimedia.org/wikipedia/commons/6/64/Bandera_de_Galicia.svg" },
  { id: "CL", name: "Castilla y León", flag: "https://upload.wikimedia.org/wikipedia/commons/1/13/Bandera_de_Castilla_y_Le%C3%B3n.svg" },
  { id: "CM", name: "Castilla-La Mancha", flag: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Bandera_de_Castilla-La_Mancha.svg" },
  { id: "PV", name: "País Vasco", flag: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Bandera_del_Pa%C3%ADs_Vasco.svg" },
  { id: "CB", name: "Cantabria", flag: "https://upload.wikimedia.org/wikipedia/commons/3/30/Bandera_de_Cantabria.svg" },
  { id: "AS", name: "Asturias", flag: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Bandera_de_Asturias.svg" },
  { id: "RI", name: "La Rioja", flag: "https://upload.wikimedia.org/wikipedia/commons/d/db/Bandera_de_La_Rioja.svg" },
  { id: "NC", name: "Navarra", flag: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Bandera_de_Navarra.svg" },
  { id: "AR", name: "Aragón", flag: "https://upload.wikimedia.org/wikipedia/commons/1/18/Bandera_de_Arag%C3%B3n.svg" },
  { id: "EX", name: "Extremadura", flag: "https://upload.wikimedia.org/wikipedia/commons/1/13/Bandera_de_Extremadura.svg" },
  { id: "IB", name: "Islas Baleares", flag: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Bandera_de_las_Islas_Baleares.svg" },
  { id: "CN", name: "Canarias", flag: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Bandera_de_Canarias.svg" },
  { id: "MC", name: "Murcia", flag: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Bandera_de_la_Regi%C3%B3n_de_Murcia.svg" },
  { id: "CE", name: "Ceuta", flag: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Bandera_de_Ceuta.svg" },
  { id: "ML", name: "Melilla", flag: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Bandera_de_Melilla.svg" },
];

export const SPAIN_PROVINCES: ProvinceInfo[] = [
  { id: "M", name: "Madrid", region: "MD", flag: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Bandera_de_la_Comunidad_de_Madrid.svg" },
  { id: "B", name: "Barcelona", region: "CT", flag: "https://upload.wikimedia.org/wikipedia/commons/7/77/Bandera_de_la_prov%C3%ADncia_de_Barcelona.svg" },
  { id: "GI", name: "Girona", region: "CT" },
  { id: "L", name: "Lleida", region: "CT" },
  { id: "T", name: "Tarragona", region: "CT" },
  { id: "SE", name: "Sevilla", region: "AN", flag: "https://upload.wikimedia.org/wikipedia/commons/2/23/Bandera_de_la_Provincia_de_Sevilla.svg" },
  { id: "MA", name: "Málaga", region: "AN" },
  { id: "CA", name: "Cádiz", region: "AN" },
  { id: "CO", name: "Córdoba", region: "AN" },
  { id: "GR", name: "Granada", region: "AN" },
  { id: "H", name: "Huelva", region: "AN" },
  { id: "J", name: "Jaén", region: "AN" },
  { id: "AL", name: "Almería", region: "AN" },
  { id: "V", name: "Valencia", region: "VC", flag: "https://upload.wikimedia.org/wikipedia/commons/b/bb/Bandera_de_la_Provincia_de_Valencia.svg" },
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
