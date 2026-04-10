import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { User } from '../../models/user.model';
import { Classfication, Country, DataSubject, Declaration, LegalBasis, PdCategory, PdElements, Platform, Regulation, RegulationRight, RegulationsTrigger, SecurityControl, ThirdPartyRole, ValidationQuestion } from '@admin-core/models/configuration/regulation';
import { Department } from '@admin-core/models/user-management/users.model';
import { AssessmentType } from '@admin-core/models/assessment/assessment';
import { RiskParameter } from '@admin-page/data-discovery/bpa-listing/create-bpa/risk-summary-screen/models/risk-summary-model';



// Dexie DB class
export class AppDB extends Dexie {
  adminUsers!: Table<User, number>;
  internalUsers!: Table<User, number>;
  externalUsers!: Table<User, number>;
  regulations!: Table<Regulation, number>;
  legalBasis!: Table<LegalBasis, number>;
  securityControl!: Table<SecurityControl, number>;
  pdElements!: Table<PdElements, number>;
  dataSubject!: Table<DataSubject, number>;
  department!: Table<Department, number>;
  triggers!: Table<RegulationsTrigger, number>;
  thirdParty!: Table<ThirdPartyRole, number>;
  platForm!: Table<Platform, number>;
  validationQuestion!: Table<ValidationQuestion, number>;
  declaration!: Table<Declaration, number>;
  right!: Table<RegulationRight, number>;
  country!: Table<Country, number>;
  pdCategory!: Table<PdCategory, number>;
  parameter!: Table<RiskParameter, number>;
  assessmentType!: Table<AssessmentType, number>;
  classification!: Table<Classfication, number>;

  DB_VERSION = 2;

  constructor() {
    super('ValuraDB');
    this.version(this.DB_VERSION).stores({
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
      validationQuestion: 'id, question, actId, optionName, questionType, typeOfOptions, shouldDisplayChildQuestion, section, type, entityType, entityId, provision',
      declaration: 'id, declaration, type, entityType, entityId, actId, displayInForm, clientOverride',
      right: 'id, actId, displayName, metaJson, rightTitle, rightDescription, rightTitleSimplified, rightDescriptionSimplified, displayInForm, declarations, specificValidationsJson, rightsCategory, icon, clientOverride',
      country: 'id, name, countryPhoneCode, countryCode, dsrResolutionTime, dsrResolutionExtensionTime, phoneNumberLength, createdAt',
      pdCategory: 'id, name, sensitivity',
      parameter: 'id, name',
      assessmentType: 'id, name',
      classification: 'id, name, description',
    });
  }
}
@Injectable({
  providedIn: 'root'
})
export class DbService {
  private db = new AppDB();

  constructor() { }

  /* Users */
  addAdminUser(user: User): Promise<number> {
    return this.db.adminUsers.add(user);
  }

  deletAdminUser(id: number): Promise<void> {
    return this.db.adminUsers.delete(id);
  }

  getAdminUser(): Promise<User | undefined> {
    return this.db.adminUsers.get(1);
  }

  getAdminUserById(id: number): Promise<User | undefined> {
    return this.db.adminUsers.get(id);
  }

  async updateAdminUser(id: number, userDetails: any): Promise<User | undefined> {
    const updated = await this.db.adminUsers.update(id, userDetails);
    if (updated) {
      return this.db.adminUsers.get(id);
    }
    return undefined;
  }

  addBulkAdminUsers(users: User[]): Promise<number> {
    return this.db.adminUsers.bulkPut(users);
  }

  getAllAdminUsers(): Promise<User[]> {
    return this.db.adminUsers?.toArray() ?? [];
  }

  /* Internal users */

  addInternalUser(user: User): Promise<number> {
    return this.db.internalUsers.add(user);
  }

  addBulkInternalUsers(users: User[]): Promise<number> {
    return this.db.internalUsers.bulkPut(users);
  }

  getInternalUserById(id: number): Promise<User | undefined> {
    return this.db.internalUsers.get(id);
  }

  getAllInternalUsers(): Promise<User[]> {
    return this.db.internalUsers?.toArray() ?? [];
  }

  async updateInternalUser(id: number, userDetails: any): Promise<User | undefined> {
    const updated = await this.db.internalUsers.update(id, userDetails);
    if (updated) {
      return this.db.internalUsers.get(id);
    }
    return undefined;
  }

