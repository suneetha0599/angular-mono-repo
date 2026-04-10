export class Feature {
    fmRid: number
    featureCode: string
    featureName: string
    featureIcon: string
    featureRoute: string
    parentFmRid: number
    status: number
    featureType: number
    subFeatureList: Feature[]
    hasSubMenu: boolean
    actionMessage: string
    isOpen: boolean
    key: number
    permissionCode: string
     extraParams?: {                   
        section?: string;
        conversationParentEntityId?: string;
        conversationEntityId?: string;
        conversationId?: string;
    }
    queryParams?: Record<string, any>

    constructor(
        fmRid: number,
        featureCode: string,
        featureName: string,
        featureIcon: string,
        featureRoute: string,
        parentFmRid: number,
        status: number,
        featureType: number,
        subFeatureList: Feature[],
        hasSubMenu = false,
        actionMessage = '',
        isOpen = false,
        key = 0,
        permissionCode = '',

    ) {
        this.fmRid = fmRid
        this.featureCode = featureCode
        this.featureName = featureName
        this.featureIcon = featureIcon
        this.featureRoute = featureRoute
        this.parentFmRid = parentFmRid
        this.status = status
        this.featureType = featureType
        this.subFeatureList = subFeatureList
        this.hasSubMenu = hasSubMenu
        this.actionMessage = actionMessage
        this.isOpen = isOpen
        this.key = key
        this.permissionCode = permissionCode
    }

}

