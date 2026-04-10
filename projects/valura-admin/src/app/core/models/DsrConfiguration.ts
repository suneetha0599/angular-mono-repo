import { PdElement } from "./data-inventory/BPA";

export class DsrConfiguration {
    emailRegex: string;
    countryList: Country[];
    defaultCountry: number;
    dataSubjectRequestUserTypeList: DataSubjectUserType[];
    organizationList: Organization[];
    roleList: Role[];
    priorityList: string[];
    channelList: string[];
    statusList: string[];
    dsrFormStatusConstants: any[]
    constructor({
        emailRegex = "",
        countryList = [],
        defaultCountry = -1,
        dataSubjectRequestUserTypeList = [],
        organizationList = [],
        roleList = [],
        priorityList = [],
        statusList = [],
        channelList = [],
        dsrFormStatusConstants = []
    }) {
        this.emailRegex = emailRegex
        this.countryList = countryList
        this.defaultCountry = defaultCountry
        this.dataSubjectRequestUserTypeList = dataSubjectRequestUserTypeList
        this.organizationList = organizationList
        this.roleList = roleList
        this.priorityList = priorityList
        this.statusList = statusList
        this.channelList = channelList
        this.dsrFormStatusConstants = dsrFormStatusConstants
    }
}
export class RequestType {
    id: number;
    title: string;
    selected: boolean;

    constructor({
        id = 0,
        title = "",
        selected = false
    }) {
        this.id = id
        this.title = title
        this.selected = selected
    }
}

export class FormConfig {
    country_list: Country[];
    role_list: Role[];
    organization_list: Organization[];
    data_subject_request_user_type_list: DataSubjectUserType[];

    constructor({
        country_list = [],
        role_list = [],
        organization_list = [],
        data_subject_request_user_type_list = []
    }) {
        this.country_list = country_list
        this.role_list = role_list
        this.organization_list = organization_list
        this.data_subject_request_user_type_list = data_subject_request_user_type_list
    }
}

export class Country {
    id: number;
    name: string;
    countryPhoneCode: string
    selected?: boolean;

    constructor({ id = 0, name = "", countryPhoneCode = "", selected = false }) {
        this.id = id;
        this.name = name;
        this.countryPhoneCode = countryPhoneCode
        this.selected = selected
    }
}

export class Frequency {
    id: number;
    name: string;
    label: string;
    selected?: boolean

    constructor({ id = 0, name = "", label = "" }) {
        this.id = id;
        this.name = name;
        this.label = label;
    }
}

export class Role {
    name: string;
    description: string;
    selected: boolean;

    constructor({ name = "", description = "", selected = false }) {
        this.name = name;
        this.description = description;
        this.selected = selected
    }
}

export class Organization {
    name: string;

    constructor({ name = "" }) {
        this.name = name;
    }
}

export class DataSubjectUserType {
    id: number;
    name: string;
    description: string;
    userIdentityList?: UserIdentity[];
    selected?: boolean;
    pdElementList?: PdElement[]

    constructor({
        id = 0,
        name = "",
        description = "",
        userIdentityList = [],
        selected = false,
        pdElementList = []
    }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.userIdentityList = userIdentityList
        this.selected = selected
        this.pdElementList = pdElementList
    }
}

export class UserIdentity {
    name: string;
    description: string;
    input_type: string;
    regex: string;

    constructor({
        name = "",
        description = "",
        input_type = "",
        regex = ""
    }) {
        this.name = name;
        this.description = description;
        this.input_type = input_type;
        this.regex = regex;
    }
}
