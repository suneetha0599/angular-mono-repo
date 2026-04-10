import { Status } from "./constant";

export const statusColors = (status: string): string => {
  switch (status) {
    case Status.ACTIVE:
      return `#EDF7ED`;
    case Status.INACTIVE:
      return `#FFDAD6`;
    default:
      return `#FFF4E5`;
  }
}

export const statusTextColors = (status: string): string => {
  switch (status) {
    case Status.ACTIVE:
      return `#1E4620`;
    case Status.INACTIVE:
      return `#410002`;
    case Status.APPROVED:
      return `#014361`;
    default:
      return `#EDF7ED`;
  }
}
