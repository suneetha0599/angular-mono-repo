/// <reference lib="webworker" />
import Dexie from 'dexie';

let intervalId: any | undefined;
let apiUrl = '';
let queryUrl = '';
let token = '';
let configurationVersion = '';
let lastFailedConfig: any = null;
let isPaused = false;
let interval = 120000; // 2 minutes

let isSyncInProgress = false;
let pendingForceSync = false;
const DB_VERSION = 2;
enum state {
  INIT = "INIT",
  STOP = "STOP",
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  UPDATE_TOKEN = "UPDATE_TOKEN",
  UPDATE_DB = "UPDATE_DB",
  FORCE_SYNC = "FORCE_SYNC"
}

class WorkerDB extends Dexie {
  country!: Dexie.Table<any, number>;
  regulations!: Dexie.Table<any, number>;
  right!: Dexie.Table<any, number>;
  legalBasis!: Dexie.Table<any, number>;
  triggers!: Dexie.Table<any, number>;
  validationQuestion!: Dexie.Table<any, number>;
  declaration!: Dexie.Table<any, number>;
  securityControl!: Dexie.Table<any, number>;
  thirdParty!: Dexie.Table<any, number>;
  platForm!: Dexie.Table<any, number>;
  pdElements!: Dexie.Table<any, number>;
  pdCategory!: Dexie.Table<any, number>;
  dataSubject!: Dexie.Table<any, number>;
  parameter!: Dexie.Table<any, number>;
  department!: Dexie.Table<any, number>;
  assessmentType!: Dexie.Table<any, number>;
  classification!: Dexie.Table<any, number>;

  constructor() {
    super('ValuraDB');
    this.version(DB_VERSION).stores({
      adminUsers: 'applicationUserId, displayName, firstName, lastName, email, phone, isActive, userType, entities',
      internalUsers: 'applicationUserId, displayName, firstName, lastName, email, phone, isActive, userType, entities',
      externalUsers: 'applicationUserId, displayName, firstName, lastName, email, phone, isActive, userType, entities',
      regulations: 'id, name, jurisdiction, dataSubjectRegion, countries, isEnabled, respondTime, extensionTime, displayInForm',
      legalBasis: 'id, actId, name',
      securityControl: 'id, name',
      pdElements: 'id, name, categoryIds, classificationIds,categoryId, classificationId, classification,categoryMappings, classificationMappings',
      dataSubject: 'id, name, description',
      department: 'id, name, description',
      triggers: 'id, name, source, triggerLabel, createdAt, updatedAt, actId, assessmentType',
      thirdParty: 'id, name, description',
      platForm: 'id, name',
      validationQuestion: 'id, actId, question, optionName, questionType, typeOfOptions, shouldDisplayChildQuestion, section, type, entityType, entityId, provision',
      declaration: 'id, declaration, type, actId, entityType, entityId, displayInForm, clientOverride',
      right: 'id, actId, displayName, metaJson, rightTitle, rightDescription, rightTitleSimplified, rightDescriptionSimplified, displayInForm, declarations, specificValidationsJson, rightsCategory, icon, clientOverride',
      country: 'id, name, countryPhoneCode, countryCode, dsrResolutionTime, dsrResolutionExtensionTime, phoneNumberLength, createdAt',
      pdCategory: 'id, name',
      parameter: 'id, name',
      assessmentType: 'id, name',
      classification: 'id, name, description',
    });
  }
}

const db = new WorkerDB();

const authHeaders = () => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

addEventListener('message', async ({ data }) => {
  switch (data.type) {
    case state.INIT:
    case state.FORCE_SYNC:
      queryUrl = data.queryUrl;
      apiUrl = data.apiUrl;
      token = data.token;
      configurationVersion = data.configurationVersion;
      const forceSync = data.type === state.FORCE_SYNC;

      if (!isSyncInProgress) {
        await fetchAndStore(forceSync);
      }
      else if (forceSync) {
        pendingForceSync = true; // queue a force sync
      }

      if (!intervalId) {
        intervalId = setInterval(fetchAndStore, interval);
      }
      break;

    case state.STOP:
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
      break;

    case state.UPDATE_TOKEN:
      token = data.token;
      if (isPaused) {
        isPaused = false;
      }
      if (lastFailedConfig) {
        await fetchConfigurationAPI([lastFailedConfig]);
        lastFailedConfig = null;
      }
      break;
  }
});

