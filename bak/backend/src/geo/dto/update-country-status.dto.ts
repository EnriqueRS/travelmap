import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum CountryStatus {
  WANT_TO_VISIT = 'want_to_visit',
  PLANNED = 'planned',
  VISITED = 'visited',
  LIVED = 'lived'
}

export class UpdateCountryStatusDto {
  @IsEnum(CountryStatus)
  status: CountryStatus;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}