  deletInternalUser(id: number): Promise<void> {
    return this.db.internalUsers.delete(id);
  }

  /* External users */
  addExternalUser(user: User): Promise<number> {
    return this.db.externalUsers.add(user);
  }

  addBulkExternalUsers(users: User[]): Promise<number> {
    return this.db.externalUsers.bulkPut(users);
  }

  getExternalUserById(id: number): Promise<User | undefined> {
    return this.db.externalUsers.get(id);
  }

  getAllExternalUsers(): Promise<User[]> {
    return this.db.externalUsers?.toArray() ?? [];
  }

  async updateExternalUser(id: number, userDetails: any): Promise<User | undefined> {
    const updated = await this.db.externalUsers.update(id, userDetails);
    if (updated) {
      return this.db.externalUsers.get(id);
    }
    return undefined;
  }

  /* Regulations */
  addBulkRegulations(regulations: Regulation[]): Promise<number> {
    return this.db.regulations.bulkPut(regulations);
  }

  getAllRegulations(): Promise<Regulation[]> {
    return this.db.regulations?.toArray() ?? [];
  }

  deleteRegulation(id: number): Promise<void> {
    return this.db.regulations.delete(id);
  }

  addRegulation(regulation: any): Promise<number> {
    return this.db.regulations.add(regulation);
  }

  getRegulationById(id: number): Promise<Regulation | undefined> {
    return this.db.regulations.get(id);
  }

  async updateRegulation(id: number, regulationDetails: any): Promise<Regulation | undefined> {
    const updated = await this.db.regulations.update(id, regulationDetails);
    if (updated) {
      return this.db.regulations.get(id);
    }
    return undefined;
  }

  getAllRegulation(): Promise<Regulation[]> {
    return this.db.regulations?.toArray() ?? [];
  }

  /* Legal basis */
  addBulkLegalBasis(legalBasis: LegalBasis[]): Promise<number> {
    return this.db.legalBasis.bulkPut(legalBasis);
  }

  getLegalBasisById(id: number): Promise<LegalBasis | undefined> {
    return this.db.legalBasis.get(id);
  }

  getAllLegalBasis(): Promise<LegalBasis[]> {
    return this.db.legalBasis?.toArray() ?? [];
  }

  addLegalBasis(legalBasis: LegalBasis): Promise<number> {
    return this.db.legalBasis.add(legalBasis);
  }

  async updateLegalBasis(id: number, legalBasisDetails: any): Promise<LegalBasis | undefined> {
    const updated = await this.db.legalBasis.update(id, legalBasisDetails);
    if (updated) {
      return this.db.legalBasis.get(id);
    }
    return undefined;
  }

  deleteLegalBasis(id: number): Promise<void> {
    return this.db.legalBasis.delete(id);
  }

  async getLegalBasisByActId(actId: number): Promise<LegalBasis[]> {
    return this.db.legalBasis.where('actId').equals(actId).toArray();
  }

  async replaceLegalBasisForActId(actId: number, legalBasisList: LegalBasis[]): Promise<void> {
    await this.db.legalBasis.where('actId').equals(actId).delete();
    if (legalBasisList && legalBasisList.length > 0) {
      await this.db.legalBasis.bulkPut(legalBasisList);
    }
  }

  /* Trigger */
  addBulkTriggers(triggers: RegulationsTrigger[]): Promise<number> {
    return this.db.triggers.bulkPut(triggers);
  }

  addTrigger(trigger: RegulationsTrigger): Promise<number> {
    return this.db.triggers.add(trigger);
  }

  deleteTriggers(id: number): Promise<void> {
    return this.db.triggers.delete(id);
  }

  updateTrigger(trigger: RegulationsTrigger): Promise<number> {
    return this.db.triggers.put(trigger);
  }

  getTriggersById(id: number): Promise<RegulationsTrigger | undefined> {
    return this.db.triggers.get(id);
  }

  async getTriggerByActId(actId: number) {
    const triggers = await this.db.triggers.where('actId').equals(actId).toArray();
    return triggers
  }

  async getTriggerByActIdAndTypeId(actId: number, typeId: number) {
    const triggers = await this.db.triggers.where('actId').equals(actId).toArray();
    return triggers.filter((t: any) => t.assessmentType === typeId);
  }