async function fetchAndStore(forceSync: boolean = false) {
  if (isPaused || isSyncInProgress) return;
  isSyncInProgress = true;

  try {
    const sinceVersion = configurationVersion ? `?sinceVersion=${configurationVersion}` : ''
    const url = `${apiUrl}${queryUrl}${sinceVersion}`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    const configs = data?.data?.changedEntities ?? [];
    await fetchConfigurationAPI(configs);
    postMessage({ type: state.SUCCESS });
  } catch (err: any) {
    console.error(err);
    if (err.status === 401) {
      isPaused = true;
      postMessage({ type: state.TOKEN_EXPIRED });
      return;
    }
    postMessage({ type: state.FAILURE, error: err.message });
  } finally {
    isSyncInProgress = false;
    if (pendingForceSync) {
      pendingForceSync = false;
      await fetchAndStore(true);
    }
  }
}

async function fetchConfigurationAPI(configs: any[]) {
  let eventSent = false;

  for (const config of configs) {
    try {
      if (!config.url) continue;
      const res = await fetchWithRetry(`${apiUrl}${config.url}`);
      const responseData = await res.json();

      await saveToDB(config.key, responseData.data);

      if (!eventSent) {
        configurationVersion = responseData.configurationVersion;
        postMessage({ type: state.UPDATE_DB, payload: { configurationVersion } });
        eventSent = true;
      }
    } catch (err: any) {
      console.error(err);
      if (err.status === 401) {
        lastFailedConfig = config;
        isPaused = true;
        postMessage({ type: state.TOKEN_EXPIRED });
        return;
      }
      postMessage({ type: state.FAILURE, api: config.url, error: err.message });
    }
  }
}

async function fetchWithRetry(url: string, retries = 3, delay = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: authHeaders() });
    if (res.status === 401) throw { status: 401 };
    if (res.ok) return res;

    if (i < retries - 1) {
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error(`Failed after ${retries} attempts for ${url}`);
}

// Save based on key mapping
async function saveToDB(key: string, data: any) {
  switch (key) {
    case 'COUNTRY':
      const country = (data.countries) ?? [];
      await db.country.bulkPut(country);
      break;
    case 'REGULATIONS':
      const regulations = (data.acts) ?? [];
      await db.regulations.clear();
      await db.regulations.bulkPut(regulations);
      break;
    case 'RIGHTS':
      const right = (data.rights)
      await db.right.bulkPut(right);
      break;
    case 'LEGAL_BASIS':
      const legalbasis = (data.legalBasis) ?? []
      await db.legalBasis.bulkPut(legalbasis);
      break;
    case 'TRIGGERS':
      const triggers = (data.triggers) ?? []
      await db.triggers.bulkPut(triggers);
      break;
    case 'VALIDATION_QUESTIONS':
      const validationQuestion = (data.generalValidationQuestions) ?? []
      await db.validationQuestion.bulkPut(validationQuestion);
      break;
    case 'DECLARATIONS':
      const declaration = (data.generalDeclaration) ?? []
      await db.declaration.bulkPut(declaration);
      break;
    case 'SECURITY_CONTROLS':
      const securityControl = (data.securityControls) ?? []
      await db.securityControl.bulkPut(securityControl);
      break;
    case 'THIRD_PARTY':
      const thirdParty = (data.thirdPartyRoles) ?? []
      await db.thirdParty.bulkPut(thirdParty);
      break;
    case 'PLATFORM':
      const platForm = (data.platform) ?? []
      await db.platForm.bulkPut(platForm);
      break;
    case 'PD_ELEMENTS':
      const pdElements = (data.pdElements) ?? []
      await db.pdElements.bulkPut(pdElements);
      break;
    case 'PD_CATEGORY':
      const pdCategory = (data.pdCategories) ?? []
      await db.pdCategory.bulkPut(pdCategory);
      break;
    case 'DATA_SUBJECT':
      const dataSubject = (data.dataSubjects) ?? []
      await db.dataSubject.bulkPut(dataSubject);
      break;
    case 'PARAMETERS':
      const parameter = (data.parameters) ?? []
      await db.parameter.bulkPut(parameter);
      break;
    case 'DEPARTMENT':
      const department = (data) ?? []
      await db.department.bulkPut(department);
      break;
    default:
      console.warn(`No DB mapping for key: ${key}`)
  }
}
