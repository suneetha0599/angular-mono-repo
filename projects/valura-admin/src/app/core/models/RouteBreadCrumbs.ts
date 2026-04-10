export class RouteBreadCrumbs {
    id: string
    label: string
    url: string

    constructor({
        id = "",
        label = "",
        url = "",
    }) {
        this.id = id,
            this.label = label
        this.url = url
    }

}