  async getValidationQuestionByType(type: string, actId: number) {
    const question = await this.db.validationQuestion.where('actId').equals(actId).toArray();
    return question.filter((t: any) => t.entityType === type);
  }

  async getValidationQuestionByRegulationId(actId: number) {
    const question = await this.db.validationQuestion.where('actId').equals(actId).toArray();
    return question;
  }

  getAllTriggers(): Promise<RegulationsTrigger[]> {
    return this.db.triggers?.toArray() ?? [];
  }

  /* Security Controls*/
  addBulkSecurityControls(securityControl: SecurityControl[]): Promise<number> {
    return this.db.securityControl.bulkPut(securityControl);
  }

  addNewSecurityControl(securityControl: SecurityControl): Promise<number> {
    return this.db.securityControl.add(securityControl);
  }

  getSecurityControlsById(id: number): Promise<SecurityControl | undefined> {
    return this.db.securityControl.get(id);
  }

  getAllSecurityControls(): Promise<SecurityControl[]> {
    return this.db.securityControl?.toArray() ?? [];
  }

  deleteSecurityControl(id: number): Promise<void> {
    return this.db.securityControl.delete(id);
  }

  /* Pd elements*/
  addBulkPdElements(pdElements: PdElements[]): Promise<number> {
    return this.db.pdElements.bulkPut(pdElements);
  }

  getPdElementsById(id: number): Promise<PdElements | undefined> {
    return this.db.pdElements.get(id);
  }

  getAllPdElements(): Promise<PdElements[]> {
    return this.db.pdElements?.toArray() ?? [];
  }

  addPdElement(parameter: PdElements): Promise<number> {
    return this.db.pdElements.add(parameter);
  }

  async updatePdElement(id: number, PdElemnetsDetail: any): Promise<PdElements | undefined> {
    const updated = await this.db.pdElements.update(id, PdElemnetsDetail);
    if (updated) {
      return this.db.pdElements.get(id);
    }
    return undefined;
  }

  async getPdElementsByCategoryId(categoryId: number) {
    const pdElements = await this.db.pdElements.where('categoryId').equals(categoryId).toArray();
    return pdElements
  }

  deletPdElement(id: number): Promise<void> {
    return this.db.pdElements.delete(id);
  }


  /* Data subject*/
  addBulkDataSubject(dataSubject: DataSubject[]): Promise<number> {
    return this.db.dataSubject.bulkPut(dataSubject);
  }

  getDataSubjectById(id: number): Promise<DataSubject | undefined> {
    return this.db.dataSubject.get(id);
  }

  addDataSubject(parameter: DataSubject): Promise<number> {
    return this.db.dataSubject.add(parameter);
  }

  getAllDatasubject(): Promise<DataSubject[]> {
    return this.db.dataSubject?.toArray() ?? [];
  }

  async updateDatasubject(id: number, DataSubjectDetail: any): Promise<DataSubject | undefined> {
    const updated = await this.db.dataSubject.update(id, DataSubjectDetail);
    if (updated) {
      return this.db.dataSubject.get(id);
    }
    return undefined;
  }

  deletDataSubject(id: number): Promise<void> {
    return this.db.dataSubject.delete(id);
  }

  /*Department*/

  addDepartment(department: Department): Promise<number> {
    return this.db.department.put(department);
  }

  addBulkDepartments(department: Department[]): Promise<number> {
    return this.db.department.bulkPut(department);
  }

  getDepartmentsById(id: number): Promise<Department | undefined> {
    return this.db.department.get(id);
  }

  getAllDepartments(): Promise<Department[]> {
    return this.db.department?.toArray() ?? [];
  }

  getAllDepartmentsByName(searchQuery: string): Promise<Department[]> {
    if (searchQuery) {
      return this.db.department
        .where('name')
        .startsWithIgnoreCase(searchQuery)?.toArray() ?? [];
    }
    return this.db.department?.toArray() ?? [];
  }

  async updateDepartments(id: number, departmentDetail: any): Promise<Department | undefined> {
    const updated = await this.db.department.update(id, departmentDetail);
    if (updated) {
      return this.db.department.get(id);
    }
    return undefined;
  }

  deleteDepartment(id: number): Promise<void> {
    return this.db.department.delete(id);
  }


