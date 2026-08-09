import administrativeUnits from '@/data/json/vn_only_simplified_json_generated_data_vn_units.json';

export interface Ward {
  Code: string;
  FullName: string;
  ProvinceCode: string;
}

export interface Province {
  Code: string;
  FullName: string;
  Wards: Ward[];
}

const provinces = administrativeUnits as Province[];
const provincesByCode = new Map(provinces.map((province) => [province.Code, province]));
const wardsByCode = new Map(provinces.flatMap((province) => province.Wards.map((ward) => [ward.Code, ward])));

export function getProvinces(): readonly Province[] {
  return provinces;
}

export function getWardsByProvince(provinceCode: string): readonly Ward[] {
  return provincesByCode.get(provinceCode)?.Wards ?? [];
}

export function findProvince(code: string): Province | undefined {
  return provincesByCode.get(code);
}

export function findWard(code: string): Ward | undefined {
  return wardsByCode.get(code);
}
