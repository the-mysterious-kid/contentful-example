import axios from "axios";
// import Keys from 'react-native-keys';
// import i18n from "../context/Language/i18n";
// import { PromiseRequestProps } from "../constants/utils";

const networkApi = (
    url: string,
    method: string = "GET",
    body: object = {},
    headers: object = {}
) => {
    const headerParam = {
        Accept: "application/json",
        Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYjI4NTljZWMyMzhhNDEwYzUxZjE5NjE3ODlkYjUxYTE0ZjViZmUxNzJhZTMzYTUwMDg5YTI5MzM1MDJhOThjNzVjODM3Njc0MjRlZGQxZTciLCJpYXQiOjE3NTI0NjcyMjcuMjE3NDUsIm5iZiI6MTc1MjQ2NzIyNy4yMTc0NTIsImV4cCI6MTg0NzE2MTYyNy4wNjc4NjYsInN1YiI6IjciLCJzY29wZXMiOltdfQ.N3JKcnVf5m75XfS7gzSldPnAPrOGfX5pM83MpJQpE3zYqxfMrQb0u7k8tAFwXgnhsJTu7L0PCpHgm3BM6HU93nBtbNwx2jktmVf3POfD6iZybelfrgoJmV4QYNppFNgZ7Ohh9D4UHptAr6Zc0mUWsoPGpaOcqxwk7qhaxQf9ByONKnCILF37YmN1gcivKYITmlfcpvhUcY2ZlbK7pi23b4atJELVTRv-qz9pZV1Pyjgl84dkhPPQvhkKc12HSK46ZIGUE6sDiHGinl9LmUyRkG94DbOmDhXltBWUETohcnQ6mKRzBaFH9RT-fNtrozxBR5JEtTOdiySqBLuoCdxXnXPpUJdSE8CRbg-TQQSS3t5Y2Czul4OlF27Z5VwUF8nPcwnsnAS2l1YVcuf32xlAicYgjScqNSb1mkFjIWCCTsjdzjyY-_dEBpBgUZHjKhbENjvAn0EuFE6qJISorIQJQ3Mjqvox3WD7JZWc8AaTpz2NHX3a0epkKVgoL2Pkdf8utfD4clY4QWVn_TEQSabl0HSCHavVkP8QJCu_amEfu7gMIgFpcw_704j7eAtgSjlgyDwZGlPfTjGNf5VR-rvyeMEhbygCY2Ko4RYz0ewV25k2wqXNsk0wyrQUdn61eA3__H3Ad1SaUgCGofmOg75qHyaQSKtdWjB6duyS6QodQ0w",
        ...headers,
    };

    return new Promise((resolve, reject) => {
        const request = {
            method: method.toUpperCase(),
            url,
            headers: headerParam,
        };
        if (method.toUpperCase() !== "GET") {
            request.data = body;
        }
        axios(request)
            .then(response => {
                switch (response.status) {
                    case 200:
                        resolve(response);
                        break;
                    case 201:
                        resolve(response);
                        break
                    case 204:
                        resolve(response);
                        break
                    case 422:
                        resolve(response);
                        break;
                    default:
                        reject(response);
                        break;
                }
            })
            .catch(error => {
                console.log("Promise_error", JSON.stringify(error))
                reject(error);
            })
    });
}

export { networkApi };