  /* Third party */
  addBulkThirdParty(thirdParty: ThirdPartyRole[]): Promise<number> {
    return this.db.thirdParty.bulkPut(thirdParty);
  }

  getThirdPartyById(id: number): Promise<ThirdPartyRole | undefined> {
    return this.db.thirdParty.get(id);
  }

  /* Platform */
  addBulkPlatform(platForm: Platform[]): Promise<number> {
    return this.db.platForm.bulkPut(platForm);
  }

  getPlatformById(id: number): Promise<Platform | undefined> {
    return this.db.platForm.get(id);
  }

  /* Validation Questions */
  addBulkValidationQuestion(validationQuestion: ValidationQuestion[]): Promise<number> {
    return this.db.validationQuestion.bulkPut(validationQuestion);
  }

  getValidationQuestionById(id: number): Promise<ValidationQuestion | undefined> {
    return this.db.validationQuestion.get(id);
  }

  addValidationQuestion(validationQuestion: ValidationQuestion): Promise<number> {
    return this.db.validationQuestion.add(validationQuestion);
  }
  updateValidationQuestionById(validationQuestion: ValidationQuestion): Promise<number> {
    return this.db.validationQuestion.put(validationQuestion);
  }

  deleteValidationQuestion(id: number): Promise<void> {
    return this.db.validationQuestion.delete(id);
  }

  async getValidationQuestions(entityType: string): Promise<ValidationQuestion[]> {
    const questions = await this.db.validationQuestion.where('entityType').equals(entityType).toArray();
    return questions;
  }

  /* Declarations */
  addBulkDeclaration(declarations: Declaration[]): Promise<number> {
    return this.db.declaration.bulkPut(declarations);
  }

  getDeclarationById(id: number): Promise<Declaration | undefined> {
    return this.db.declaration.get(id);
  }

  getAllDeclarations(): Promise<Declaration[]> {
    return this.db.declaration?.toArray() ?? [];
  }

  getDeclarationByActId(actId: number) {
    return this.db.declaration.where('actId').equals(actId).toArray();
  }

  addDeclaration(declaration: Declaration): Promise<number> {
    return this.db.declaration.add(declaration);
  }

  async updateDeclaration(id: number, declarationDetails: any): Promise<Declaration | undefined> {
    const updated = await this.db.declaration.update(id, declarationDetails);
    if (updated) {
      return this.db.declaration.get(id);
    }
    return undefined;
  }

  deleteDeclaration(id: number): Promise<void> {
    return this.db.declaration.delete(id);
  }

  async getDeclarationsByEntity(entityType: string, actId: number): Promise<Declaration[]> {
    const declarations = await this.db.declaration
      .where('actId')
      .equals(actId)
      .toArray();
    return declarations.filter((d: Declaration) => d.entityType === entityType);
  }

  async getDeclarationsByEntityType(entityType: string, actId: number): Promise<Declaration[]> {
    const declarations = await this.db.declaration
      .where('actId')
      .equals(actId)
      .toArray();
    return declarations.filter((d: Declaration) => d.entityType === entityType);
  }

  async getDeclarationsByEntityId(entityType: string, entityId: number): Promise<Declaration[]> {
    const declarations = await this.db.declaration
      .where('entityId')
      .equals(entityId)
      .toArray();
    return declarations.filter((d: Declaration) => d.entityType === entityType);
  }

  async getDeclarationsByActId(actId: number): Promise<Declaration[]> {
    const declarations = await this.db.declaration
      .where('actId')
      .equals(actId)
      .toArray();
    return declarations
  }

  /* Rights */
  addBulkRights(regulationRight: RegulationRight[]): Promise<number> {
    return this.db.right.bulkPut(regulationRight);
  }

  getRightsById(id: number): Promise<RegulationRight | undefined> {
    return this.db.right.get(id);
  }

  getRightsByActId(actId: number) {
    return this.db.right.where('actId').equals(actId).toArray();
  }

  getAllRights(): Promise<RegulationRight[]> {
    return this.db.right?.toArray() ?? [];
  }

  deleteRight(id: number): Promise<void> {
    return this.db.right.delete(id);
  }

  addRight(rightData: any): Promise<number> {
    return this.db.right.add(rightData);
  }

