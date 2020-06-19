import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { combineReducers } from 'redux';

import { users } from './users'
import { alert } from './alert'
import { authentication } from './authentication'
import { registration } from './registration'


const loggerMiddleware = createLogger();

const rootReducer = combineReducers({
    users,
    alert,
    authentication,
    registration,
});

export const store = createStore(
    rootReducer,
    applyMiddleware(
        thunkMiddleware,
        loggerMiddleware
    )
);