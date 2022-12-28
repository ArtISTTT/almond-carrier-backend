import { initializeOrderStatuses } from './initilizeOrderStatuses';
import { initializeRoles } from './initilizeRoles';

export const initializeDB = () => {
    initializeRoles();
    initializeOrderStatuses();
};
