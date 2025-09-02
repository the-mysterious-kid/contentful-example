// import Keys from 'react-native-keys';

// const apiUrl = () => {
//     return `${Keys.secureFor('BASE_URL')}`
// }

const laravelApi = () => {
    return 'https://mappdev.educationcity.qa/api/v2/'
}

const url = {
    laravelApi
    // apiUrl, laravelApi
}
const urlEndPoints = {
    getPlanList: `plan/list`,
    activitiesList: (page: string) => {
        return `activities_filter?page=${page}`
    }
}

export {
    url,
    urlEndPoints,
}