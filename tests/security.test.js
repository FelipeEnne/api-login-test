import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

async function setup() {
    const values = new Map();
    const context = vm.createContext({
        localStorage: {
            getItem: key => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, value),
            removeItem: key => values.delete(key),
        },
        crypto: webcrypto, TextEncoder,
        setTimeout: callback => callback(),
        window: { fetch: () => Promise.reject(new Error('Unexpected network request')) },
    });
    const source = await readFile(new URL('../src/_helpers/fake-backend.js', import.meta.url), 'utf8');
    vm.runInContext(source.replace('export function', 'function'), context);
    vm.runInContext('configureFakeBackend()', context);
    const request = (url, method, body, token) => context.window.fetch(url, {
        method, body: JSON.stringify(body), headers: { Authorization: `Bearer ${token}` },
    });
    const register = () => request('/users/register', 'POST', {
        username: 'alice', password: 'test-only-password', firstName: 'Alice', lastName: 'Test',
    });
    const login = async () => JSON.parse(await (await request('/users/authenticate', 'POST', {
        username: 'alice', password: 'test-only-password',
    })).text());
    return { context, request, register, login };
}

test('logout revokes a token in the running backend', async () => {
    const { context, request, register, login } = await setup();
    await register();
    const user = await login();
    context.localStorage.setItem('user', JSON.stringify(user));
    const service = await readFile(new URL('../src/_services/user.service.js', import.meta.url), 'utf8');
    vm.runInContext(service.replace(/^import .*;$/m, '').replace('export const', 'const'), context);
    vm.runInContext('logout()', context);
    await assert.rejects(request('/users', 'GET', null, user.token), error => error === 'Unauthorised');
    const newSession = await login();
    assert.ok((await request('/users', 'GET', null, newSession.token)).ok);
    await assert.rejects(request('/users', 'GET', null, user.token), error => error === 'Unauthorised');
});

test('deleted account tokens cannot access a newly registered account with the same ID', async () => {
    const { request, register, login } = await setup();
    await register();
    const first = await login();
    const second = await login();
    await request(`/users/${first.id}`, 'DELETE', null, first.token);
    await register();
    for (const token of [first.token, second.token]) {
        await assert.rejects(request('/users', 'GET', null, token), error => error === 'Unauthorised');
    }
});
