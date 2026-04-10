
export function getList(key: string) {
    let result: string | null = localStorage.getItem(key)
    try {
        let list = JSON.parse(result ?? '')
        return list ? list : []
    } catch (e) {
        return []
    }
}

export function getItem(key: string, isSession: boolean = false) {
    let result: string | null = isSession ? sessionStorage.getItem(key) : localStorage.getItem(key)
    if (result !== "") {
        try {
            return JSON.parse(result ?? '')
        }
        catch {
            return null
        }

    }
    return null
}

export function setItem(key: string, data: any, isSession: boolean = false) {
    if (data !== null)
        isSession ? sessionStorage.setItem(key, JSON.stringify(data)) : localStorage.setItem(key, JSON.stringify(data))
}

export function removeItem(key: string) {
    localStorage.removeItem(key)
}