  async updateRight(id: number, rightsDetails: any): Promise<RegulationRight | undefined> {
    const updated = await this.db.right.update(id, rightsDetails);
    if (updated) {
      return this.db.right.get(id);
    }
    return undefined;
  }

  /* Country */
  addBulkCountry(country: Country[]): Promise<number> {
    return this.db.country.bulkPut(country);
  }

  getCountryById(id: number): Promise<Country | undefined> {
    return this.db.country.get(id);
  }

  getAllCountry(sortByName: boolean = false): Promise<Country[]> {
    if (sortByName) {
      return this.db.country.orderBy('name')?.toArray() ?? [];
    }
    return this.db.country?.toArray() ?? [];
  }

  addCountry(country: Country): Promise<number> {
    return this.db.country.add(country);
  }

  async updateCountry(id: number, countryDetail: any): Promise<Country | undefined> {
    const updated = await this.db.country.update(id, countryDetail);
    if (updated) {
      return this.db.country.get(id);
    }
    return undefined;
  }

  deleteCountry(id: number): Promise<void> {
    return this.db.country.delete(id);
  }

  /* Pd categories*/
  addBulkPdCategory(pdcategories: PdCategory[]): Promise<number> {
    return this.db.pdCategory.bulkPut(pdcategories);
  }

  getPdCategoryById(id: number): Promise<PdCategory | undefined> {
    return this.db.pdCategory.get(id);
  }

  getAllPdCategory(): Promise<PdCategory[]> {
    return this.db.pdCategory?.toArray() ?? [];
  }

  addPdCategory(parameter: PdCategory): Promise<number> {
    return this.db.pdCategory.add(parameter);
  }

  async updatePdCategory(id: number, PdCategoryDetail: any): Promise<PdCategory | undefined> {
    const updated = await this.db.pdCategory.update(id, PdCategoryDetail);
    if (updated) {
      return this.db.pdCategory.get(id);
    }
    return undefined;
  }

  async updateClassfication(id: number, PdClassficationDetail: any): Promise<Classfication | undefined> {
    const updated = await this.db.classification.update(id, PdClassficationDetail);
    if (updated) {
      return this.db.classification.get(id);
    }
    return undefined;
  }

  deletPdCategory(id: number): Promise<void> {
    return this.db.pdCategory.delete(id);
  }

  /* Parameters*/

  addParameter(parameter: RiskParameter): Promise<number> {
    return this.db.parameter.add(parameter);
  }

  addBulkParameters(parameter: RiskParameter[]): Promise<number> {
    return this.db.parameter.bulkPut(parameter);
  }

  getParametersById(id: number): Promise<RiskParameter | undefined> {
    return this.db.parameter.get(id);
  }

  getAllParameters(): Promise<RiskParameter[]> {
    return this.db.parameter?.toArray() ?? [];
  }

  /* Assessment Types*/

  addAssessmentType(assessmentType: AssessmentType): Promise<number> {
    return this.db.assessmentType.add(assessmentType);
  }

  deleteAssessmentType(id: number): Promise<void> {
    return this.db.assessmentType.delete(id);
  }

  updateAssessmentType(
    id: number,
    changes: Partial<AssessmentType>
  ): Promise<number> {
    return this.db.assessmentType.update(id, changes);
  }

  addBulkAssessmentTypes(parameter: AssessmentType[]): Promise<number> {
    return this.db.assessmentType.bulkPut(parameter);
  }

  getAssessmentTypeById(id: number): Promise<AssessmentType | undefined> {
    return this.db.assessmentType.get(id);
  }

  getAllAssessmentType(): Promise<AssessmentType[]> {
    return this.db.assessmentType?.toArray() ?? [];
  }

  /* Classification*/
  addBulkClassification(classfication: Classfication[]): Promise<number> {
    return this.db.classification.bulkPut(classfication);
  }

  getClassificationById(id: number): Promise<Classfication | undefined> {
    return this.db.classification.get(id);
  }

  getAllClassification(): Promise<Classfication[]> {
    return this.db.classification?.toArray() ?? [];
  }

  addClassification(classfication: Classfication): Promise<number> {
    return this.db.classification.add(classfication);
  }


  deletClassfication(id: number): Promise<void> {
    return this.db.classification.delete(id);
  }

  async deleteDatabase() {
    await this.db.delete({ disableAutoOpen: false });
  }

}
