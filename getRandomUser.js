const axios = require('axios');

async function getRandomUser() {
    try {
        const response = await axios.get('https://randomuser.me/api');
        const user = response.data.results[0];
        return {
            nombre: `${user.name.first} ${user.name.last}`,
            email: user.email
        };
    } catch (error) {
        console.error('Error fetching random user:', error);
        throw error;
    }
}

module.exports = getRandomUser;
