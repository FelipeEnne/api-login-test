// array in local storage for registered users
let users = JSON.parse(localStorage.getItem('users')) || [];

// map of active session tokens -> userId, persisted so sessions survive page refreshes
let tokens = JSON.parse(localStorage.getItem('tokens')) || {};

// hash a value with SHA-256 so passwords are never stored/compared in clear text
async function hash(value) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// generate a cryptographically strong, unguessable session token
function generateToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// resolve the userId associated with the bearer token in the request headers
function authenticatedUserId(opts) {
    const header = opts.headers && opts.headers.Authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return null;
    }
    const token = header.slice('Bearer '.length);
    return Object.prototype.hasOwnProperty.call(tokens, token) ? tokens[token] : null;
}

// strip sensitive fields (e.g. password hash) before returning a user to the client
function sanitize(user) {
    if (!user) {
        return user;
    }
    const { password, ...safe } = user;
    return safe;
}

export function configureFakeBackend() {
    let realFetch = window.fetch;
    window.fetch = function (url, opts) {
        return new Promise((resolve, reject) => {
            // wrap in timeout to simulate server api call
            setTimeout(async () => {

                // authenticate
                if (url.endsWith('/users/authenticate') && opts.method === 'POST') {
                    // get parameters from post request
                    let params = JSON.parse(opts.body);

                    // find if any user matches login credentials
                    let passwordHash = await hash(params.password);
                    let filteredUsers = users.filter(user => {
                        return user.username === params.username && user.password === passwordHash;
                    });

                    if (filteredUsers.length) {
                        // if login details are valid return user details and a fresh session token
                        let user = filteredUsers[0];
                        let token = generateToken();
                        tokens[token] = user.id;
                        localStorage.setItem('tokens', JSON.stringify(tokens));

                        let responseJson = {
                            id: user.id,
                            username: user.username,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            token: token
                        };
                        resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(responseJson)) });
                    } else {
                        // else return error
                        reject('Username or password is incorrect');
                    }

                    return;
                }

                // get users
                if (url.endsWith('/users') && opts.method === 'GET') {
                    // check for a valid session token, this security is implemented server side in a real application
                    if (authenticatedUserId(opts) !== null) {
                        resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(users.map(sanitize)))});
                    } else {
                        // return 401 not authorised if token is null or invalid
                        reject('Unauthorised');
                    }

                    return;
                }

                // get user by id
                if (url.match(/\/users\/\d+$/) && opts.method === 'GET') {
                    // check for a valid session token, this security is implemented server side in a real application
                    if (authenticatedUserId(opts) !== null) {
                        // find user by id in users array
                        let urlParts = url.split('/');
                        let id = parseInt(urlParts[urlParts.length - 1]);
                        let matchedUsers = users.filter(user => { return user.id === id; });
                        let user = matchedUsers.length ? matchedUsers[0] : null;

                        // respond 200 OK with user (without sensitive fields)
                        resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(sanitize(user)))});
                    } else {
                        // return 401 not authorised if token is null or invalid
                        reject('Unauthorised');
                    }

                    return;
                }

                // register user
                if (url.endsWith('/users/register') && opts.method === 'POST') {
                    // get new user object from post body
                    let newUser = JSON.parse(opts.body);

                    // validation
                    let duplicateUser = users.filter(user => { return user.username === newUser.username; }).length;
                    if (duplicateUser) {
                        reject('Username "' + newUser.username + '" is already taken');
                        return;
                    }

                    // save new user with a hashed password (never store the plain password)
                    newUser.password = await hash(newUser.password);
                    newUser.id = users.length ? Math.max(...users.map(user => user.id)) + 1 : 1;
                    users.push(newUser);
                    localStorage.setItem('users', JSON.stringify(users));

                    // respond 200 OK
                    resolve({ ok: true, text: () => Promise.resolve() });

                    return;
                }

                // delete user
                if (url.match(/\/users\/\d+$/) && opts.method === 'DELETE') {
                    // check for a valid session token, this security is implemented server side in a real application
                    if (authenticatedUserId(opts) !== null) {
                        // find user by id in users array
                        let urlParts = url.split('/');
                        let id = parseInt(urlParts[urlParts.length - 1]);
                        for (let i = 0; i < users.length; i++) {
                            let user = users[i];
                            if (user.id === id) {
                                // delete user
                                users.splice(i, 1);
                                localStorage.setItem('users', JSON.stringify(users));
                                break;
                            }
                        }

                        // respond 200 OK
                        resolve({ ok: true, text: () => Promise.resolve() });
                    } else {
                        // return 401 not authorised if token is null or invalid
                        reject('Unauthorised');
                    }

                    return;
                }

                // pass through any requests not handled above
                realFetch(url, opts).then(response => resolve(response));

            }, 500);
        });
    }
}
