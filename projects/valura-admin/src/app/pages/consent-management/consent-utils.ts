import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { WidgetType } from "@admin-core/constants/widget-types";
import { routes as routeConstants } from '@admin-core/constants/routes';
import { BTN_ADD_PURPOSE, BTN_CATEGORY, BTN_TERM } from "./constants";

export const buildConsentFormArray = (fb: FormBuilder, propertyList: any[], mode: number, consentType: string) => {
    return fb.array(
        propertyList.map((nodeProperty: any) =>
            buildConsentForm(fb, nodeProperty, mode, consentType)
        )
    );
};

export const buildConsentForm = (fb: FormBuilder, property: any, mode: number, consentType: string) => {

    let propertyForm: FormGroup = fb.group({
        propertyName: [property.propertyName],
        componentLabel: [property.componentLabel],
        componentTypeRid: [property.componentTypeRid],
        propertyRid: [property.propertyRid],
        consentType: consentType,
        hidePropName: [property?.hidePropName ?? false],
    });

    switch (property.componentTypeRid) {

        case WidgetType.DATE_TIME: {

            propertyForm.addControl('value', new FormControl(''));
            propertyForm.addControl('valueRid', new FormControl(0));
            return propertyForm;
        }

        case WidgetType.DROP_DOWN:
        case WidgetType.RADIO_BUTTON: {
            propertyForm.addControl('value', new FormControl(''));
            propertyForm.addControl('valueRid', new FormControl(0));
            return propertyForm;
        }

        case WidgetType.TEXT_AREA:
        case WidgetType.TEXT_ALPHA_NUMERIC:
        case WidgetType.TEXT_NUMERIC: {

            propertyForm.addControl('value', new FormControl(''));
            propertyForm.addControl('valueRid', new FormControl(0));
            propertyForm.addControl('propertyValueList', fb.array([]));
            propertyForm.addControl('subPropertyList', fb.array([]));

            if (property?.propertyValueList?.length > 0) {
                propertyForm.addControl('propertyValueList', buildConsentFormArray(fb, property.propertyValueList, 1, consentType))
            }

            if (property?.subPropertyList?.length > 0) {
                const valueControl = buildConsentFormArray(fb, property.subPropertyList, 1, consentType);
                propertyForm.setControl('subPropertyList', valueControl)
            }
            return propertyForm;
        }

        case WidgetType.SINGLE_IMAGE: {
            propertyForm.addControl('value', new FormControl(''));
            propertyForm.addControl('valueRid', new FormControl(0));

            return propertyForm;
        }

        case WidgetType.MULTI_SELECT:
        case WidgetType.CHECK_BOX: {
            propertyForm.addControl('value', new FormControl(''));
            propertyForm.addControl('valueRid', new FormControl(0));
            return propertyForm;
        }
        case WidgetType.DYNAMIC_FORM: {
            propertyForm.addControl('value', new FormControl(''));
            propertyForm.addControl('value2', new FormControl(''));
            propertyForm.addControl('valueRid', new FormControl(0));
            propertyForm.addControl('propertyValueList', fb.array([]));
            propertyForm.addControl('subPropertyList', fb.array([]));

            return propertyForm;
        }

        case WidgetType.TEXT_BUTTON:
        case WidgetType.BUTTON: {
            propertyForm.addControl('value', new FormControl(''));
            propertyForm.addControl('valueRid', new FormControl(0));
            propertyForm.addControl('buttonType', new FormControl(property?.buttonType ?? ''));
            return propertyForm;
        }

        default: {
            propertyForm.addControl('value', new FormControl(''));
            propertyForm.addControl('valueRid', new FormControl(0));
            return propertyForm;
        }
    }
};



