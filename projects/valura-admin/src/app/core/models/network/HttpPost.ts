export interface HttpPost {
    queryUrl: string
    params?: any
    body?: any
    file?: any,
    showSnackBar?: boolean
    showSnackBarOnError?: boolean
    showLoadingBar?: boolean
    defaultServerUrl? : boolean
}