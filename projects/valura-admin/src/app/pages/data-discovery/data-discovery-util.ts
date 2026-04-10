import { Status } from "./data-inventory/constant";


export const statusColors = (status: string): string => {
    switch (status) {
        case Status.ACTIVE:
            return `#E5F6FD`;
        case Status.INACTIVE:
            return `#FFDAD6`;
        default:
            return `#FFF4E5`;
    }
}

export const statusTextColors = (status: string): string => {
    switch (status) {
        case Status.ACTIVE:
            return `#014361`;
        case Status.INACTIVE:
            return `#410002`;
        default:
            return `#EDF7ED`;
    }
}