export const purposeMasterList = [{
    propertyName: "Add title to the purpose",
    componentTypeRid: 6,
    propertyRid: 1,
    consentType: routeConstants.CONSENT_MANAGEMENT_PURPOSE
},
{
    propertyName: "Purpose Description",
    componentTypeRid: 4,
    propertyRid: 2,
    consentType: routeConstants.CONSENT_MANAGEMENT_PURPOSE
},
{
    propertyName: "Add term page",
    componentLabel: "Add term page",
    componentTypeRid: 16,
    hidePropName: true,
    buttonType: BTN_TERM,
    propertyRid: 3,
    consentType: routeConstants.CONSENT_MANAGEMENT_PURPOSE
},
{
    propertyName: "Set expiry",
    componentTypeRid: 2,
    propertyRid: 4,
    consentType: routeConstants.CONSENT_MANAGEMENT_PURPOSE
},
{
    propertyName: "Personal Data Elements",
    componentLabel: "Add Personal Data Elements",
    componentTypeRid: 16,
    buttonType: BTN_CATEGORY,
    propertyRid: 5,
    consentType: routeConstants.CONSENT_MANAGEMENT_PURPOSE
},
{
    propertyName: "Input Type",
    componentLabel: "Choose how user will give their consents",
    componentTypeRid: 15,
    propertyRid: 6,
    consentType: routeConstants.CONSENT_MANAGEMENT_PURPOSE
},
{
    propertyName: "Mark this purpose as mandatory",
    componentLabel: "",
    componentTypeRid: 1,
    propertyRid: 6,
    consentType: routeConstants.CONSENT_MANAGEMENT_PURPOSE
},
{
    propertyName: "Apply data policy or regulations",
    componentLabel: "",
    componentTypeRid: 1,
    propertyRid: 7,
    consentType: routeConstants.CONSENT_MANAGEMENT_PURPOSE
}]

export const templateMasterList = [{
    propertyName: "Template Name",
    componentTypeRid: 6,
    propertyRid: 1,
    consentType: routeConstants.CONSENT_MANAGEMENT_TEMPLATES
},
{
    propertyName: "Template Scenario",
    componentTypeRid: 4,
    propertyRid: 2,
    subPropertyList: [{
        propertyName: "Template Description",
        componentTypeRid: 4,
        propertyRid: 2,
        consentType: routeConstants.CONSENT_MANAGEMENT_TEMPLATES
    }],
    consentType: routeConstants.CONSENT_MANAGEMENT_TEMPLATES
},
{
    propertyName: "Select upstream",
    componentTypeRid: 2,
    propertyRid: 4,
    consentType: routeConstants.CONSENT_MANAGEMENT_TEMPLATES
},
{
    propertyName: "Purposes",
    componentLabel: "Add purposes",
    componentTypeRid: 16,
    buttonType: BTN_ADD_PURPOSE,
    propertyRid: 5,
    consentType: routeConstants.CONSENT_MANAGEMENT_TEMPLATES
},
{
    propertyName: "Add form to this template",
    componentLabel: "",
    componentTypeRid: 1,
    propertyRid: 6,
    consentType: routeConstants.CONSENT_MANAGEMENT_TEMPLATES
},
{
    propertyName: "Choose form",
    componentLabel: "",
    componentTypeRid: 2,
    propertyRid: 6,
    consentType: routeConstants.CONSENT_MANAGEMENT_TEMPLATES
},
{
    propertyName: "View form",
    componentLabel: "View form",
    hidePropName: true,
    componentTypeRid: 16,
    propertyRid: 6,
    consentType: routeConstants.CONSENT_MANAGEMENT_TEMPLATES
}]

export const formMasterList = [
    {
        propertyName: "",
        componentTypeRid: 17,
        propertyRid: 2,
        consentType: routeConstants.CONSENT_MANAGEMENT_FORMS
    }]

export const recordsMasterList = [{
    propertyName: "First name",
    componentTypeRid: 6,
    propertyRid: 1,
    consentType: routeConstants.CONSENT_MANAGEMENT_RECORDS,
    subPropertyList: [{
        propertyName: "Last name",
        componentTypeRid: 6,
        propertyRid: 1,
        consentType: routeConstants.CONSENT_MANAGEMENT_RECORDS
    }],
},
{
    propertyName: "DS email ID",
    componentTypeRid: 6,
    propertyRid: 3,
    consentType: routeConstants.CONSENT_MANAGEMENT_RECORDS,
    subPropertyList: [{
        propertyName: "Phone number",
        componentTypeRid: 6,
        propertyRid: 1,
        consentType: routeConstants.CONSENT_MANAGEMENT_RECORDS
    }],
},
{
    propertyName: "Reference ID",
    componentTypeRid: 5,
    propertyRid: 1,
    consentType: routeConstants.CONSENT_MANAGEMENT_RECORDS,
    subPropertyList: [{
        propertyName: "Choose Purpose",
        componentTypeRid: 2,
        propertyRid: 1,
        consentType: routeConstants.CONSENT_MANAGEMENT_RECORDS
    }],
}]
