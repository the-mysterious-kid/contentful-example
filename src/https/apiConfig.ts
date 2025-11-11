// import Keys from 'react-native-keys';

// const apiUrl = () => {
//     return `${Keys.secureFor('BASE_URL')}`
// }

const laravelApi = () => {
    return 'https://mappdev.educationcity.qa'
}

const url = {
    laravelApi
    // apiUrl, laravelApi
}
const urlEndPoints = {
    getPlanList: `/api/plan/list`,
    activitiesList: (page: string) => {
        return `/api/v2/activities_filter?page=${page}`
    },
    activitiesDetail: (id: string) => {
        return `/api/v3/event/${id}`
    }
}

export {
    url,
    urlEndPoints,
}