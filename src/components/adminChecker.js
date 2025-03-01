import Cookies from 'js-cookie'; // Recommended cookie management library
import {jwtDecode} from 'jwt-decode'; // Library to decode JWT tokens

export const isUserAdmin = () => {
    try {
        // Retrieve the JWT token from cookies
        const jwtToken = Cookies.get('jwt-token');

        // Check if token exists
        if (!jwtToken) {
            return false;
        }

        // Decode the token
        const decodedToken = jwtDecode(jwtToken);

        // Check if the token has an admin type
        return decodedToken.type === 'admin';

    } catch (error) {
        // Handle potential decoding errors or missing token
        console.error('Admin authentication check failed:', error);
        return false;
    }
};