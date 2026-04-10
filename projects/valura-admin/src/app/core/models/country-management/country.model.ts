export interface Country {
  id: number;
  name: string;
  countryPhoneCode: string;
  countryCode: string;
  dsrResolutionTime: number;
  dsrResolutionExtensionTime: number;
  countryFlagUrl: string;
  phoneNumberLength: number;
}

export interface CreateCountryPayload {
  actId: number;
  name: string;
  countryPhoneCode: string;
  countryCode: string;
  dsrResolutionTime: number;
  dsrResolutionExtensionTime: number;
  phoneNumberLength: number;
}

export interface UpdateCountryPayload {
  name: string;
  countryPhoneCode: string;
  countryCode: string;
  dsrResolutionTime: number;
  dsrResolutionExtensionTime: number;
  phoneNumberLength: number;
}
