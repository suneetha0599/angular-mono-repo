import { STATUS_FAILED, STATUS_NO_RECORDS, STATUS_SUCCESS } from "../../constants/api-constants"

export class ApiResponse {
    success: boolean
    data: any
    error: string
    message: string
    recordCount: number
    requestId: string

    constructor({
        success = STATUS_FAILED,
        data = null,
        error = '',
        message = '',
        recordCount = STATUS_NO_RECORDS,
        requestId = ''
    }) {
        this.success = success
        this.data = data
        this.error = error
        this.message = success && !message && error ? 'Unhandled api error' : message
        this.recordCount = recordCount
        this.requestId = requestId
    }

    get isSuccess() {
        return this.success
    }

    get showSuccesSnackBar() {
        return (this.isSuccess && this.message && typeof this.message === 'string' ? true : false)
    }

    get showErrorSnackbar() {
        return !this.isSuccess && this.message
    }
}